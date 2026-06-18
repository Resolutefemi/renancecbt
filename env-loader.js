(function() {
  const defaults = {
    SUPABASE_URL: 'https://ubxsywaxdvkhiqepcvmq.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVieHN5d2F4ZHZraGlxZXBjdm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODcwMDAsImV4cCI6MjA4NzU2MzAwMH0.gkR3Aud3LRLNyNwpDHJTT0vIrWCnQkSBkFSaFjQ5qy4',
    GEMINI_API_KEY: 'AQ.Ab8RN6L0U0Oc8GrQf8oPlXk6_IAZaL2kqpI68FeCrjyf5VRloA'
  };

  window.env = { ...defaults };

  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/.env', false); // Synchronous request
    xhr.send();
    if (xhr.status === 200) {
      const lines = xhr.responseText.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed.includes('=')) return;
        const index = trimmed.indexOf('=');
        const k = trimmed.substring(0, index).trim();
        let v = trimmed.substring(index + 1).trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
        if (k) window.env[k] = v;
      });
    }
  } catch (e) {
    // Expected to fail on file:// protocol, fallback will be used
  }

  // Intercept window.supabase to redirect test_results queries to localStorage
  let _supabase = undefined;
  Object.defineProperty(window, 'supabase', {
    configurable: true,
    enumerable: true,
    get() {
      return _supabase;
    },
    set(val) {
      if (val && !val._wrapped) {
        _supabase = wrapSupabaseLib(val);
      } else {
        _supabase = val;
      }
    }
  });

  function wrapSupabaseLib(lib) {
    const originalCreateClient = lib.createClient;
    lib.createClient = function(url, key, options) {
      const client = originalCreateClient.apply(this, arguments);
      return wrapSupabaseClient(client);
    };
    lib._wrapped = true;
    return lib;
  }

  let activeClient = null;

  function wrapSupabaseClient(client) {
    if (client._originalFrom) {
      activeClient = client;
      return client;
    }
    client._originalFrom = client.from;
    client.from = function(tableName) {
      if (tableName === 'test_results') {
        return createMockTestResultsQuery(client);
      }
      return client._originalFrom.apply(this, arguments);
    };
    activeClient = client;
    return client;
  }

  function createMockTestResultsQuery(client) {
    const queryState = {
      filters: {},
      insertedRows: null
    };

    const builder = {
      select(cols) {
        return this;
      },
      eq(field, val) {
        queryState.filters[field] = val;
        return this;
      },
      insert(rows) {
        queryState.insertedRows = rows;
        return this;
      },
      async then(onfulfilled, onrejected) {
        try {
          const result = await executeQuery(client, queryState);
          return onfulfilled(result);
        } catch (err) {
          if (onrejected) return onrejected(err);
          throw err;
        }
      }
    };

    return builder;
  }

  async function executeQuery(client, queryState) {
    let userId = null;
    try {
      const { data: { user } } = await client.auth.getUser();
      if (user) userId = user.id;
    } catch (e) {}

    // 1. Handle Insert (saves locally and syncs to Supabase)
    if (queryState.insertedRows) {
      const rows = queryState.insertedRows;
      let localResults = [];
      try {
        localResults = JSON.parse(localStorage.getItem('renance_local_results') || '[]');
      } catch (e) {}

      rows.forEach(row => {
        localResults.push({
          student_id: row.student_id || userId,
          course_id: row.course_id,
          score: Number(row.score),
          created_at: new Date().toISOString()
        });
      });

      localStorage.setItem('renance_local_results', JSON.stringify(localResults));

      // Calculate aggregates for current user
      const userResults = localResults.filter(r => r.student_id === userId);
      const testsTaken = userResults.length;
      const avgScore = testsTaken > 0
        ? Math.round(userResults.reduce((sum, r) => sum + r.score, 0) / testsTaken)
        : 0;

      // Sync summary details to students table in the database
      if (userId) {
        try {
          await client._originalFrom.call(client, 'students').update({
            tests_taken: testsTaken,
            avg_score: avgScore
          }).eq('id', userId);
        } catch (e) {
          console.error('Failed to sync aggregate stats to students table:', e);
        }
      }

      // Sync detailed score to Supabase test_results table for course leaderboards!
      if (userId) {
        try {
          await client._originalFrom.call(client, 'test_results').insert(
            rows.map(r => ({
              student_id: userId,
              course_id: r.course_id,
              score: Number(r.score)
            }))
          );
        } catch (e) {
          console.error('Failed to sync detailed score to test_results table:', e);
        }
      }

      return { data: rows, error: null };
    }

    // 2. Handle Select (Course Leaderboard queries fetch from database, others from localStorage)
    const isCourseLeaderboard = queryState.filters.course_id && !queryState.filters.student_id;
    if (isCourseLeaderboard) {
      try {
        // Query the real database table
        const { data, error } = await client._originalFrom.call(client, 'test_results')
          .select('score, student_id')
          .eq('course_id', queryState.filters.course_id);
        if (error) throw error;
        return { data: data || [], error: null };
      } catch (err) {
        console.error('Real database course leaderboard fetch failed:', err);
        return { data: [], error: err };
      }
    }

    // Standard query filters by student_id, read from local storage
    let localResults = [];
    try {
      localResults = JSON.parse(localStorage.getItem('renance_local_results') || '[]');
    } catch (e) {}

    let filtered = localResults;
    if (queryState.filters.student_id) {
      filtered = filtered.filter(r => r.student_id === queryState.filters.student_id);
    }
    if (queryState.filters.course_id) {
      filtered = filtered.filter(r => r.course_id === queryState.filters.course_id);
    }

    const data = filtered.map(r => ({ score: r.score }));
    return { data, error: null };
  }

  // Dynamic Course Leaderboard Modal & Button Injection
  async function showCourseLeaderboard() {
    const modal = document.getElementById('courseLeaderboardModal');
    const listEl = document.getElementById('courseLeaderboardList');
    const loaderEl = document.getElementById('courseLeaderboardLoader');
    const titleEl = document.getElementById('courseLeaderboardTitle');

    if (!modal) return;
    modal.style.display = 'flex';
    if (listEl) listEl.style.display = 'none';
    if (loaderEl) loaderEl.style.display = 'block';

    let courseCode = 'Course';
    try {
      if (typeof COURSE_CODE !== 'undefined') {
        courseCode = COURSE_CODE;
      } else {
        // Fallback: parse from URL
        const match = window.location.pathname.match(/\/([a-z0-9]+)\.html/i);
        if (match) {
          const raw = match[1];
          const letters = raw.replace(/[0-9]/g, '').toUpperCase();
          const numbers = raw.replace(/[^0-9]/g, '');
          courseCode = letters + ' ' + numbers;
        }
      }
    } catch (e) {}

    if (titleEl) titleEl.innerText = `${courseCode} Leaderboard`;

    try {
      const client = activeClient || window._sb || (window.supabase ? window.supabase.createClient(window.env.SUPABASE_URL, window.env.SUPABASE_KEY) : null);
      if (!client) throw new Error('Supabase client not initialized');

      // Fetch course results (interceptor bypass or normal fetch matches this tableName)
      const { data: results, error: resErr } = await client.from('test_results')
        .select('score, student_id')
        .eq('course_id', courseCode);

      if (resErr) throw resErr;

      if (!results || results.length === 0) {
        if (listEl) {
          listEl.innerHTML = `<p style="font-size: 0.85rem; text-align: center; color: var(--text-muted, #94a3b8); padding: 20px 0;">No scores recorded yet for this course. Be the first to practice! 🚀</p>`;
        }
      } else {
        // Find best score for each student
        const bestScores = {};
        results.forEach(row => {
          const sid = row.student_id;
          const score = Number(row.score || 0);
          if (!bestScores[sid] || score > bestScores[sid]) {
            bestScores[sid] = score;
          }
        });

        const studentIds = Object.keys(bestScores);

        // Fetch student profiles
        const { data: students, error: studErr } = await client._originalFrom.call(client, 'students')
          .select('id, fullname, department')
          .in('id', studentIds);

        if (studErr) throw studErr;

        // Merge and sort
        const leaderboardData = (students || []).map(s => ({
          id: s.id,
          fullname: s.fullname || 'Anonymous Student',
          department: s.department || 'N/A',
          score: bestScores[s.id] || 0
        }));

        leaderboardData.sort((a, b) => b.score - a.score);

        // Render
        if (listEl) {
          listEl.innerHTML = '';
          leaderboardData.forEach((student, index) => {
            const initials = (() => {
              if (!student.fullname) return '??';
              const parts = student.fullname.trim().split(/\s+/).filter(Boolean);
              return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
            })();
            
            let rankDisp = `#${index + 1}`;
            if (index === 0) rankDisp = '🥇';
            else if (index === 1) rankDisp = '🥈';
            else if (index === 2) rankDisp = '🥉';

            const rowHtml = `
              <div class="course-leaderboard-row" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, #334155);">
                <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
                  <div style="width: 24px; font-weight: 800; font-size: 0.85rem; color: var(--text-muted, #94a3b8); text-align: center; flex-shrink: 0;">${rankDisp}</div>
                  <div style="width: 32px; height: 32px; border-radius: 8px; background: ${index === 0 ? '#fbbf24' : (index === 1 ? '#94a3b8' : (index === 2 ? '#b45309' : '#2563eb'))}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0;">${initials}</div>
                  <div style="min-width: 0; flex: 1;">
                    <p style="font-size: 0.85rem; font-weight: 600; color: var(--text-main, #f8fafc); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;">${student.fullname}</p>
                    <p style="font-size: 0.68rem; color: var(--text-muted, #94a3b8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${student.department}</p>
                  </div>
                </div>
                <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-main, #f8fafc); margin-left: 8px; flex-shrink: 0;">${student.score}%</div>
              </div>
            `;
            listEl.insertAdjacentHTML('beforeend', rowHtml);
          });
        }
      }
    } catch (err) {
      console.error('Error fetching course leaderboard:', err);
      if (listEl) {
        listEl.innerHTML = `<p style="font-size: 0.85rem; text-align: center; color: var(--text-muted, #94a3b8); padding: 20px 0;">Failed to load leaderboard. Please try again.</p>`;
      }
    } finally {
      if (loaderEl) loaderEl.style.display = 'none';
      if (listEl) listEl.style.display = 'flex';
    }
  }

  window.showCourseLeaderboard = showCourseLeaderboard;
  window.closeCourseLeaderboard = function() {
    const modal = document.getElementById('courseLeaderboardModal');
    if (modal) modal.style.display = 'none';
  };

  window.addEventListener('click', function(e) {
    const modal = document.getElementById('courseLeaderboardModal');
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const setupScreen = document.getElementById('setup-screen');
    if (setupScreen) {
      const startBtn = setupScreen.querySelector('button[onclick^="startPractice"]');
      const startBtn2 = setupScreen.querySelector('button[onclick^="startExam"]');
      const targetBtn = startBtn || startBtn2;
      
      if (targetBtn) {
        const parent = targetBtn.parentElement;
        const lbBtn = document.createElement('button');
        lbBtn.className = 'btn';
        lbBtn.style.background = '#eab308';
        lbBtn.style.color = '#000';
        lbBtn.style.fontWeight = '700';
        lbBtn.style.minWidth = '160px';
        lbBtn.style.display = 'inline-flex';
        lbBtn.style.alignItems = 'center';
        lbBtn.style.justifyContent = 'center';
        lbBtn.style.gap = '8px';
        lbBtn.innerHTML = '<i class="fa-solid fa-trophy"></i> Course Leaderboard';
        lbBtn.onclick = showCourseLeaderboard;
        
        parent.appendChild(lbBtn);
      }

      const style = document.createElement('style');
      style.textContent = `
        .course-leaderboard-row {
          transition: background-color 0.2s;
        }
        .course-leaderboard-row:hover {
          background-color: rgba(255, 255, 255, 0.02);
        }
      `;
      document.head.appendChild(style);

      const modalHtml = `
        <div id="courseLeaderboardModal" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.75); backdrop-filter:blur(6px); z-index:99999; align-items:center; justify-content:center; padding:20px; font-family:'Inter', sans-serif;">
            <div style="background:var(--card-bg, #1e293b); border:1px solid var(--border-color, #334155); border-radius:24px; max-width:500px; width:100%; max-height:80vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 20px 25px -5px rgba(0,0,0,0.3);">
                <div style="padding:20px 24px; border-bottom:1px solid var(--border-color, #334155); display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="font-size:1.5rem; color:#eab308;">🏆</span>
                        <div>
                            <h3 id="courseLeaderboardTitle" style="font-size:1.15rem; font-weight:800; color:var(--text-main, #f8fafc); margin:0;">Course Leaderboard</h3>
                            <p style="font-size:0.75rem; color:var(--text-muted, #94a3b8); margin:3px 0 0 0;">Rankings for this course (highest scores)</p>
                        </div>
                    </div>
                    <button onclick="closeCourseLeaderboard()" style="background:rgba(255,255,255,0.06); border:none; color:var(--text-muted, #94a3b8); cursor:pointer; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:0.2s; font-size:1.3rem; line-height:1;">&times;</button>
                </div>
                <div id="courseLeaderboardBody" style="padding:24px; overflow-y:auto; flex-grow:1; display:flex; flex-direction:column; gap:12px;">
                    <div id="courseLeaderboardLoader" style="text-align:center; padding:30px 0; color:var(--text-muted, #94a3b8);">
                        <i class="fa-solid fa-circle-notch fa-spin" style="color:#2563eb; font-size:1.8rem; margin-bottom:10px;"></i>
                        <p style="font-size:0.85rem;">Loading scores...</p>
                    </div>
                    <div id="courseLeaderboardList" style="display:none; flex-direction:column; gap:10px;">
                    </div>
                </div>
            </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
  });
})();
