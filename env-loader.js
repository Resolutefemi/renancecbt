(function() {
  const defaults = {
    SUPABASE_URL: 'https://ubxsywaxdvkhiqepcvmq.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVieHN5d2F4ZHZraGlxZXBjdm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODcwMDAsImV4cCI6MjA4NzU2MzAwMH0.gkR3Aud3LRLNyNwpDHJTT0vIrWCnQkSBkFSaFjQ5qy4',
    GEMINI_API_KEY: 'AIzaSyBFqhMxNVNdti-8HFjVvxOFCiRKWnUfiZs'
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

  function wrapSupabaseClient(client) {
    const originalFrom = client.from;
    client.from = function(tableName) {
      if (tableName === 'test_results') {
        return createMockTestResultsQuery(client);
      }
      return originalFrom.apply(this, arguments);
    };
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

    // 1. Handle Insert
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
          await client.from('students').update({
            tests_taken: testsTaken,
            avg_score: avgScore
          }).eq('id', userId);
        } catch (e) {
          console.error('Failed to sync aggregate stats to students table:', e);
        }
      }

      return { data: rows, error: null };
    }

    // 2. Handle Select
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
})();
