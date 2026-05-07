import { QuizEngine } from './quizEngine';
import { SUPABASE_CONFIG } from './config';

const engine = new QuizEngine('CVE 105', SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);

document.addEventListener('DOMContentLoaded', () => {
    engine.init('questions/CVE105.json');

    (window as any).startExam = () => engine.startExam();
    (window as any).move = (d: number) => engine.move(d);
    (window as any).showResults = () => engine.showResults();
    (window as any).goHome = () => engine.goHome();
});
