
/**
 * gpa.ts - GPA Calculator Logic
 * Handles semester and CGPA calculations for FUTA students.
 */

interface Course {
    code: string;
    unit: number;
    gradeVal: number;
}

interface Semester {
    name: string;
    gpa: number;
    units: number;
}

const gradeNames: Record<number, string> = { 5: 'A', 4: 'B', 3: 'C', 2: 'D', 1: 'E', 0: 'F' };
const gradeClass: Record<number, string> = { 5: 'grade-A', 4: 'grade-B', 3: 'grade-C', 2: 'grade-D', 1: 'grade-E', 0: 'grade-F' };

let courses: Course[] = [];
let semesters: Semester[] = [];

/**
 * Toggle between light and dark themes
 */
export function toggleTheme(): void {
    const body = document.body;
    const btn = document.getElementById('themeBtn');
    const theme = body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', theme);
    localStorage.setItem('gpaTheme', theme);
    if (btn) btn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

/**
 * Switch between Semester GPA and CGPA Tracker tabs
 */
export function switchTab(tab: 'semester' | 'cgpa'): void {
    document.querySelectorAll('.tab-btn').forEach((b, i) => {
        b.classList.toggle('active', (i === 0 && tab === 'semester') || (i === 1 && tab === 'cgpa'));
    });
    const tabSem = document.getElementById('tab-semester');
    const tabCgpa = document.getElementById('tab-cgpa');
    if (tabSem) tabSem.classList.toggle('active', tab === 'semester');
    if (tabCgpa) tabCgpa.classList.toggle('active', tab === 'cgpa');
}

/**
 * Persist data to localStorage
 */
function save(): void {
    localStorage.setItem('savedCourses', JSON.stringify(courses));
    localStorage.setItem('savedSemesters', JSON.stringify(semesters));
}

/**
 * Get degree classification based on GPA
 */
function getClassification(gpa: number): { label: string, cls: string } {
    if (gpa >= 4.50) return { label: '🏅 First Class', cls: 'class-first' };
    if (gpa >= 3.50) return { label: '🎓 Second Class Upper', cls: 'class-second-upper' };
    if (gpa >= 2.40) return { label: '📘 Second Class Lower', cls: 'class-second-lower' };
    if (gpa >= 1.50) return { label: '📄 Third Class', cls: 'class-third' };
    if (gpa >= 1.00) return { label: '✅ Pass', cls: 'class-pass' };
    if (gpa > 0) return { label: '⚠️ Below Pass', cls: 'class-fail' };
    return { label: '—', cls: 'class-pass' };
}

/**
 * Animate numerical values
 */
function animateVal(el: HTMLElement | null, target: number, decimals: number = 2): void {
    if (!el) return;
    const start = parseFloat(el.innerText) || 0;
    const dur = 500, fps = 60, steps = dur / (1000 / fps);
    let step = 0;
    const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        const ease = 1 - Math.pow(1 - progress, 3);
        el.innerText = (start + (target - start) * ease).toFixed(decimals);
        if (step >= steps) {
            el.innerText = target.toFixed(decimals);
            clearInterval(timer);
        }
    }, 1000 / fps);
}

/**
 * Add a new course to the current semester
 */
export function addCourse(): void {
    const codeEl = document.getElementById('courseCode') as HTMLInputElement;
    const unitEl = document.getElementById('courseUnit') as HTMLInputElement;
    const gradeEl = document.getElementById('courseGrade') as HTMLSelectElement;

    const u = parseInt(unitEl?.value || '0');
    if (u <= 0 || u > 10) {
        showToast('⚠️ Enter valid credit units (1–10)');
        return;
    }

    courses.push({
        code: (codeEl?.value || 'COURSE').toUpperCase().trim(),
        unit: u,
        gradeVal: parseInt(gradeEl?.value || '0')
    });

    if (codeEl) codeEl.value = '';
    if (unitEl) unitEl.value = '';
    codeEl?.focus();

    save();
    render();
    showToast('✅ Course added');
}

/**
 * Render the courses table and update totals
 */
function render(): void {
    const tbody = document.getElementById('courseBody');
    if (!tbody) return;

    let tPoints = 0, tUnits = 0;
    let rows = '';

    courses.forEach((c, i) => {
        const pts = c.unit * c.gradeVal;
        tPoints += pts;
        tUnits += c.unit;
        const gn = gradeNames[c.gradeVal] || 'F';
        const gc = gradeClass[c.gradeVal] || 'grade-F';
        rows += `<tr>
            <td style="color:var(--text-muted);font-size:0.75rem;">${i + 1}</td>
            <td><strong>${c.code}</strong></td>
            <td>${c.unit}</td>
            <td><span class="grade-badge ${gc}">${gn}</span></td>
            <td>${pts}</td>
            <td class="no-print"><button class="delete-btn" onclick="removeCourse(${i})" title="Remove"><i class="fas fa-times"></i></button></td>
        </tr>`;
    });

    tbody.innerHTML = rows || `<tr id="emptyRow"><td colspan="6"><div class="empty-state"><i class="fas fa-book-open"></i><p>No courses added yet.</p></div></td></tr>`;

    const gpa = tUnits > 0 ? tPoints / tUnits : 0;
    const clf = getClassification(gpa);

    animateVal(document.getElementById('gpaScore'), gpa);
    animateVal(document.getElementById('totalUnits'), tUnits, 0);
    animateVal(document.getElementById('totalPoints'), tPoints, 0);

    const cl = document.getElementById('classLabel');
    if (cl) {
        cl.textContent = tUnits > 0 ? clf.label : '—';
        cl.className = 'class-badge ' + (tUnits > 0 ? clf.cls : 'class-pass');
    }

    const statsRow = document.getElementById('statsRow');
    if (statsRow) {
        if (courses.length > 0) {
            statsRow.style.display = 'grid';
            const grades = courses.map(c => c.gradeVal);
            const best = Math.max(...grades), worst = Math.min(...grades);
            const stC = document.getElementById('statCourses');
            const stB = document.getElementById('statBest');
            const stW = document.getElementById('statWorst');
            if (stC) stC.textContent = courses.length.toString();
            if (stB) stB.textContent = gradeNames[best];
            if (stW) stW.textContent = gradeNames[worst];
        } else {
            statsRow.style.display = 'none';
        }
    }
}

/**
 * Remove a course from the list
 */
export function removeCourse(i: number): void {
    courses.splice(i, 1);
    save();
    render();
    showToast('🗑️ Course removed');
}

/**
 * Reset all courses for the current semester
 */
export function resetAll(): void {
    if (confirm('Clear all courses this semester?')) {
        courses = [];
        save();
        render();
        showToast('🔄 Reset complete');
    }
}

/**
 * Add a semester for CGPA calculation
 */
export function addSemester(): void {
    const nameEl = document.getElementById('semName') as HTMLInputElement;
    const gpaEl = document.getElementById('semGPA') as HTMLInputElement;
    const unitsEl = document.getElementById('semUnits') as HTMLInputElement;

    const g = parseFloat(gpaEl?.value || '0');
    const u = parseInt(unitsEl?.value || '0');

    if (isNaN(g) || g < 0 || g > 5) {
        showToast('⚠️ Enter a valid GPA (0.00 – 5.00)');
        return;
    }
    if (u <= 0) {
        showToast('⚠️ Enter valid credit units');
        return;
    }

    semesters.push({
        name: (nameEl?.value || `Semester ${semesters.length + 1}`),
        gpa: g,
        units: u
    });

    if (nameEl) nameEl.value = '';
    if (gpaEl) gpaEl.value = '';
    if (unitsEl) unitsEl.value = '';

    save();
    renderSemesters();
    showToast('✅ Semester added');
}

/**
 * Render the semesters list and update CGPA
 */
function renderSemesters(): void {
    const list = document.getElementById('semesterList');
    if (!list) return;

    if (semesters.length === 0) {
        list.innerHTML = `<div class="empty-state" style="padding:24px 0;"><i class="fas fa-chart-line"></i><p>No semesters added yet.</p></div>`;
        const cgScore = document.getElementById('cgpaScore');
        const cgClass = document.getElementById('cgpaClass');
        if (cgScore) cgScore.innerText = '0.00';
        if (cgClass) {
            cgClass.textContent = '—';
            cgClass.className = 'class-badge class-pass';
        }
        return;
    }

    list.innerHTML = semesters.map((s, i) => `
        <div class="semester-card">
            <div class="semester-info">
                <div class="semester-name">${s.name}</div>
                <div class="semester-sub">${s.units} credit units &nbsp;·&nbsp; ${getClassification(s.gpa).label}</div>
            </div>
            <div class="semester-gpa-pill">${s.gpa.toFixed(2)}</div>
            <button class="delete-btn no-print" onclick="removeSemester(${i})" title="Remove"><i class="fas fa-times"></i></button>
        </div>`).join('');

    const totalWP = semesters.reduce((a, s) => a + s.gpa * s.units, 0);
    const totalU = semesters.reduce((a, s) => a + s.units, 0);
    const cgpa = totalU > 0 ? totalWP / totalU : 0;
    const clf = getClassification(cgpa);

    animateVal(document.getElementById('cgpaScore'), cgpa);
    const cc = document.getElementById('cgpaClass');
    if (cc) {
        cc.textContent = clf.label;
        cc.className = 'class-badge ' + clf.cls;
    }
}

/**
 * Remove a semester from the list
 */
export function removeSemester(i: number): void {
    semesters.splice(i, 1);
    save();
    renderSemesters();
}

/**
 * Build shareable text for the result
 */
function buildShareText(): string {
    const gpaEl = document.getElementById('gpaScore');
    const clfEl = document.getElementById('classLabel');
    const unitsEl = document.getElementById('totalUnits');
    
    const gpa = gpaEl?.innerText || "0.00";
    const clf = clfEl?.textContent || "—";
    const units = unitsEl?.innerText || "0";

    let text = `📊 *GPA RESULT — FUTA*\n`;
    text += `────────────────────\n`;
    courses.forEach(c => {
        text += `${c.code}   ${c.unit}u   ${gradeNames[c.gradeVal]}\n`;
    });
    text += `────────────────────\n`;
    text += `*Semester GPA: ${gpa}/5.00*\n`;
    text += `Classification: ${clf}\n`;
    text += `Total Units: ${units}\n`;
    text += `\n_Calculated with Resolutefemi GPA Calculator_`;
    return text;
}

/**
 * Open the share modal
 */
export function openShareModal(): void {
    if (courses.length === 0) {
        showToast('⚠️ Add courses first');
        return;
    }
    const shareText = document.getElementById('shareText');
    const shareModal = document.getElementById('shareModal');
    if (shareText) shareText.textContent = buildShareText();
    if (shareModal) shareModal.classList.add('open');
}

/**
 * Close the share modal
 */
export function closeModal(): void {
    const shareModal = document.getElementById('shareModal');
    if (shareModal) shareModal.classList.remove('open');
}

/**
 * Copy result to clipboard
 */
export function copyResult(): void {
    navigator.clipboard.writeText(buildShareText()).then(() => {
        showToast('📋 Copied to clipboard!');
        closeModal();
    });
}

/**
 * Share result via WhatsApp
 */
export function shareWhatsApp(): void {
    window.open('https://wa.me/?text=' + encodeURIComponent(buildShareText()), '_blank');
    closeModal();
}

/**
 * Show a toast notification
 */
function showToast(msg: string): void {
    const t = document.getElementById('toast');
    if (t) {
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 2400);
    }
}

/**
 * Load initial data
 */
window.onload = () => {
    const t = localStorage.getItem('gpaTheme');
    if (t === 'dark') toggleTheme();
    
    const c = localStorage.getItem('savedCourses');
    if (c) {
        courses = JSON.parse(c);
        render();
    }
    
    const s = localStorage.getItem('savedSemesters');
    if (s) {
        semesters = JSON.parse(s);
        renderSemesters();
    }

    const shareModal = document.getElementById('shareModal');
    if (shareModal) {
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) closeModal();
        });
    }

    // Bind to window for HTML event handlers
    (window as any).toggleTheme = toggleTheme;
    (window as any).switchTab = switchTab;
    (window as any).addCourse = addCourse;
    (window as any).removeCourse = removeCourse;
    (window as any).resetAll = resetAll;
    (window as any).addSemester = addSemester;
    (window as any).removeSemester = removeSemester;
    (window as any).openShareModal = openShareModal;
    (window as any).closeModal = closeModal;
    (window as any).copyResult = copyResult;
    (window as any).shareWhatsApp = shareWhatsApp;
};
