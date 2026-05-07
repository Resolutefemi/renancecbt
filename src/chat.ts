
import { db } from './ui-core';

/**
 * Chat Module for RENANCE Study Hub
 * Handles real-time messaging, file uploads, and community interactions.
 */

// Lucide icon declaration (provided by CDN)
declare const lucide: any;

// State management
let chatDisplayName: string | null = localStorage.getItem('futa_chat_name');
let selectedFile: File | null = null;
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let isRecording: boolean = false;

// DOM Elements
const chatBox = document.getElementById('chatBox') as HTMLDivElement;
const messageInput = document.getElementById('messageInput') as HTMLTextAreaElement;
const fileUpload = document.getElementById('fileUpload') as HTMLInputElement;
const filePreviewBar = document.getElementById('filePreviewBar') as HTMLDivElement;
const fileNameDisplay = document.getElementById('fileNameDisplay') as HTMLSpanElement;
const chatStatus = document.getElementById('chatStatus') as HTMLParagraphElement;
const adminLockBanner = document.getElementById('adminLockBanner') as HTMLDivElement;
const usernameModal = document.getElementById('usernameModal') as HTMLDivElement;
const customNameInput = document.getElementById('customNameInput') as HTMLInputElement;

/**
 * Initialize Chat on Load
 */
window.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    if (!chatDisplayName) {
        if (usernameModal) usernameModal.style.display = 'flex';
    } else {
        initChat();
    }

    // Event Listeners
    document.getElementById('attachBtn')?.addEventListener('click', () => fileUpload?.click());
    document.getElementById('micBtn')?.addEventListener('click', toggleRecording);
    document.getElementById('sendBtn')?.addEventListener('click', sendMessage);
    document.getElementById('cancelFileBtn')?.addEventListener('click', cancelFile);
    document.getElementById('joinChatBtn')?.addEventListener('click', saveUsername);
    
    fileUpload?.addEventListener('change', handleFileSelection);
    messageInput?.addEventListener('input', () => autoResize(messageInput));
    messageInput?.addEventListener('keypress', handleEnter);
});

/**
 * Save user's display name and notify the hub
 */
async function saveUsername() {
    const input = customNameInput?.value.trim();
    if (!input || input.length < 3) {
        alert("Please enter a name with at least 3 characters!");
        return;
    }
    
    chatDisplayName = input;
    localStorage.setItem('futa_chat_name', input);
    if (usernameModal) usernameModal.style.display = 'none';
    
    initChat();

    // Broadcast join message
    if (db) {
        await db.from('messages').insert([
            { author: 'System', text: `${chatDisplayName} joined the hub! 🚀`, is_system: true }
        ]);
    }
}

/**
 * Initialize Supabase real-time subscriptions
 */
function initChat() {
    if (!db) return;

    scrollToBottom();

    // Subscribe to new messages
    db.channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
            const msg = payload.new;
            const dateObj = new Date(msg.created_at);
            const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (msg.is_system) {
                addSystemMessage(msg.text);
            } else if (msg.author !== chatDisplayName) {
                renderMessage(msg.author, msg.text, timeString, 'theirs', { 
                    url: msg.file_url, 
                    name: msg.file_name, 
                    isImage: msg.is_image, 
                    isAudio: msg.is_audio 
                });
            }
        }).subscribe();

    // Subscribe to admin chat settings (lock/unlock)
    db.channel('public:chat_settings')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_settings' }, (payload: any) => {
            toggleAdminLock(payload.new.is_locked);
        }).subscribe();

    // Initial check for chat lock status
    db.from('chat_settings').select('is_locked').eq('id', 1).single().then(({ data }: any) => {
        if (data) toggleAdminLock(data.is_locked);
    });
}

/**
 * Toggle input availability based on admin lock
 */
function toggleAdminLock(isLocked: boolean) {
    const attachBtn = document.getElementById('attachBtn') as HTMLButtonElement;
    const micBtn = document.getElementById('micBtn') as HTMLButtonElement;
    const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;

    if (isLocked) {
        if (messageInput) {
            messageInput.disabled = true;
            messageInput.placeholder = "Chat is locked by Admin.";
        }
        if (attachBtn) attachBtn.disabled = true;
        if (micBtn) micBtn.disabled = true;
        if (sendBtn) sendBtn.disabled = true;
        if (adminLockBanner) adminLockBanner.style.display = 'block';
        if (chatStatus) {
            chatStatus.innerText = "Locked 🔒";
            chatStatus.style.color = "var(--danger)";
        }
    } else {
        if (messageInput) {
            messageInput.disabled = false;
            messageInput.placeholder = "Type a message or use @ to tag...";
        }
        if (attachBtn) attachBtn.disabled = false;
        if (micBtn) micBtn.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        if (adminLockBanner) adminLockBanner.style.display = 'none';
        if (chatStatus) {
            chatStatus.innerText = "Online - Realtime Chat";
            chatStatus.style.color = "var(--success)";
        }
    }
}

/**
 * Adjust textarea height based on content
 */
function autoResize(textarea: HTMLTextAreaElement) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

/**
 * Handle 'Enter' key press for sending messages
 */
function handleEnter(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

/**
 * Voice Note Recording Logic
 */
async function toggleRecording() {
    const micBtn = document.getElementById('micBtn');
    
    if (isRecording) {
        mediaRecorder?.stop();
        isRecording = false;
        micBtn?.classList.remove('recording-pulse');
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            isRecording = true;
            micBtn?.classList.add('recording-pulse');

            mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                audioChunks = [];

                selectedFile = new File([audioBlob], "voice_note.webm", { type: 'audio/webm' });
                if (fileNameDisplay) fileNameDisplay.innerText = "🎤 Voice Note Recorded";
                if (filePreviewBar) filePreviewBar.style.display = 'flex';
            };
        } catch (err) {
            alert("Microphone access denied. Please allow permissions.");
        }
    }
}

/**
 * Handle file attachment selection
 */
function handleFileSelection(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { 
        alert("File is too large! Please select a file under 5MB."); 
        target.value = ''; 
        return; 
    }

    selectedFile = file;
    if (fileNameDisplay) fileNameDisplay.innerText = file.name;
    if (filePreviewBar) filePreviewBar.style.display = 'flex';
}

/**
 * Clear the current file selection
 */
function cancelFile() {
    selectedFile = null;
    if (fileUpload) fileUpload.value = '';
    if (filePreviewBar) filePreviewBar.style.display = 'none';
}

/**
 * Send message with optional file attachment
 */
async function sendMessage() {
    if (!messageInput || !db) return;
    
    const text = messageInput.value.trim();
    if (!text && !selectedFile) return; 

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let fileUrl = null;
    let fileName = null;
    let isImage = false;
    let isAudio = false;

    // Optimistic UI: Render user's message immediately
    if (selectedFile) {
        isImage = selectedFile.type.startsWith('image/');
        isAudio = selectedFile.type.startsWith('audio/');
        fileName = selectedFile.name;

        const localUrl = URL.createObjectURL(selectedFile);
        renderMessage(chatDisplayName!, text, timeString, 'mine', { 
            url: localUrl, 
            name: fileName, 
            isImage, 
            isAudio 
        });

        // Clear input early for better UX
        const fileToUpload = selectedFile;
        messageInput.value = ''; 
        messageInput.style.height = 'auto'; 
        cancelFile();

        // Perform background upload
        const fileExt = fileName.split('.').pop();
        const safeName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `uploads/${safeName}`;

        const { data: uploadData, error: uploadError } = await db.storage.from('chat-media').upload(filePath, fileToUpload);
        
        if (!uploadError) {
            const { data: publicData } = db.storage.from('chat-media').getPublicUrl(filePath);
            fileUrl = publicData.publicUrl;
        } else {
            console.error("Upload error:", uploadError);
        }
    } else {
        renderMessage(chatDisplayName!, text, timeString, 'mine', null);
        messageInput.value = ''; 
        messageInput.style.height = 'auto';
    }

    // Persist to database
    await db.from('messages').insert([
        { 
            author: chatDisplayName, 
            text: text, 
            file_url: fileUrl, 
            file_name: fileName, 
            is_image: isImage,
            is_audio: isAudio,
            is_system: false
        }
    ]);
}

/**
 * Format message text (mentions, etc.)
 */
function formatText(rawText: string): string {
    if (!rawText) return '';
    return rawText.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
}

/**
 * Render a message bubble in the UI
 */
function renderMessage(author: string, text: string, time: string, type: 'mine' | 'theirs', fileData: any = null) {
    if (!chatBox) return;

    const initials = author.substring(0, 2).toUpperCase();
    const colors = ['#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const avatarStyle = type === 'mine' ? '' : `background: ${randomColor};`;

    const formattedText = formatText(text);

    let fileHtml = '';
    if (fileData && fileData.url) {
        if (fileData.isImage) {
            fileHtml = `<img src="${fileData.url}" alt="Shared Image" class="chat-img">`;
        } else if (fileData.isAudio) {
            fileHtml = `<audio controls class="chat-audio"><source src="${fileData.url}" type="audio/webm">Your browser does not support audio.</audio>`;
        } else {
            fileHtml = `<a href="${fileData.url}" target="_blank" class="chat-file-box"><i class="fa-solid fa-file-arrow-down"></i><span>${fileData.name}</span></a>`;
        }
    }

    const textHtml = formattedText ? `<p style="margin-top: ${fileData ? '8px' : '0'};">${formattedText}</p>` : '';

    const html = `
        <div class="message ${type}">
            <div class="msg-avatar" style="${avatarStyle}">${initials}</div>
            <div class="msg-content">
                <div class="msg-header">
                    <span class="msg-author">${type === 'mine' ? 'You' : author}</span>
                    <span class="msg-time">${time}</span>
                </div>
                <div class="msg-bubble">
                    ${fileHtml}
                    ${textHtml}
                </div>
            </div>
        </div>
    `;
    
    chatBox.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
}

/**
 * Add a system notification message
 */
function addSystemMessage(text: string) {
    if (!chatBox) return;
    chatBox.insertAdjacentHTML('beforeend', `<div class="system-msg">${text}</div>`);
    scrollToBottom();
}

/**
 * Scroll chat to the latest message
 */
function scrollToBottom() {
    if (chatBox) {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}
