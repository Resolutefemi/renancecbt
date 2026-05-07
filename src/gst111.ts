
import { QuizEngine } from './quizEngine';
import { SUPABASE_CONFIG } from './config';

/**
 * GST 111: Use of English & Library Literacy
 * Initializes the QuizEngine with GST 111 question pool.
 */

window.addEventListener('DOMContentLoaded', () => {
    // Initialize the engine for GST 111
    const engine = new QuizEngine('GST 111', SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);
    
    // Load questions and start the dashboard
    engine.init('questions/GST111.json');

    // Attach global access for HTML button clicks
    (window as any).startExam = () => engine.startExam();
    (window as any).move = (dir: number) => engine.move(dir);
    (window as any).showResults = () => engine.showResults();
    (window as any).enterReviewMode = () => engine.enterReviewMode();
    (window as any).goHome = () => engine.goHome();
});
