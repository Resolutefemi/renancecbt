
import { QuizEngine } from './quizEngine';
import { SUPABASE_CONFIG } from './config';

const engine = new QuizEngine('COS 101', SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);

document.addEventListener('DOMContentLoaded', () => {
    engine.init('questions/COS101.json');

    // Attach global functions for HTML onclicks
    (window as any).startExam = () => engine.startExam();
    (window as any).move = (d: number) => engine.move(d);
    (window as any).showResults = () => engine.showResults();
    (window as any).goHome = () => engine.goHome();
});
