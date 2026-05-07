
/**
 * profile.ts - User Profile Management
 * Handles: Loading user data, editing profile, and syncing with Supabase/LocalStorage.
 */

import { db } from './ui-core';

// Declare Lucide for icon rendering
declare const lucide: any;

/**
 * Toggle sidebar navigation on mobile
 */
function toggleNav(): void {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme(): void {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

/**
 * Load student data from database or localStorage
 */
async function loadData(): Promise<void> {
    let name = localStorage.getItem('studentName') || "FUTA Student";
    let dept = localStorage.getItem('studentDept') || "Department";
    let matric = localStorage.getItem('studentMatric') || "CSC/25/0000";

    // Attempt to sync from Supabase if logged in
    if (db) {
        try {
            const { data: { user } } = await db.auth.getUser();
            if (user) {
                const { data, error } = await db
                    .from('students')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data && !error) {
                    name = data.fullname || name;
                    dept = data.department || dept;
                    localStorage.setItem('studentName', name);
                    localStorage.setItem('studentDept', dept);
                }
            }
        } catch (e) {
            console.warn("Could not sync profile from database, using local storage.");
        }
    }

    // Update UI Elements
    updateUI(name, dept, matric);
}

/**
 * Update the DOM with user information
 */
function updateUI(name: string, dept: string, matric: string): void {
    const valName = document.getElementById('val_name');
    const valDept = document.getElementById('val_dept');
    const valMatric = document.getElementById('val_matric');
    const pTopName = document.getElementById('p_top_name');
    const pTopMatric = document.getElementById('p_top_matric');
    const navUserName = document.getElementById('navUserName');
    const pInitials = document.getElementById('p_initials');
    const navInitials = document.getElementById('navInitials');

    if (valName) valName.innerText = name;
    if (valDept) valDept.innerText = dept;
    if (valMatric) valMatric.innerText = matric;
    if (pTopName) pTopName.innerText = name;
    if (pTopMatric) pTopMatric.innerText = "Matric: " + matric;
    if (navUserName) navUserName.innerText = name.split(' ')[0];

    const initials = name.trim().split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    if (pInitials) pInitials.innerText = initials || "??";
    if (navInitials) navInitials.innerText = initials || "??";
}

/**
 * Enter edit mode
 */
function toggleEdit(): void {
    const infoValues = document.querySelectorAll('.info-value');
    const editInputs = document.querySelectorAll('.edit-input');
    
    infoValues.forEach(s => (s as HTMLElement).style.display = 'none');
    editInputs.forEach(i => (i as HTMLElement).style.display = 'block');
    
    const inputName = document.getElementById('input_name') as HTMLInputElement;
    const inputDept = document.getElementById('input_dept') as HTMLInputElement;
    const inputMatric = document.getElementById('input_matric') as HTMLInputElement;
    
    const valName = document.getElementById('val_name');
    const valDept = document.getElementById('val_dept');
    const valMatric = document.getElementById('val_matric');

    if (inputName && valName) inputName.value = valName.innerText;
    if (inputDept && valDept) inputDept.value = valDept.innerText;
    if (inputMatric && valMatric) inputMatric.value = valMatric.innerText;

    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    if (editBtn) editBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'flex';
}

/**
 * Save profile changes to local storage and database
 */
async function saveProfile(): Promise<void> {
    const inputName = document.getElementById('input_name') as HTMLInputElement;
    const inputDept = document.getElementById('input_dept') as HTMLInputElement;
    const inputMatric = document.getElementById('input_matric') as HTMLInputElement;

    const newName = inputName?.value || "";
    const newDept = inputDept?.value || "";
    const newMatric = (inputMatric?.value || "").toUpperCase();

    if (newName.length < 3) {
        alert("Please enter a valid name");
        return;
    }

    // Save to LocalStorage
    localStorage.setItem('studentName', newName);
    localStorage.setItem('studentDept', newDept);
    localStorage.setItem('studentMatric', newMatric);

    // Sync to Supabase if possible
    if (db) {
        try {
            const { data: { user } } = await db.auth.getUser();
            if (user) {
                await db.from('students').update({
                    fullname: newName,
                    department: newDept
                }).eq('id', user.id);
            }
        } catch (e) {
            console.error("Failed to sync profile to database.");
        }
    }

    // Exit edit mode
    const infoValues = document.querySelectorAll('.info-value');
    const editInputs = document.querySelectorAll('.edit-input');
    infoValues.forEach(s => (s as HTMLElement).style.display = 'block');
    editInputs.forEach(i => (i as HTMLElement).style.display = 'none');
    
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    if (editBtn) editBtn.style.display = 'flex';
    if (saveBtn) saveBtn.style.display = 'none';

    loadData(); 
    alert("Profile Updated Successfully!");
}

/**
 * Log out and clear session
 */
async function logout(): Promise<void> {
    if (db) {
        await db.auth.signOut();
    }
    localStorage.clear();
    window.location.href = 'login.html';
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Event Listeners
    document.getElementById('btn-toggle-nav')?.addEventListener('click', toggleNav);
    document.getElementById('btn-close-nav')?.addEventListener('click', toggleNav);
    document.getElementById('btn-toggle-theme')?.addEventListener('click', toggleTheme);
    document.getElementById('editBtn')?.addEventListener('click', toggleEdit);
    document.getElementById('saveBtn')?.addEventListener('click', saveProfile);
    document.getElementById('btn-logout')?.addEventListener('click', logout);
});

