
/**
 * leaderboard.ts - Global Rankings Logic
 * Fetches and displays top student scores from the database.
 */

import { db } from './ui-core';

// Declare Lucide for icon rendering
declare const lucide: any;

/**
 * Toggle sidebar navigation on mobile
 */
export function toggleSidebar(): void {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');
}

/**
 * Fetch leaderboard data from Supabase
 */
export async function fetchLeaderboard(period: string = 'weekly'): Promise<void> {
    const loader = document.getElementById('loader');
    const content = document.getElementById('leaderboard-content');
    
    if (loader) loader.style.display = 'block';
    if (content) content.style.display = 'none';

    try {
        if (!db) throw new Error('Database not initialized');

        // Note: For a real production app, 'period' would filter the created_at column.
        // For now, we fetch top overall scores and join with student names.
        const { data, error } = await db
            .from('test_results')
            .select(`
                score,
                students (
                    fullname,
                    department
                )
            `)
            .order('score', { ascending: false })
            .limit(20);

        if (error) throw error;

        const formattedData = data.map((r: any) => ({
            student_name: r.students?.fullname || "Unknown Student",
            student_dept: r.students?.department || "N/A",
            score: r.score
        }));

        renderLeaderboard(formattedData);
    } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
        // Fallback to mock data if DB fails or is empty
        const mockData = [
            { student_name: "Fatima K.", student_dept: "MEE", score: 98 },
            { student_name: "Adeyemi O.", student_dept: "CSC", score: 95 },
            { student_name: "Emeka B.", student_dept: "CVE", score: 91 },
            { student_name: "Sola O.", student_dept: "EEE", score: 88 },
            { student_name: "Chioma U.", student_dept: "STA", score: 85 }
        ];
        renderLeaderboard(mockData);
    } finally {
        if (loader) loader.style.display = 'none';
        if (content) content.style.display = 'block';
    }
}

/**
 * Render the podium and list area
 */
function renderLeaderboard(data: any[]): void {
    const podiumArea = document.getElementById('podiumArea');
    const listArea = document.getElementById('listArea');
    
    if (!podiumArea || !listArea) return;
    
    podiumArea.innerHTML = '';
    listArea.innerHTML = '';

    if (!data || data.length === 0) {
        listArea.innerHTML = `<div style="padding:30px; text-align:center; color:var(--text-muted)">No scores found for this period yet. Be the first! 🚀</div>`;
        return;
    }

    // Render Podium (Top 3)
    let podiumHTML = '';

    // Rank 2 (Silver)
    if (data[1]) {
        const initials = data[1].student_name.substring(0, 2).toUpperCase();
        podiumHTML += `
        <div class="podium-step step-2">
            <div class="podium-medal">🥈</div>
            <div class="podium-avatar">${initials}</div>
            <div class="podium-info">
                <div class="podium-name">${data[1].student_name}</div>
                <div class="podium-score">${data[1].score}%</div>
            </div>
        </div>`;
    }

    // Rank 1 (Gold)
    if (data[0]) {
        const initials = data[0].student_name.substring(0, 2).toUpperCase();
        podiumHTML += `
        <div class="podium-step step-1">
            <div class="podium-medal">🥇</div>
            <div class="podium-avatar">${initials}</div>
            <div class="podium-info">
                <div class="podium-name">${data[0].student_name}</div>
                <div class="podium-score">${data[0].score}%</div>
            </div>
        </div>`;
    }

    // Rank 3 (Bronze)
    if (data[2]) {
        const initials = data[2].student_name.substring(0, 2).toUpperCase();
        podiumHTML += `
        <div class="podium-step step-3">
            <div class="podium-medal">🥉</div>
            <div class="podium-avatar">${initials}</div>
            <div class="podium-info">
                <div class="podium-name">${data[2].student_name}</div>
                <div class="podium-score">${data[2].score}%</div>
            </div>
        </div>`;
    }
    
    podiumArea.innerHTML = podiumHTML;

    // Render remaining list
    for (let i = 3; i < data.length; i++) {
        const initials = data[i].student_name.substring(0, 2).toUpperCase();
        listArea.innerHTML += `
        <div class="rank-row">
            <div class="col-rank">#${i + 1}</div>
            <div class="col-student">
                <div class="list-avatar">${initials}</div>
                <div class="student-details">
                    <h4>${data[i].student_name}</h4>
                    <p>${data[i].student_dept}</p>
                </div>
            </div>
            <div class="col-score">${data[i].score}%</div>
        </div>`;
    }
}

// Initializers
window.addEventListener('DOMContentLoaded', () => {
    fetchLeaderboard('weekly');
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Active tab styling
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // Bind to window for HTML event handlers
    (window as any).toggleSidebar = toggleSidebar;
    (window as any).fetchLeaderboard = fetchLeaderboard;
});
