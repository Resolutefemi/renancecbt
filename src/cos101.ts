
import { QuizEngine } from './quizEngine';

const SUPABASE_URL = 'https://ubxsywaxdvkhiqepcvmq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVieHN5d2F4ZHZraGlxZXBjdm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODcwMDAsImV4cCI6MjA4NzU2MzAwMH0.gkR3Aud3LRLNyNwpDHJTT0vIrWCnQkSBkFSaFjQ5qy4';

const engine = new QuizEngine('COS 101', SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    engine.init('questions/COS101.json');

    // Attach global functions for HTML onclicks
    (window as any).startExam = () => engine.startExam();
    (window as any).move = (d: number) => engine.move(d);
    (window as any).showResults = () => engine.showResults();
    (window as any).goHome = () => engine.goHome();
});
