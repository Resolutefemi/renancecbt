
/**
 * ui-core.ts - Core UI and Database logic for RENANCE CBT
 * Handles: Theme switching, Navigation injection, Security, and Performance optimization.
 */

import { SUPABASE_CONFIG } from './config';

// --- Global Styles Injection ---
(function injectGlobalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --bg-primary: #000000;
            --bg-secondary: #0a0a0a;
            --bg-glass: rgba(15, 15, 15, 0.85);
            --text-main: #ffffff;
            --text-muted: #94a3b8;
            --accent: #06b6d4;
            --accent-glow: rgba(6, 182, 212, 0.1);
            --border: rgba(255, 255, 255, 0.1);
            --glow: #06b6d4;
        }
        html, body {
            background-color: #000000 !important;
            color: #ffffff !important;
            font-family: 'Cabinet Grotesk', 'Outfit', sans-serif !important;
            margin: 0;
            padding: 0;
        }
        .glass, .glass-heavy {
            background: var(--bg-glass) !important;
            border: 1px solid var(--border) !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
        }
        .navbar {
            background: rgba(0, 0, 0, 0.8) !important;
            border-bottom: 1px solid var(--border) !important;
        }
        .btn-primary {
            background: linear-gradient(135deg, #0284c7, #06b6d4) !important;
            box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3) !important;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #ffffff !important;
        }
        input, select, textarea {
            background: rgba(255, 255, 255, 0.05) !important;
            border: 1px solid var(--border) !important;
            color: #ffffff !important;
            outline: none !important;
        }
        input:focus, select:focus {
            border-color: var(--accent) !important;
            box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2) !important;
        }
    `;
    document.head.appendChild(style);
})();

// Declare Supabase global (provided by CDN)
declare const supabase: any;

// Initialize Supabase once
export let db: any = null;
if (typeof supabase !== 'undefined') {
    db = supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);
    (window as any)._db = db; // Global reference for legacy scripts
}

// --- UI: Theme Management ---
export function initTheme(): void {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

export function toggleTheme(): void {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme: string): void {
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
}

// --- UI: Navigation Injection ---
export function injectNavbar(): void {
    const navbar = document.createElement('nav');
    navbar.className = 'navbar glass';
    
    // Get current page to set active link
    const currentPath = window.location.pathname;
    const isDashboard = currentPath.includes('dashboard');
    const isGpa = currentPath.includes('gpa');
    const isChat = currentPath.includes('chat');

    navbar.innerHTML = `
        <a href="dashboard.html" class="nav-brand">
            <div class="nav-logo"><i class="fa-solid fa-graduation-cap"></i></div>
            <div class="nav-title">RENANCE</div>
        </a>
        <div class="nav-links">
            <a href="dashboard.html" class="nav-link ${isDashboard ? 'active' : ''}">Dashboard</a>
            <a href="gpa.html" class="nav-link ${isGpa ? 'active' : ''}">GPA Calc</a>
            <a href="chat.html" class="nav-link ${isChat ? 'active' : ''}">Study Hub</a>
            <button class="theme-toggle" id="theme-toggle" title="Toggle Dark/Light Mode">
                <i class="fa-solid fa-moon"></i>
            </button>
            <div id="user-profile" style="display: flex; align-items: center; gap: 10px; margin-left: 10px;">
                <!-- User avatar or logout will be injected here -->
            </div>
        </div>
    `;
    
    document.body.prepend(navbar);
    
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    updateThemeIcon(document.documentElement.getAttribute('data-theme') || 'light');
    
    updateUserProfile();
}

async function updateUserProfile(): Promise<void> {
    const profileDiv = document.getElementById('user-profile');
    if (!profileDiv || !db) return;
    
    try {
        const { data: { user } } = await db.auth.getUser();
        if (user) {
            profileDiv.innerHTML = `
                <button class="btn btn-primary" id="logout-btn" style="padding: 0.5rem 1rem; font-size: 0.8rem;">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            `;
            document.getElementById('logout-btn')?.addEventListener('click', async () => {
                await db.auth.signOut();
                window.location.href = 'index.html';
            });
        }
    } catch (e) {
        console.error('Profile update failed:', e);
    }
}

// --- PERFORMANCE: Low-end Device Optimization ---
export function optimizeForDevice(): void {
    const isLowEnd = (navigator as any).hardwareConcurrency <= 4 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isLowEnd) {
        document.body.classList.add('perf-mode');
        (window as any).stopCanvasAnimation = true; 
    }
}

// Global initialization
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        initTheme();
        optimizeForDevice();
        
        // Only inject navbar if it's not the login/signup page
        if (!window.location.pathname.includes('index.html') && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('registration.html')) {
            injectNavbar();
            document.body.style.paddingTop = '90px';
        }
    });
}
