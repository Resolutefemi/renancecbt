
import { Course } from './types';
import { db } from './ui-core';

const courses: Course[] = [
    { id: 'STA 111', title: 'DESCRIPTIVE STATISTICS',            icon: 'bar-chart',  isReady: true, semester: 1 },
    { id: 'AMS 101', title: 'PRNCIPLES OF MANAGEMENT',            icon: 'briefcase',  isReady: true, semester: 1 },
    { id: 'COS 101', title: 'INTRODUCTION TO COMPUTER',          icon: 'cpu',        isReady: true, semester: 1 },
    { id: 'BIO 101', title: 'GENERAL BIOLOGY I',                 icon: 'dna',        isReady: true, semester: 1 },
    { id: 'SEN 101', title: 'SOFTWARE EXPERIMENTAL LAB I',       icon: 'code',       isReady: true, semester: 1 },
    { id: 'MEE 101', title: 'ENGINEERING DRAWING I',             icon: 'compass',    isReady: true, semester: 1 },
    { id: 'GNS 103', title: 'INFORMATION LITERACY',              icon: 'library',    isReady: true, semester: 1 },
    { id: 'CVE 105', title: 'HISTORY AND PHILOSOPHY OF SCIENCE', icon: 'clock',      isReady: true, semester: 1 },
    { id: 'MTH 101', title: 'ELEMENTARY MATHEMATICS I',          icon: 'calculator', isReady: true, semester: 1 },
    { id: 'PHY 101', title: 'GENERAL PHYSICS I',                 icon: 'atom',       isReady: true, semester: 1 },
    { id: 'PHY 103', title: 'GENERAL PHYSICS III',               icon: 'zap',        isReady: true, semester: 1 },
    { id: 'GST 111', title: 'COMMUNICATION IN ENGLISH',          icon: 'languages',  isReady: true, semester: 1 },
    { id: 'CHE 101', title: 'GENERAL CHEMISTRY I',               icon: 'beaker',     isReady: true, semester: 1 },
    { id: 'CHE 103', title: 'EXPERIMENTAL CHEMISTRY I',          icon: 'test-tube',  isReady: true, semester: 1 },
];

let currentSemester: number = 1; // Defaulting to 1 as it seems more logical for first load

function setSemester(sem: number): void {
    currentSemester = sem;
    document.getElementById('sem1Btn')?.classList.toggle('active', sem === 1);
    document.getElementById('sem2Btn')?.classList.toggle('active', sem === 2);
    renderCourses((document.getElementById('courseSearch') as HTMLInputElement)?.value || '');
}

function filterCourses(): void {
    const courseSearch = document.getElementById('courseSearch') as HTMLInputElement;
    renderCourses(courseSearch.value);
}

function renderCourses(filterText: string = ''): void {
    const grid = document.getElementById('courseGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    const filtered = courses.filter(c =>
        (c.semester === currentSemester) &&
        (c.id.toLowerCase().includes(filterText.toLowerCase()) ||
        c.title.toLowerCase().includes(filterText.toLowerCase()))
    );

    if (filtered.length === 0) {
        const msg = currentSemester === 2 
            ? `No courses available for the Second Semester yet. Check back soon! 🚀`
            : `No courses found for "${filterText}"`;
        grid.innerHTML = `<p style="color:var(--text-muted);padding:16px;grid-column:1/-1;text-align:center;">${msg}</p>`;
    } else {
        filtered.forEach(course => {
            const card = document.createElement('div');
            card.className = 'course-card glass animate-slide';
            card.addEventListener('click', () => {
                if (course.isReady) {
                    window.location.href = `${course.id.toLowerCase().replace(/\s+/g, '')}.html`;
                }
            });

            card.innerHTML = `
                <div class="course-card-header">
                    <div class="icon-box"><i class="fa-solid fa-${getIcon(course.icon)}"></i></div>
                    ${course.isReady ? '' : '<span style="font-size: 0.6rem; background: var(--border); padding: 2px 6px; border-radius: 4px;">COMING SOON</span>'}
                </div>
                <div>
                    <h3>${course.id}</h3>
                    <p>${course.title}</p>
                </div>
                <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 700; font-size: 0.75rem; color: var(--accent);">${course.isReady ? 'START PRACTICE' : 'LOCKED'}</span>
                    <i class="fa-solid fa-chevron-right" style="font-size: 0.7rem; color: var(--text-muted);"></i>
                </div>
            `;
            grid.appendChild(card);
        });
    }
}

function getIcon(lucideIcon: string): string {
    const map: Record<string, string> = {
        'bar-chart': 'chart-simple',
        'briefcase': 'briefcase',
        'cpu': 'microchip',
        'dna': 'dna',
        'code': 'code',
        'compass': 'compass',
        'library': 'book-open',
        'clock': 'clock-rotate-left',
        'calculator': 'calculator',
        'atom': 'atom',
        'zap': 'bolt',
        'languages': 'language',
        'beaker': 'flask',
        'test-tube': 'vial'
    };
    return map[lucideIcon] || 'book';
}

async function loadUserStats(): Promise<void> {
    if (!db) return;

    try {
        const { data: { user } } = await db.auth.getUser();
        if (!user) return;

        const { data: results } = await db.from('test_results').select('score').eq('student_id', user.id);
        const { data: student } = await db.from('students').select('fullname').eq('id', user.id).single();

        if (student) {
            const welcomeText = document.getElementById('welcomeText');
            if (welcomeText) welcomeText.textContent = `Welcome back, ${student.fullname.split(' ')[0]}`;
        }

        if (results && results.length > 0) {
            const testsTaken = results.length;
            const avgScore = Math.round(results.reduce((s: number, r: any) => s + Number(r.score), 0) / testsTaken);
            
            animateValue('testsTakenEl', 0, testsTaken, 1000);
            animateValue('avgScoreEl', 0, avgScore, 1000, '%');
        }
    } catch (e) {
        console.error('Stats load failed:', e);
    }
}

function animateValue(id: string, start: number, end: number, duration: number, suffix: string = ''): void {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start) + suffix;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function triggerShare(): void {
    if (navigator.share) {
        navigator.share({
            title: 'RENANCE CBT Portal',
            text: 'Join the ultimate FUTA CBT simulation platform. Practice with hundreds of past questions!',
            url: window.location.origin
        }).catch(err => console.log('Error sharing:', err));
    } else {
        navigator.clipboard.writeText(window.location.origin).then(() => {
            alert('Portal link copied to clipboard: ' + window.location.origin);
        });
    }
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
    // Event Listeners
    document.getElementById('sem1Btn')?.addEventListener('click', () => setSemester(1));
    document.getElementById('sem2Btn')?.addEventListener('click', () => setSemester(2));
    document.getElementById('courseSearch')?.addEventListener('input', filterCourses);
    document.getElementById('btn-share-portal')?.addEventListener('click', triggerShare);

    // Set initial semester and render
    setSemester(1);
    loadUserStats();
});

