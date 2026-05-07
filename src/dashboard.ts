
import { Course } from './types';

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

let currentSemester: number = 2;

export function setSemester(sem: number): void {
    currentSemester = sem;
    const sem1Btn = document.getElementById('sem1Btn');
    const sem2Btn = document.getElementById('sem2Btn');
    const semesterTitle = document.getElementById('semesterTitle');
    const courseSearch = document.getElementById('courseSearch') as HTMLInputElement;

    if (sem1Btn) {
        sem1Btn.classList.toggle('active', sem === 1);
        sem1Btn.style.background = sem === 1 ? 'var(--primary-accent)' : 'transparent';
        sem1Btn.style.color = sem === 1 ? 'white' : 'var(--text-muted)';
    }
    if (sem2Btn) {
        sem2Btn.classList.toggle('active', sem === 2);
        sem2Btn.style.background = sem === 2 ? 'var(--primary-accent)' : 'transparent';
        sem2Btn.style.color = sem === 2 ? 'white' : 'var(--text-muted)';
    }
    
    if (semesterTitle) {
        semesterTitle.textContent = sem === 1 ? 'First Semester' : 'Second Semester';
    }

    renderCourses(courseSearch?.value || '');
}

export function filterCourses(): void {
    const courseSearch = document.getElementById('courseSearch') as HTMLInputElement;
    renderCourses(courseSearch.value);
}

export function renderCourses(filterText: string = ''): void {
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
            card.className = 'course-card';
            card.innerHTML = `
                <div class="course-icon">
                    <i data-lucide="${course.icon}"></i>
                </div>
                <div class="course-info">
                    <span class="course-code">${course.id}</span>
                    <h3 class="course-title">${course.title}</h3>
                </div>
                <a href="${course.id.toLowerCase().replace(' ', '')}.html" class="btn ${course.isReady ? 'primary' : 'secondary'}">
                    ${course.isReady ? 'PRACTICE' : 'LOCKED'}
                </a>
            `;
            grid.appendChild(card);
        });
        // @ts-ignore
        if (window.lucide) window.lucide.createIcons();
    }
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
    renderCourses();
    
    // Attach to window for HTML onclick attributes
    (window as any).setSemester = setSemester;
    (window as any).filterCourses = filterCourses;
});
