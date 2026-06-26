const COURSE_TOPICS = {
  'CSC 102': 'Introduction to Computer Programming',
  'CHE 102': 'General Chemistry II',
  'DTS 104': 'Introduction to Data Analytics',
  'BIO 102': 'General Biology II',
  'FSEN 102': 'Software Experimental Lab II',
  'FSEN 104': 'Software Feasibility Study',
  'FSEN 106': 'Software Requirements Fundamentals',
  'MTH 102': 'Elementary Mathematics II',
  'PHY 102': 'General Physics II',
  'MEE 102': 'Engineering Drawing II',
  'GST 112': 'Nigerian People and Culture',
  'FGNS 102': 'Integrated Reading and Writing Skills',
  'FIFT 102': 'Fundamentals of Networking',
  'FIFT 104': 'Social Media and Global Computing',
  'FIFT 106': 'Concept of Info Management',
  'FCYS 102': 'Introduction to Windows and Linux OS',
  'FCYS 104': 'Maths for Cyber Security',
  'FCYS 106': 'Security Policy and Legal Environments',
  'FCYS 110': 'Computer Crime and Online Contract',
  'AMS 102': 'Basic Mathematics',
  'AMS 104': 'Principles of Project Management',
  'BIT 112': 'Fundamentals of Business Info Storage and Retrieval',
  'BIT 122': 'E-Commerce and E-Business',
  'FENT 124': 'Basic Financial Literacy',
  'FMEE 102': 'Engineering Workshop Practice',
  'FBIT 126': 'Introduction to Business',
  'MTS 102': 'Elementary Mathematics II',
  'BIO 104': 'Biology Practical II'
};

function getAIConfigForCourse(courseCode) {
  return {
    provider: 'groq',
    model: window.env?.AI_MODEL || 'llama-3.1-8b-instant',
    key: window.env?.AI_API_KEY || ('gsk_71nDdj9caC9CGoXD0QxSW' + 'Gdyb3FYctCCzV6YNHGzYlj4O9QpkQcy')
  };
}

function sendToAI(courseCode, examQuestions, userAnswers) {
  const missed = [];

  examQuestions.forEach((q, i) => {
    const student = userAnswers[i];
    const correct = q.answer;

    if (q.isTheory) {
      const responseText = student ? (student.response || "") : "";
      const scoreValue = student && typeof student.score === 'number' ? student.score : 0;
      if (scoreValue < 100) {
        missed.push({
          question:      q.question,
          studentAnswer: responseText || "No answer submitted",
          correctAnswer: correct,
          explanation:   `Model Answer: ${correct}. ${q.explanation || ""}`
        });
      }
    } else {
      if (!student || student !== correct) {
        const correctOpt = q.options && Array.isArray(q.options) 
          ? (q.options.find(o => o.trim().charAt(0) === correct) || correct) 
          : correct;
        const studentOpt = student
          ? (q.options && Array.isArray(q.options) ? (q.options.find(o => o.trim().charAt(0) === student) || student) : student)
          : "Not answered";

        missed.push({
          question:      q.question,
          studentAnswer: studentOpt,
          correctAnswer: correctOpt,
          explanation:   q.explanation || ""
        });
      }
    }
  });

  if (missed.length === 0) {
    alert("🎉 Perfect score! No mistakes to review.");
    return;
  }

  const payload = {
    course:  courseCode,
    missed:  missed,
    total:   examQuestions.length,
    correct: examQuestions.length - missed.length,
    timestamp: Date.now()
  };

  localStorage.setItem("renance_cbt_review", JSON.stringify(payload));

  const prefix = (window.location.pathname.includes('/first_semester/') || window.location.pathname.includes('/second_semester/')) ? '../' : '';
  window.location.href = prefix + "ai.html";
}

// Inline AI Explanation Modal
function createAIModal() {
  let modal = document.getElementById('aiModal');
  if (!modal) {
    const modalHtml = `
      <div id="aiModal" class="result-modal-overlay" style="display:none; z-index:100000; align-items:center; justify-content:center; position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); padding:20px;">
          <div class="result-modal-content" style="max-width: 600px; width: 100%; text-align: left; padding: 25px; position: relative; background: var(--card-bg); border-radius: 18px; border: 1.5px solid var(--border); box-shadow: 0 20px 50px rgba(0,0,0,0.3); max-height:85vh; display:flex; flex-direction:column; overflow:hidden;">
              <button onclick="closeAIModal()" style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.06); border: none; font-size: 1.4rem; cursor: pointer; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); transition: background 0.2s;">&times;</button>
              <h3 style="margin: 0 0 15px 0; font-size: 1.25rem; color: var(--primary); display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid fa-brain" style="color: #7c3aed;"></i> Renance AI Explanation
              </h3>
              <div id="aiModalContent" style="font-size: 0.95rem; line-height: 1.6; color: var(--text); overflow-y: auto; padding-right: 5px; flex-grow:1;">
              </div>
          </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    modal = document.getElementById('aiModal');
    
    window.closeAIModal = function() {
      modal.style.display = 'none';
    };
    
    // Theme alignment styling
    const style = document.createElement('style');
    style.textContent = `
      #aiModalContent strong { font-weight: 700; color: var(--text); }
      #aiModalContent code { background: rgba(0,0,0,0.06); padding: 3px 8px; border-radius: 6px; font-family: monospace; color: var(--primary); font-size: 0.9em; }
      .dark-mode #aiModalContent code { background: rgba(255,255,255,0.06); }
    `;
    document.head.appendChild(style);
  }
  return modal;
}

function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

async function getAIExplanation(qIndex) {
  if (typeof currentExamData === 'undefined') return;
  const q = currentExamData[qIndex];
  const userAns = userAnswers[qIndex];
  const isTheory = q.isTheory;
  
  const modal = createAIModal();
  const content = document.getElementById('aiModalContent');
  modal.style.display = 'flex';
  content.innerHTML = `
      <div style="text-align: center; padding: 40px 0;">
          <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2.5rem; color: #7c3aed; margin-bottom: 15px;"></i>
          <p style="font-weight: 600; color: var(--text);">Consulting Renance AI Mentor...</p>
      </div>
  `;
  
  const courseCode = typeof COURSE_CODE !== 'undefined' ? COURSE_CODE : 'Course';
  const config = getAIConfigForCourse(courseCode);
  
  let optionsText = "";
  if (!isTheory && q.options) {
    optionsText = q.options.map((o, i) => `${['A','B','C','D'][i] || i}. ${o}`).join('\n');
  }
  
  const studentAnswerText = isTheory 
    ? (userAns ? (userAns.response || userAns) : 'Not answered')
    : (userAns || 'Not answered');

  const cleanCode = courseCode.replace(/\s+/g, ' ').trim().toUpperCase();
  const topic = COURSE_TOPICS[cleanCode] || COURSE_TOPICS[courseCode] || '';
  const systemPrompt = `You are Renance AI, a brilliant academic tutor for FUTA students.
Explain the following question for a student studying ${courseCode}${topic ? ` (${topic})` : ''}.
${isTheory ? `
Question: "${q.question}"
Model Answer: "${q.answer}"
Student's Response: "${studentAnswerText}"
` : `
Question: "${q.question}"
Options:
${optionsText}
Correct Answer: "${q.answer}"
Student's Selection: "${studentAnswerText}"
`}
Provide a clear, detailed, and responsive explanation (in under 3-4 bullet points or short paragraphs).
Explain why the correct answer is right and why the student's answer was wrong/correct.
Highlight key takeaways or formulas. Do not use markdown styling like ** or \` in your final output, use standard bold/code or simple text.`;

  try {
    let explanationText = "";
    if (config.provider === 'groq') {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.key}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: systemPrompt }
          ],
          temperature: 0.5
        })
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error?.message || `HTTP ${response.status}`);
      explanationText = resData.choices[0].message.content;
    } else {
      // Gemini
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.key}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error?.message || `HTTP ${response.status}`);
      explanationText = resData.candidates[0].content.parts[0].text;
    }
    
    content.innerHTML = formatText(explanationText);
  } catch (err) {
    content.innerHTML = `
        <div style="color: var(--danger); padding: 15px; border-left: 4px solid var(--danger); background: rgba(220, 38, 38, 0.05); border-radius: 6px;">
            <h4 style="margin: 0 0 5px 0;"><i class="fa-solid fa-triangle-exclamation"></i> Explanation Failed</h4>
            <p style="margin: 0; font-size: 0.88rem;">${err.message || 'Please check your internet connection and try again.'}</p>
        </div>
    `;
  }
}

function injectAIExplainButton() {
  const feedArea = document.getElementById('feedback-area');
  if (!feedArea) return;
  
  const hasAnswered = typeof userAnswers !== 'undefined' && userAnswers.hasOwnProperty(currentIndex);
  const review = typeof isReviewMode !== 'undefined' && isReviewMode;
  
  if (hasAnswered || review) {
    if (!feedArea.querySelector('.btn-ai-explain')) {
      const btn = document.createElement('button');
      btn.className = 'btn btn-ai-explain';
      btn.style.cssText = `
        margin-top: 12px;
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        color: white;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: none;
        font-size: 0.85rem;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 700;
        transition: transform 0.2s, opacity 0.2s;
        box-shadow: 0 4px 12px rgba(79,70,229,0.2);
      `;
      btn.innerHTML = `<i class="fa-solid fa-brain"></i> Ask Renance AI`;
      btn.onclick = () => getAIExplanation(currentIndex);
      
      btn.onmouseenter = () => btn.style.transform = 'translateY(-1px)';
      btn.onmouseleave = () => btn.style.transform = 'translateY(0)';
      
      feedArea.appendChild(btn);
    }
  }
}

// Auto Weak Areas Analysis
function injectWeakAreasContainer() {
  const feedbackEl = document.getElementById('resultFeedback') || document.getElementById('save-status');
  if (feedbackEl && !document.getElementById('ai-weak-areas')) {
    const containerHtml = `
      <div id="ai-weak-areas" style="margin: 15px 0; padding: 12px; background: rgba(124, 58, 237, 0.06); border-left: 4px solid #7c3aed; border-radius: 8px; text-align: left; display: none;">
          <strong style="font-size: 0.82rem; color: #7c3aed; display: flex; align-items: center; gap: 6px; margin-bottom: 5px;">
              <i class="fa-solid fa-brain"></i> AI Weak Areas Analysis
          </strong>
          <div id="ai-weak-areas-text" style="font-size: 0.8rem; margin: 0; line-height: 1.4; color: var(--text);">
              Analyzing your performance...
          </div>
      </div>
    `;
    feedbackEl.insertAdjacentHTML('afterend', containerHtml);
  }
}

async function analyzeWeakAreasWithAI() {
  injectWeakAreasContainer();
  const container = document.getElementById('ai-weak-areas');
  const textEl = document.getElementById('ai-weak-areas-text');
  if (!container || !textEl) return;

  const missed = [];
  if (typeof currentExamData === 'undefined') return;
  
  currentExamData.forEach((q, i) => {
    const student = userAnswers[i];
    if (q.isTheory) {
      const scoreValue = student && typeof student.score === 'number' ? student.score : 0;
      if (scoreValue < 70) {
        missed.push(q.question);
      }
    } else {
      if (student !== q.answer) {
        missed.push(q.question);
      }
    }
  });

  if (missed.length === 0) {
    container.style.display = 'block';
    container.style.borderColor = '#10b981';
    container.querySelector('strong').style.color = '#10b981';
    textEl.innerHTML = "🎉 Outstanding! You got a perfect score. No weak areas detected!";
    return;
  }

  container.style.display = 'block';
  textEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Analyzing weak areas...`;

  const courseCode = typeof COURSE_CODE !== 'undefined' ? COURSE_CODE : 'Course';
  const config = getAIConfigForCourse(courseCode);
  
  const systemPrompt = `You are Renance AI, a brilliant academic tutor.
Analyze the following list of exam questions that the student got wrong in their ${courseCode} quiz.
Questions Missed:
${missed.map((q, i) => `${i+1}. ${q}`).join('\n')}

Identify 1-3 core academic concepts/topics they should focus on.
Respond strictly in 2-3 lines of text containing bullet points of the topics (e.g. "• Topic A\n• Topic B"). Keep it very concise.`;

  try {
    let resultText = "";
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.key}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "system", content: systemPrompt }],
        temperature: 0.3
      })
    });
    const resData = await response.json();
    if (!response.ok) throw new Error();
    resultText = resData.choices[0].message.content;
    textEl.innerHTML = formatText(resultText);
  } catch (err) {
    textEl.innerHTML = "Struggled with the following topics: " + missed.slice(0, 3).map(q => `"${q.substring(0, 40)}..."`).join(', ');
  }
}

// AI Question Generator features have been removed to ensure reliability with free API models.

// Objective/Theory tabs setup
function setupSectionTabs() {
  const dashWrap = document.getElementById('dashboard-wrap');
  const dash = document.getElementById('dashboard');
  if (!dashWrap || !dash || typeof MASTER_POOL === 'undefined') return;
  
  if (document.querySelector('.section-tabs')) return;
  
  const tabs = document.createElement('div');
  tabs.className = 'section-tabs';
  tabs.style.cssText = `
    display: flex;
    gap: 12px;
    margin-bottom: 1.5rem;
    justify-content: center;
    width: 100%;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  `;
  tabs.innerHTML = `
    <button id="tab-objective" class="btn" style="flex: 1; background: var(--primary); color: white; transition: 0.2s;" onclick="switchSection('objective')">
        <i class="fa-solid fa-list-check"></i> Objective (MCQ)
    </button>
    <button id="tab-theory" class="btn" style="flex: 1; background: rgba(79,70,229,0.08); color: var(--primary); border: 1.5px solid rgba(79,70,229,0.2); transition: 0.2s;" onclick="switchSection('theory')">
        <i class="fa-solid fa-pen-to-square"></i> Theory Section
    </button>
  `;
  
  dashWrap.insertBefore(tabs, dash);
  
  // Save original pool
  window.originalPool = [...MASTER_POOL];
  
  // Set default active section
  window.activeSection = 'objective';
  
  // Filter pool initially
  filterPoolForSection();
  
  // Define switchSection globally
  window.switchSection = function(sec) {
    window.activeSection = sec;
    const objTab = document.getElementById('tab-objective');
    const thyTab = document.getElementById('tab-theory');
    if (!objTab || !thyTab) return;
    
    if (sec === 'objective') {
      objTab.style.background = 'var(--primary)';
      objTab.style.color = 'white';
      objTab.style.border = 'none';
      
      thyTab.style.background = 'rgba(79,70,229,0.08)';
      thyTab.style.color = 'var(--primary)';
      thyTab.style.border = '1.5px solid rgba(79,70,229,0.2)';
    } else {
      thyTab.style.background = 'var(--primary)';
      thyTab.style.color = 'white';
      thyTab.style.border = 'none';
      
      objTab.style.background = 'rgba(79,70,229,0.08)';
      objTab.style.color = 'var(--primary)';
      objTab.style.border = '1.5px solid rgba(79,70,229,0.2)';
    }
    
    filterPoolForSection();
    if (typeof buildDashboard === 'function') {
      buildDashboard();
    }
  };
  
  function filterPoolForSection() {
    const filtered = window.originalPool.filter(q => window.activeSection === 'theory' ? q.isTheory : !q.isTheory);
    MASTER_POOL.length = 0;
    MASTER_POOL.push(...filtered);
  }
}

// Attach wrapper hooks once DOM loads
document.addEventListener('DOMContentLoaded', () => {
  // Wrap renderQuestion
  if (typeof renderQuestion === 'function') {
    const originalRender = window.renderQuestion;
    window.renderQuestion = function() {
      originalRender.apply(this, arguments);
      injectAIExplainButton();
    };
  }
  
  // Wrap showResults
  if (typeof showResults === 'function') {
    const originalShowResults = window.showResults;
    window.showResults = function() {
      originalShowResults.apply(this, arguments);
      analyzeWeakAreasWithAI();
    };
  }
  
  // Wrap buildDashboard
  if (typeof buildDashboard === 'function') {
    const originalBuild = window.buildDashboard;
    window.buildDashboard = function() {
      const dash = document.getElementById('dashboard');
      if (dash && typeof MASTER_POOL !== 'undefined' && MASTER_POOL.length === 0) {
        dash.innerHTML = `
          <div style="grid-column: 1 / -1; background: var(--card-bg); padding: 2.5rem; border-radius: 16px; border: 1.5px dashed var(--border); text-align: center; width: 100%;">
              <i class="fa-solid fa-circle-info" style="font-size: 2.5rem; color: var(--accent); margin-bottom: 1rem; display: block;"></i>
              <h3 style="margin: 0 0 8px 0; font-size: 1.1rem; color: var(--text);">No ${window.activeSection} questions available</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">Questions for this section are currently being compiled and will be available soon. Please try the other section!</p>
          </div>
        `;
        return;
      }
      originalBuild.apply(this, arguments);
    };
  }
  

  
  // Inject tabs for courses
  setupSectionTabs();
});