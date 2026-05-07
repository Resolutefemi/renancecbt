
/**
 * login.ts - Logic for the Sign In page
 * Handles: Network background animation, form submission, and password reset.
 */

import { db } from './ui-core';

// --- Global Styles Injection ---
(function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --bg: #000000;
            --blue: #3b82f6;
            --glow: #06b6d4;
            --cyan: #22d3ee;
            --violet: #818cf8;
            --ink: #ffffff;
            --muted: #94a3b8;
            --card: rgba(10, 10, 10, 0.8);
            --border: rgba(255, 255, 255, 0.1);
        }
        html, body {
            background-color: #000000 !important;
            color: #ffffff !important;
        }
    `;
    document.head.appendChild(style);
})();

// --- Background Animation ---
const bgC = document.getElementById('bg-canvas') as HTMLCanvasElement;
const ct = bgC?.getContext('2d');
let W: number, H: number;

function rs() {
    if (!bgC) return;
    W = bgC.width = window.innerWidth;
    H = bgC.height = window.innerHeight;
}

if (bgC) {
    rs();
    window.addEventListener('resize', rs);
}

let isAnimating = window.innerWidth > 768;
window.addEventListener('resize', () => {
    rs();
    const wasAnimating = isAnimating;
    isAnimating = window.innerWidth > 768;
    if (!wasAnimating && isAnimating) drawNetwork();
});

interface Node {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
}

const nodes: Node[] = [];
for (let i = 0; i < 180; i++) {
    nodes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4 - 0.3,
        size: Math.random() * 2 + 0.5
    });
}

let mx = window.innerWidth / 2, my = window.innerHeight / 2;
window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

function drawNetwork() {
    if (!isAnimating || !ct) return;

    ct.clearRect(0, 0, W, H);

    const aura = ct.createRadialGradient(mx, my, 0, mx, my, 400);
    aura.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
    aura.addColorStop(1, 'transparent');
    ct.fillStyle = aura;
    ct.fillRect(0, 0, W, H);

    nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0) n.x = W; if (n.x > W) n.x = 0;
        if (n.y < 0) n.y = H; if (n.y > H) n.y = 0;

        let dx = n.x - mx, dy = n.y - my;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 350) {
            ct.beginPath();
            ct.arc(n.x, n.y, n.size, 0, Math.PI * 2);
            ct.fillStyle = `rgba(6, 182, 212, ${1 - dist / 350})`;
            ct.fill();

            for (let j = 0; j < nodes.length; j++) {
                let n2 = nodes[j];
                let dx2 = n.x - n2.x, dy2 = n.y - n2.y;
                let dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

                if (dist2 < 100) {
                    ct.beginPath();
                    ct.moveTo(n.x, n.y);
                    ct.lineTo(n2.x, n2.y);
                    ct.strokeStyle = `rgba(59, 130, 246, ${(1 - dist2 / 100) * (1 - dist / 350)})`;
                    ct.lineWidth = 0.8;
                    ct.stroke();
                }
            }
        }
    });

    requestAnimationFrame(drawNetwork);
}
if (isAnimating) drawNetwork();

// --- Custom Cursor ---
const dot = document.getElementById('cur-dot'), ring = document.getElementById('cur-ring');
let rx = 0, ry = 0;

window.addEventListener('mousemove', e => {
    if (dot) {
        dot.style.left = e.clientX + 'px';
        dot.style.top = e.clientY + 'px';
    }
});

(function ac() {
    if (isAnimating && ring) {
        rx += (mx - rx) * 0.15; ry += (my - ry) * 0.15;
        ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    }
    requestAnimationFrame(ac);
})();

document.querySelectorAll('input,button,a,.icr,.modal-close').forEach(el => {
    el.addEventListener('mouseenter', () => {
        if (ring) {
            ring.style.width = '50px'; ring.style.height = '50px'; ring.style.background = 'rgba(6, 182, 212, 0.1)';
        }
    });
    el.addEventListener('mouseleave', () => {
        if (ring) {
            ring.style.width = '36px'; ring.style.height = '36px'; ring.style.background = 'transparent';
        }
    });
});

// --- Card Hover Effect ---
const card = document.getElementById('card'), glare = document.getElementById('glare');
if (card && glare) {
    card.addEventListener('mousemove', (e: MouseEvent) => {
        if (!isAnimating) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left; const y = e.clientY - rect.top;
        const cx = rect.width / 2; const cy = rect.height / 2;
        const rotateX = ((y - cy) / cy) * -8;
        const rotateY = ((x - cx) / cx) * 8;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        glare.style.setProperty('--mx', (x / rect.width * 100) + '%');
        glare.style.setProperty('--my', (y / rect.height * 100) + '%');
    });
    card.addEventListener('mouseleave', () => {
        if (!isAnimating) return;
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        card.style.transition = 'transform 0.5s ease';
        setTimeout(() => { if (card) card.style.transition = ''; }, 500);
    });
}

// --- Text Glitch Effect ---
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
const glitchEl = document.getElementById('glitch-text');
const originalText = glitchEl?.getAttribute('data-value') || '';

if (glitchEl) {
    window.addEventListener('load', () => {
        let iterations = 0;
        const interval = setInterval(() => {
            glitchEl.innerText = originalText.split("").map((letter, index) => {
                if (index < iterations) return originalText[index];
                return CHARS[Math.floor(Math.random() * CHARS.length)];
            }).join("");
            if (iterations >= originalText.length) clearInterval(interval);
            iterations += 1 / 3;
        }, 35);
    });
}

// --- Form Controls & Auth ---
const togPw = document.getElementById('togPw');
if (togPw) {
    togPw.addEventListener('click', function (e) {
        e.preventDefault();
        const pw = document.getElementById('password') as HTMLInputElement;
        const t = pw.type === 'text';
        pw.type = t ? 'password' : 'text';
        this.classList.toggle('fa-eye', t); this.classList.toggle('fa-eye-slash', !t);
    });
}

function showMsg(text: string, type: string = '') {
    const m = document.getElementById('msg');
    if (m) {
        m.textContent = text; m.className = type;
        m.style.display = 'block';
    }
}

function hideMsg() {
    const m = document.getElementById('msg');
    if (m) m.style.display = 'none';
}

const forgotLink = document.getElementById('forgotLink');
const forgotModal = document.getElementById('forgotModal');
const closeModal = document.getElementById('closeModal');

if (forgotLink && forgotModal) {
    forgotLink.addEventListener('click', e => {
        e.preventDefault();
        forgotModal.classList.add('open');
        const resetEmail = document.getElementById('resetEmail') as HTMLInputElement;
        if (resetEmail) resetEmail.value = '';
        const fb = document.getElementById('reset-feedback');
        if (fb) fb.style.display = 'none';
    });
}

if (closeModal && forgotModal) {
    closeModal.addEventListener('click', () => {
        forgotModal.classList.remove('open');
    });
}

const sendResetBtn = document.getElementById('sendResetBtn') as HTMLButtonElement;
if (sendResetBtn) {
    sendResetBtn.addEventListener('click', async function () {
        const resetEmail = document.getElementById('resetEmail') as HTMLInputElement;
        const email = resetEmail?.value.trim();
        const fb = document.getElementById('reset-feedback');
        const btnTxt = document.getElementById('resetBtxt');

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            if (fb) {
                fb.textContent = '❌ Please enter a valid email address.';
                fb.className = 'bad'; fb.style.display = 'block';
            }
            return;
        }

        this.disabled = true;
        if (btnTxt) btnTxt.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>&nbsp; SENDING…';

        try {
            if (!db) throw new Error('Database not initialized');
            const { error } = await db.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password.html'
            });
            if (error) throw error;
            if (fb) {
                fb.textContent = '✅ Reset link sent! Check your inbox.';
                fb.className = 'ok'; fb.style.display = 'block';
            }
        } catch (err: any) {
            if (fb) {
                fb.textContent = '❌ ' + (err.message || 'Failed to send reset link.');
                fb.className = 'bad'; fb.style.display = 'block';
            }
        } finally {
            this.disabled = false;
            if (btnTxt) btnTxt.innerHTML = '<i class="fa-solid fa-paper-plane"></i>&nbsp; SEND RESET LINK';
        }
    });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideMsg();

        const emailEl = document.getElementById('email') as HTMLInputElement;
        const passwordEl = document.getElementById('password') as HTMLInputElement;
        const rememberEl = document.getElementById('rememberMe') as HTMLInputElement;

        const email = emailEl?.value.trim();
        const password = passwordEl?.value;
        const remember = rememberEl?.checked;

        if (!email || !password) {
            showMsg('Please fill in all fields.'); return;
        }

        const btn = document.getElementById('loginBtn') as HTMLButtonElement;
        const btxt = document.getElementById('btxt');
        if (btn && btxt) {
            btn.disabled = true;
            btxt.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>&nbsp; AUTHENTICATING…';

            try {
                if (!db) throw new Error('Database not initialized');
                const { data: authData, error: authError } = await db.auth.signInWithPassword({
                    email, password
                });

                if (authError) throw authError;

                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('student_email', email);
                if (remember) localStorage.setItem('renance_remember', email);
                else localStorage.removeItem('renance_remember');

                btxt.innerHTML = '<i class="fa-solid fa-check"></i>&nbsp; SUCCESS';
                btn.style.background = '#10b981';
                btn.style.boxShadow = '0 0 30px rgba(16,185,129,0.5)';

                setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);

            } catch (err: any) {
                console.error('Login error:', err);
                let msg = 'Something went wrong. Please try again.';
                if (err.message?.toLowerCase().includes('invalid') || err.message?.toLowerCase().includes('credentials')) {
                    msg = '❌ Incorrect email or password.';
                } else if (err.message) {
                    msg = '❌ ' + err.message;
                }
                showMsg(msg);
                btn.disabled = false;
                btxt.innerHTML = '<i class="fa-solid fa-bolt"></i>&nbsp; LOGIN';
                btn.style.background = '';
                btn.style.boxShadow = '';
            }
        }
    });
}

const remembered = localStorage.getItem('renance_remember');
if (remembered) {
    const emailEl = document.getElementById('email') as HTMLInputElement;
    const rememberMeEl = document.getElementById('rememberMe') as HTMLInputElement;
    if (emailEl) emailEl.value = remembered;
    if (rememberMeEl) rememberMeEl.checked = true;
}
