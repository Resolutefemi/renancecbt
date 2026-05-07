
/**
 * registration.ts - Logic for the Create Account page
 * Handles: Multi-step form, faculty/department selection, and Supabase sign up.
 */

import { db } from './ui-core';

// --- Toast Utility ---
function toast(m: string, t: string = '') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = m;
    el.className = 'show ' + t;
    const timeoutId = setTimeout(() => el.className = '', 4000);
    (el as any)._ = timeoutId;
}

// --- Multi-step Navigation ---
const track = document.getElementById('formTrack') as HTMLElement;
const dot1 = document.getElementById('dot1');
const dot2 = document.getElementById('dot2');

function setErr(id: string, show: boolean) {
    const el = document.getElementById('e-' + id);
    if (el) el.style.display = show ? 'block' : 'none';
}

document.getElementById('nextBtn')?.addEventListener('click', () => {
    let ok = true;
    const fn = (document.getElementById('fullname') as HTMLInputElement).value.trim();
    const em = (document.getElementById('email') as HTMLInputElement).value.trim();
    const pw = (document.getElementById('password') as HTMLInputElement).value;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!fn) { setErr('name', true); ok = false; } else { setErr('name', false); }
    if (!re.test(em)) { setErr('email', true); ok = false; } else { setErr('email', false); }
    if (pw.length < 8) { setErr('pw', true); ok = false; } else { setErr('pw', false); }

    if (ok && track) {
        track.style.transform = 'translateX(-50%)';
        dot1?.classList.remove('active');
        dot2?.classList.add('active');
    }
});

document.getElementById('backBtn')?.addEventListener('click', () => {
    if (track) {
        track.style.transform = 'translateX(0)';
        dot2?.classList.remove('active');
        dot1?.classList.add('active');
    }
});

// --- Faculty & Department Logic ---
const depts: Record<string, string[]> = {
    SOC: ['Software Engineering (SEN)', 'Computer Science (CSC)', 'Cybersecurity (CYS)', 'Data Science (DSC)', 'Information Systems (IFS)', 'Information Technology (IFT)'],
    SLIT: ['Financial Technology (FinTech)', 'Business Information Technology (BIT)', 'Entrepreneurship Management Technology (EMT)', 'Logistics and Transport Technology (LTT)', 'Maritime Technology and Logistics (MTL)', 'Project Management Technology (PMT)', 'Securities and Investment Management Technology (SIMT)', 'Supply Chain Management (SCM)'],
    SPS: ['Educational Technology (EDT)', 'Library and Information Science (LIS)', 'Physics (PHY)', 'Mathematics (MTH)', 'Chemistry (CHE)', 'Statistics (STA)'],
    SESE: ['Computer Engineering (CPE)', 'Electrical and Electronics Engineering (EEE)', 'Information and Communication Engineering (ICE)', 'Mechatronics Engineering (MCE)', 'Biomedical Engineering (BME)'],
    SIMME: ['Mechanical Engineering (MEE)', 'Civil and Environmental Engineering (CVE)', 'Agricultural Engineering (AGE)', 'Chemical Engineering (CHE)', 'Industrial and Production Engineering (IPE)', 'Metallurgical and Materials Engineering (MME)', 'Mining Engineering (MNE)'],
    SET: ['Architecture (ARC)', 'Building (BDG)', 'Environmental Management (EVM)', 'Estate Management (ESM)', 'Industrial Design (IDD)', 'Quantity Surveying (QSV)', 'Surveying and Geoinformatics (SVG)', 'Urban and Regional Planning (URP)'],
    SAAT: ['Agricultural and Resource Economics (ARE)', 'Agricultural Extension and Communication Technology (AEC)', 'Animal Production and Health (APH)', 'Crop, Soil and Pest Management (CSP)', 'Ecotourism and Wildlife Management (EWM)', 'Fisheries and Aquaculture Technology (FAT)', 'Food Science and Technology (FST)', 'Forestry and Wood Technology (FWT)', 'Nutrition and Dietetics (NUD)'],
    SEMS: ['Applied Geology (AGY)', 'Applied Geophysics (AGP)', 'Marine Science and Technology (MST)', 'Meteorology and Climate Science (MET)', 'Remote Sensing and Geoscience Information Systems (RSG)'],
    SLS: ['Biochemistry (BCH)', 'Biology (BIO)', 'Biotechnology (BTH)', 'Microbiology (MCB)'],
    CHS: ['Medicine and Surgery (MBBS)', 'Nursing Science (NSC)', 'Human Anatomy (ANA)', 'Physiology (PHS)', 'Medical Laboratory Science (MLS)', 'Public Health (PUH)'],
    GNS: ['General Studies (GNS)']
};

document.getElementById('faculty')?.addEventListener('change', function (this: HTMLSelectElement) {
    const s = document.getElementById('dept') as HTMLSelectElement;
    if (!s) return;
    s.innerHTML = '<option value="" disabled selected>Select department</option>';
    const selectedFaculty = this.value;

    if (depts[selectedFaculty]) {
        depts[selectedFaculty].forEach(d => {
            const o = document.createElement('option');
            o.value = d;
            o.textContent = d;
            s.appendChild(o);
        });
    }
    setErr('fac', false);
});

// --- Registration Submission ---
document.getElementById('sf')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    let ok = true;

    const fn = (document.getElementById('fullname') as HTMLInputElement).value.trim();
    const em = (document.getElementById('email') as HTMLInputElement).value.trim();
    const pw = (document.getElementById('password') as HTMLInputElement).value;
    const cd = (document.getElementById('code') as HTMLSelectElement).value;
    const phNum = (document.getElementById('phone') as HTMLInputElement).value.trim();
    const ph = cd + phNum;
    const fa = (document.getElementById('faculty') as HTMLSelectElement).value;
    const de = (document.getElementById('dept') as HTMLSelectElement).value;

    if (phNum.length < 7) { setErr('phone', true); ok = false; } else { setErr('phone', false); }
    if (!fa) { setErr('fac', true); ok = false; } else { setErr('fac', false); }
    if (!de) { setErr('dept', true); ok = false; } else { setErr('dept', false); }

    if (ok) {
        const btn = document.getElementById('subBtn') as HTMLButtonElement;
        const btxt = btn?.querySelector('.btxt');

        if (btn && btxt) {
            btn.disabled = true;
            btxt.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> CREATING...';

            try {
                if (!db) throw new Error('Database not initialized');
                const { data: authData, error: authError } = await db.auth.signUp({
                    email: em,
                    password: pw
                });
                if (authError) throw authError;

                const uid = authData.user?.id;
                if (uid) {
                    const { error: dbError } = await db.from('students').insert([{
                        id: uid, fullname: fn, email: em, faculty: fa, department: de, phone: ph
                    }]);
                    if (dbError) throw dbError;
                }

                btxt.innerHTML = '<i class="fa-solid fa-check"></i> SUCCESS';
                btn.style.background = '#10b981';
                btn.style.boxShadow = '0 0 30px rgba(16,185,129,0.5)';

                toast('🎉 Account created! Redirecting to login...', 'ok');
                setTimeout(() => window.location.href = 'login.html', 2000);

            } catch (err: any) {
                console.error(err);
                toast('❌ ' + (err.message || 'Something went wrong. Please try again.'), 'bad');
                btn.disabled = false;
                btxt.innerHTML = '<i class="fa-solid fa-user-plus"></i> REGISTER';
            }
        }
    }
});

// --- Background Blobs Animation ---
const cv = document.getElementById('c') as HTMLCanvasElement;
const ct = cv?.getContext('2d');
let W: number, H: number;

function rs() {
    if (!cv) return;
    W = cv.width = window.innerWidth;
    H = cv.height = window.innerHeight;
}

if (cv) {
    rs();
    window.addEventListener('resize', rs);
}

const blobs = Array.from({ length: document.body.classList.contains('perf-mode') ? 3 : 7 }, (_, i) => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - .5) * .3,
    vy: (Math.random() - .5) * .3,
    r: 120 + Math.random() * 150,
    ph: Math.random() * Math.PI * 2,
    sp: .0015 + Math.random() * .003
}));

let mx = window.innerWidth / 2, my = window.innerHeight / 2;
window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

let fr = 0;
function loop() {
    if ((window as any).stopCanvasAnimation || !ct) {
        if (ct) ct.clearRect(0, 0, W, H);
        return;
    }

    fr++;
    ct.clearRect(0, 0, W, H);

    blobs.forEach((b, i) => {
        b.x += b.vx + Math.sin(fr * b.sp + b.ph) * .3;
        b.y += b.vy + Math.cos(fr * b.sp + b.ph * 1.4) * .25;
        if (b.x < -b.r) b.x = W + b.r; if (b.x > W + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = H + b.r; if (b.y > H + b.r) b.y = -b.r;

        const pr = b.r + Math.sin(fr * .0008 + b.ph) * 20;
        const hue = document.documentElement.getAttribute('data-theme') === 'dark' ? '210,100%,55%' : '210,100%,40%';
        const alpha = i < 3 ? .04 : .02;
        const g = ct.createRadialGradient(b.x, b.y, 0, b.x, b.y, pr);
        g.addColorStop(0, `hsla(${hue},${alpha})`);
        g.addColorStop(1, 'transparent');
        ct.beginPath(); ct.arc(b.x, b.y, pr, 0, Math.PI * 2);
        ct.fillStyle = g; ct.fill();
    });

    requestAnimationFrame(loop);
}
if (cv) loop();

// --- Form Enhancements ---
const togPw = document.getElementById('togPw');
if (togPw) {
    togPw.addEventListener('click', function (e) {
        e.preventDefault();
        const p = document.getElementById('password') as HTMLInputElement;
        const t = p.type === 'text';
        p.type = t ? 'password' : 'text';
        this.classList.toggle('fa-eye', t); this.classList.toggle('fa-eye-slash', !t);
    });
}

document.getElementById('password')?.addEventListener('input', function (this: HTMLInputElement) {
    const v = this.value; let s = 0;
    if (v.length >= 8) s++; if (/[A-Z]/.test(v)) s++; if (/[0-9]/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++;
    const c = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'];
    [1, 2, 3, 4].forEach(i => {
        const sg = document.getElementById('s' + i);
        if (sg) {
            if (i <= s) { sg.style.background = c[s - 1]; }
            else { sg.style.background = 'rgba(255,255,255,.05)'; }
        }
    });
});

const cur = document.getElementById('cur'), ring = document.getElementById('cur-ring');
let rx = 0, ry = 0;
window.addEventListener('mousemove', e => {
    if (cur) { cur.style.left = e.clientX + 'px'; cur.style.top = e.clientY + 'px'; }
});

(function animateRing() {
    if (ring) {
        rx += (mx - rx) * 0.15; ry += (my - ry) * 0.15;
        ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    }
    requestAnimationFrame(animateRing);
})();
