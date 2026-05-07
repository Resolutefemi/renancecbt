
import { QuizEngine } from './quizEngine';
import { SUPABASE_CONFIG } from './config';

const engine = new QuizEngine('COS 101', SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);

document.addEventListener('DOMContentLoaded', () => {
    engine.init('questions/COS101.json');

    // Event Listeners for Quiz Controls
    document.getElementById('btn-start-exam')?.addEventListener('click', () => engine.startExam());
    document.getElementById('next-btn')?.addEventListener('click', () => engine.move(1));
    document.getElementById('prev-btn')?.addEventListener('click', () => engine.move(-1));
    document.getElementById('submit-btn')?.addEventListener('click', () => engine.showResults());
    document.getElementById('btn-go-home')?.addEventListener('click', () => engine.goHome());
    document.getElementById('btn-modal-home')?.addEventListener('click', () => engine.goHome());
    
    // Resume banner listeners (if they are not handled by the engine's internal HTML generation)
    // Note: QuizEngine.ts handles resume banner buttons internally by querySelector after innerHTML.
    (window as any).reviewWithAI = () => engine.reviewWithAI();
    (window as any).enterReviewMode = () => engine.enterReviewMode();
});

