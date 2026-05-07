
/**
 * tips.ts - Learning Tips & Analytics
 */

export {};

declare const lucide: any;

/**
 * Log page visit for analytics (optional)
 */
async function logVisit(): Promise<void> {
    const studentMatric = localStorage.getItem('studentMatric') || "Unknown";
    
    // Original analytics call - pointing to a potentially temporary ngrok URL
    try {
        await fetch("https://florencia-prorefugee-unindustriously.ngrok-free.dev", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matric: studentMatric, page: 'tips' })
        });
    } catch (e) {
        // Silently fail analytics if endpoint is down
    }
}

window.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    logVisit();
});
