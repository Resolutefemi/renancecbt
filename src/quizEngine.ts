
import { Question, QuizMode, QuizState } from './types';
import { sendToAI } from './ai-bridge';

// Declare Supabase global
declare const supabase: any;

export class QuizEngine {
    private db: any;
    private courseCode: string;
    private storageKey: string;
    private masterPool: Question[] = [];
    
    private state: QuizState = {
        currentExamData: [],
        userAnswers: {},
        currentIndex: 0,
        timeRemaining: 0,
        activeMode: 'practice',
        examSelectionType: 'random',
        savedAt: 0
    };

    private timerId: any = null;
    private isReviewMode: boolean = false;

    constructor(courseCode: string, supabaseUrl: string, supabaseKey: string) {
        this.courseCode = courseCode;
        this.storageKey = `saved_${courseCode.toLowerCase().replace(' ', '')}_exam`;
        this.db = supabase.createClient(supabaseUrl, supabaseKey);
    }

    public async init(jsonPath: string): Promise<void> {
        try {
            const response = await fetch(jsonPath);
            const data = await response.json();
            this.masterPool = this.processRawData(data);
            
            this.setupEventListeners();
            this.loadStatsBar();
            this.checkResume();
            this.renderDashboard();
            
            this.startHeartbeat();
        } catch (error) {
            console.error('Quiz initialization failed:', error);
        }
    }

    private processRawData(data: any): Question[] {
        // Handle different JSON structures found in the project
        const rawItems = Array.isArray(data) ? data : (data.questions || []);
        
        return rawItems.map((item: any) => {
            // Logic to clean options and answers (based on your existing mapping logic)
            const letters = ["A", "B", "C", "D"];
            let processedOptions = item.options;
            let processedAnswer = item.answer;

            if (item.q) { // Handle some formats
                const opts: any = {};
                item.options.forEach((opt: string, idx: number) => opts[letters[idx]] = opt);
                processedOptions = opts;
                processedAnswer = letters[item.ans];
            }

            return {
                id: item.id,
                question: item.question || item.q,
                options: processedOptions,
                answer: processedAnswer,
                explanation: item.explanation || `Correct answer is ${processedAnswer}`,
                topic: item.topic || 'General'
            };
        });
    }

    private setupEventListeners(): void {
        document.addEventListener('keydown', (e) => {
            if (['INPUT', 'SELECT', 'TEXTAREA'].includes((document.activeElement as any).tagName)) return;
            const interface_ = document.getElementById('quiz-interface');
            if (!interface_ || interface_.style.display === 'none') return;

            const key = e.key.toUpperCase();
            if (['A', 'B', 'C', 'D'].includes(key)) {
                const buttons = document.querySelectorAll('.option-btn');
                buttons.forEach((btn: any) => {
                    if (btn.innerText.trim().startsWith(key + '.')) btn.click();
                });
            }
            if (key === 'N') this.move(1);
            if (key === 'P') this.move(-1);
        });
    }

    private async loadStatsBar(): Promise<void> {
        const bar = document.getElementById('stats-bar');
        if (!bar) return;
        try {
            const { data: { user } } = await this.db.auth.getUser();
            if (!user) return;

            const { data } = await this.db.from('test_results')
                .select('score')
                .eq('student_id', user.id)
                .eq('course_id', this.courseCode);

            if (!data || data.length === 0) return;

            const taken = data.length;
            const avg = Math.round(data.reduce((s: number, r: any) => s + r.score, 0) / taken);
            const best = Math.max(...data.map((r: any) => r.score));

            bar.innerHTML = `
                <div class="stat-card"><div class="stat-val">${taken}</div><div class="stat-lbl">Tests Taken</div></div>
                <div class="stat-card"><div class="stat-val">${avg}%</div><div class="stat-lbl">Average Score</div></div>
                <div class="stat-card"><div class="stat-val">${best}%</div><div class="stat-lbl">Best Score</div></div>`;
            bar.style.display = 'grid';
        } catch (e) {}
    }

    private checkResume(): void {
        const saved = localStorage.getItem(this.storageKey);
        const resumeBtn = document.getElementById('resume-btn');
        if (saved && resumeBtn) {
            resumeBtn.style.display = 'block';
            this.showResumeBanner(JSON.parse(saved));
        }
    }

    private showResumeBanner(s: QuizState): void {
        const banner = document.getElementById('resume-banner');
        if (!banner) return;

        const answered = Object.keys(s.userAnswers).length;
        const total = s.currentExamData.length;
        const label = s.examSelectionType === 'random' ? 'Random Mix' : `Selection`;
        const mLeft = Math.floor(s.timeRemaining / 60);
        const sLeft = s.timeRemaining % 60;
        const timeStr = `${mLeft}:${sLeft < 10 ? '0'+sLeft : sLeft}`;
        const pct = Math.round((answered / total) * 100);

        banner.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
                <div>
                    <div style="font-weight:700;font-size:0.95rem;">📌 Resume Saved Exam</div>
                    <div style="font-size:0.82rem;color:var(--text-muted);margin-top:3px;">
                        <strong>${label}</strong> &nbsp;·&nbsp; ${answered}/${total} answered (${pct}%) &nbsp;·&nbsp; ⏱ ${timeStr} left
                    </div>
                </div>
                <div style="display:flex;gap:8px;flex-shrink:0;">
                    <button class="btn resume-continue-btn" style="background:var(--success);padding:8px 16px;font-size:0.87rem;">
                        <i class="fa-solid fa-rotate-right"></i> Continue
                    </button>
                    <button class="btn resume-discard-btn" style="background:#64748b;padding:8px 16px;font-size:0.87rem;" title="Discard saved exam">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>`;
        
        banner.querySelector('.resume-continue-btn')?.addEventListener('click', () => this.resumeExam());
        banner.querySelector('.resume-discard-btn')?.addEventListener('click', () => this.discardSaved());
        banner.style.display = 'block';
    }

    private discardSaved(): void {
        if (!confirm('Discard your saved exam progress?')) return;
        localStorage.removeItem(this.storageKey);
        const banner = document.getElementById('resume-banner');
        const resumeBtn = document.getElementById('resume-btn');
        if (banner) banner.style.display = 'none';
        if (resumeBtn) resumeBtn.style.display = 'none';
    }

    public renderDashboard(): void {
        const board = document.getElementById('dashboard');
        if (!board) return;
        board.innerHTML = '';
        const total = this.masterPool.length;

        if (total === 0) {
            board.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);">No questions loaded.</p>`;
            return;
        }

        const rand = document.createElement('div');
        rand.className = 'box box-random';
        rand.innerHTML = `<div style="font-size:1.8rem;">🔀</div><h3>Random Mode</h3><p>${total} Questions</p>`;
        rand.onclick = () => this.openSetup('random');
        board.appendChild(rand);

        // Group by topic if available
        const topics = [...new Set(this.masterPool.map(q => q.topic))].filter(t => t && t !== 'General');
        if (topics.length > 0) {
            topics.forEach(topic => {
                const count = this.masterPool.filter(q => q.topic === topic).length;
                const card = document.createElement('div');
                card.className = 'box';
                card.innerHTML = `<div style="font-size:1.8rem;color:var(--primary);">📖</div><h3>${topic}</h3><p>${count} Questions</p>`;
                card.onclick = () => this.openSetup('topic', topic);
                board.appendChild(card);
            });
        } else {
            // Default: Part split (50 questions each)
            const parts = Math.ceil(total / 50);
            for (let i = 1; i <= parts; i++) {
                const start = (i - 1) * 50 + 1;
                const end = Math.min(i * 50, total);
                const card = document.createElement('div');
                card.className = 'box';
                card.innerHTML = `<div style="font-size:1.8rem;color:var(--primary);">📅</div><h3>Part ${i}</h3><p>Q${start} – Q${end}</p>`;
                card.onclick = () => this.openSetup('part', i);
                board.appendChild(card);
            }
        }
    }

    private openSetup(type: 'random' | 'part' | 'topic', value?: any): void {
        this.state.examSelectionType = type;
        if (type === 'part') this.state.partNum = value;
        if (type === 'topic') this.state.selectionValue = value;

        const wrap = document.getElementById('dashboard-wrap');
        const setup = document.getElementById('setup-screen');
        const title = document.getElementById('setup-title');
        
        if (wrap) wrap.style.display = 'none';
        if (setup) setup.style.display = 'block';
        if (title) title.innerText = type === 'random' ? 'Randomised Practice' : `${this.courseCode} — ${value}`;
        
        const randSettings = document.getElementById('random-settings');
        if (randSettings) randSettings.style.display = type === 'random' ? 'block' : 'none';
    }

    public startExam(): void {
        const tLimit = document.getElementById('t-limit') as HTMLInputElement;
        const qMode = document.getElementById('quiz-mode') as HTMLSelectElement;
        const shuffQ = document.getElementById('shuffle-questions') as HTMLInputElement;
        
        this.state.timeRemaining = (parseInt(tLimit?.value) || 30) * 60;
        this.state.activeMode = (qMode?.value as QuizMode) || 'practice';
        this.isReviewMode = false;
        this.state.userAnswers = {};
        this.state.currentIndex = 0;

        let pool = JSON.parse(JSON.stringify(this.masterPool));

        if (this.state.examSelectionType === 'random') {
            const qCount = document.getElementById('q-count') as HTMLInputElement;
            const qty = Math.min(parseInt(qCount?.value) || 50, pool.length);
            pool = this.shuffleArray(pool).slice(0, qty);
        } else if (this.state.examSelectionType === 'part') {
            const start = (this.state.partNum! - 1) * 50;
            pool = pool.slice(start, start + 50);
        } else if (this.state.examSelectionType === 'topic') {
            pool = pool.filter((q: Question) => q.topic === this.state.selectionValue);
        }

        if (shuffQ?.checked) pool = this.shuffleArray(pool);

        // Shuffle options if requested
        const shuffO = document.getElementById('shuffle-options') as HTMLInputElement;
        if (shuffO?.checked) {
            pool.forEach((q: Question) => {
                const keys = Object.keys(q.options);
                const values = this.shuffleArray(Object.values(q.options));
                const correctText = (q.options as any)[q.answer];
                const newOpts: any = {};
                keys.forEach((k, idx) => newOpts[k] = values[idx]);
                q.options = newOpts;
                q.answer = keys.find(k => newOpts[k] === correctText) || q.answer;
            });
        }

        this.state.currentExamData = pool;

        const setup = document.getElementById('setup-screen');
        const quizInterface = document.getElementById('quiz-interface');
        const totalIdx = document.getElementById('total-idx');

        if (setup) setup.style.display = 'none';
        if (quizInterface) quizInterface.style.display = 'block';
        if (totalIdx) totalIdx.innerText = this.state.currentExamData.length.toString();

        this.runTimer();
        this.renderQuestion();
    }

    private runTimer(): void {
        clearInterval(this.timerId);
        this.timerId = setInterval(() => {
            this.state.timeRemaining--;
            const m = Math.floor(this.state.timeRemaining / 60);
            const s = this.state.timeRemaining % 60;
            const timer = document.getElementById('timer');
            if (timer) timer.innerText = `${m}:${s < 10 ? '0'+s : s}`;
            if (this.state.timeRemaining <= 0) {
                clearInterval(this.timerId);
                this.showResults(true);
            }
        }, 1000);
    }

    private renderQuestion(): void {
        const q = this.state.currentExamData[this.state.currentIndex];
        if (!q) return;

        const hasAnswered = this.state.userAnswers.hasOwnProperty(this.state.currentIndex);
        const userAns = this.state.userAnswers[this.state.currentIndex];

        const curIdx = document.getElementById('cur-idx');
        const qText = document.getElementById('question-text');
        const optBox = document.getElementById('options-box');
        const feedArea = document.getElementById('feedback-area');

        if (curIdx) curIdx.innerText = (this.state.currentIndex + 1).toString();
        if (qText) qText.innerText = q.question;
        if (optBox) optBox.innerHTML = '';
        if (feedArea) feedArea.innerHTML = '';

        const options = Array.isArray(q.options) ? q.options : Object.entries(q.options);
        
        options.forEach((opt) => {
            let key: string, val: string;
            if (Array.isArray(opt)) { [key, val] = opt; } 
            else { val = opt; key = ''; } // Simplified for array options

            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = key ? `<strong>${key}.</strong> ${val}` : val;

            const isCorrect = key ? (key === q.answer) : (val === q.answer);
            const isChosen = key ? (userAns === key) : (userAns === val);

            if (this.isReviewMode || (this.state.activeMode === 'practice' && hasAnswered)) {
                if (isCorrect) btn.classList.add('correct');
                else if (isChosen) btn.classList.add('wrong');
                btn.disabled = true;
            } else if (this.state.activeMode === 'exam' && hasAnswered && isChosen) {
                btn.classList.add('selected');
            }

            btn.onclick = () => {
                if (this.isReviewMode) return;
                if (this.state.activeMode === 'practice' && hasAnswered) return;
                this.state.userAnswers[this.state.currentIndex] = key || val;
                this.saveState();
                this.renderQuestion();
            };
            optBox?.appendChild(btn);
        });

        if (this.isReviewMode || (this.state.activeMode === 'practice' && hasAnswered)) {
            const ok = userAns === q.answer;
            const exp = q.explanation ? `<br><small>${q.explanation}</small>` : '';
            if (feedArea) {
                feedArea.innerHTML = `<div class="feedback-msg" style="background:${ok?'#dcfce7':'#fee2e2'};color:${ok?'#166534':'#991b1b'}">
                    ${ok ? '✔ Correct!' : '✘ Incorrect. Answer: <strong>' + q.answer + '</strong>'}${exp}</div>`;
            }
        }

        const isLast = this.state.currentIndex === this.state.currentExamData.length - 1;
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');
        const finishReviewBtn = document.getElementById('finish-review-btn');

        if (nextBtn) nextBtn.style.display = isLast ? 'none' : 'block';
        if (submitBtn) submitBtn.style.display = this.isReviewMode ? 'none' : 'block';
        if (finishReviewBtn) finishReviewBtn.style.display = this.isReviewMode ? 'block' : 'none';
    }

    public move(d: number): void {
        const n = this.state.currentIndex + d;
        if (n >= 0 && n < this.state.currentExamData.length) {
            this.state.currentIndex = n;
            this.renderQuestion();
        }
    }

    private saveState(): void {
        this.state.savedAt = Date.now();
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    }

    private resumeExam(): void {
        const saved = localStorage.getItem(this.storageKey);
        if (!saved) return;
        this.state = JSON.parse(saved);
        this.isReviewMode = false;

        const wrap = document.getElementById('dashboard-wrap');
        const quizInterface = document.getElementById('quiz-interface');
        const banner = document.getElementById('resume-banner');
        const totalIdx = document.getElementById('total-idx');

        if (wrap) wrap.style.display = 'none';
        if (banner) banner.style.display = 'none';
        if (quizInterface) quizInterface.style.display = 'block';
        if (totalIdx) totalIdx.innerText = this.state.currentExamData.length.toString();

        this.runTimer();
        this.renderQuestion();
    }

    public async showResults(forced = false): Promise<void> {
        const answered = Object.keys(this.state.userAnswers).length;
        if (!forced && answered < this.state.currentExamData.length) {
            if (!confirm(`You answered ${answered} of ${this.state.currentExamData.length}. Submit anyway?`)) return;
        }

        clearInterval(this.timerId);
        localStorage.removeItem(this.storageKey);

        let score = 0;
        this.state.currentExamData.forEach((q, i) => {
            if (this.state.userAnswers[i] === q.answer) score++;
        });
        const total = this.state.currentExamData.length;
        const pct = Math.round((score / total) * 100);

        const scoreText = document.getElementById('finalScoreText');
        const modalCorrect = document.getElementById('modalCorrect');
        const modalTotal = document.getElementById('modalTotal');
        const resultModal = document.getElementById('quizResultModal');

        if (scoreText) scoreText.innerText = pct.toString();
        if (modalCorrect) modalCorrect.innerText = score.toString();
        if (modalTotal) modalTotal.innerText = total.toString();
        if (resultModal) resultModal.style.display = 'flex';

        // Add Review with AI button if it doesn't exist
        const actions = resultModal?.querySelector('.result-actions');
        if (actions && !document.getElementById('ai-review-btn')) {
            const btn = document.createElement('button');
            btn.id = 'ai-review-btn';
            btn.className = 'btn-action btn-share';
            btn.style.background = 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)';
            btn.innerHTML = '<i class="fa-solid fa-robot"></i> Review with AI Tutor';
            btn.onclick = () => this.reviewWithAI();
            actions.insertBefore(btn, actions.firstChild);
        }

        await this.saveTestScore(pct);
    }

    public reviewWithAI(): void {
        const answers = this.state.currentExamData.map((_, i) => this.state.userAnswers[i]);
        sendToAI(this.courseCode, this.state.currentExamData, answers);
    }

    public enterReviewMode(): void {
        this.isReviewMode = true;
        this.state.currentIndex = 0;
        const modal = document.getElementById('quizResultModal');
        if (modal) modal.style.display = 'none';
        this.renderQuestion();
    }

    private async saveTestScore(pct: number): Promise<void> {
        const el = document.getElementById('save-status');
        if (el) el.innerText = '⏳ Saving...';
        try {
            const { data: { user } } = await this.db.auth.getUser();
            if (!user) return;

            await this.db.from('test_results').insert([
                { student_id: user.id, course_id: this.courseCode, score: pct }
            ]);
            if (el) el.innerText = '✅ Score saved!';
        } catch (e) {
            if (el) el.innerText = '⚠️ Offline — score not saved';
        }
    }

    public goHome(): void {
        clearInterval(this.timerId);
        this.isReviewMode = false;
        const quizInterface = document.getElementById('quiz-interface');
        const setup = document.getElementById('setup-screen');
        const resultModal = document.getElementById('quizResultModal');
        const wrap = document.getElementById('dashboard-wrap');

        if (quizInterface) quizInterface.style.display = 'none';
        if (setup) setup.style.display = 'none';
        if (resultModal) resultModal.style.display = 'none';
        if (wrap) wrap.style.display = 'block';
        
        this.loadStatsBar();
    }

    private shuffleArray(arr: any[]): any[] {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    private startHeartbeat(): void {
        setInterval(async () => {
            try {
                const { data: { user } } = await this.db.auth.getUser();
                if (!user) return;
                await this.db.from('students')
                    .update({ last_seen: new Date().toISOString() })
                    .eq('id', user.id);
            } catch (e) {}
        }, 2 * 60 * 1000);
    }
}
