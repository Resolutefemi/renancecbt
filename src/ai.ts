
/**
 * ai.ts - Renance AI: FUTA Tutor
 * Handles Claude AI integration, chat UI, and CBT review logic.
 */

import { db } from './ui-core';

// Configuration - Move to environment variables in a real production setup
const PROXY_URL = "https://api.anthropic.com/v1/messages"; // Placeholder or direct URL
const CLAUDE_MODEL = "claude-3-haiku-20240307"; // Updated to a valid model name

// Subject and Mode mapping
const SMAP: Record<string, string> = {
    GENERAL: "All 100-Level Courses",
    COS101: "Introduction to Computer Science (COS 101)",
    GNS103: "Information Literacy (GNS 103)",
    GST111: "Communication in English (GST 111)",
    MTH101: "Elementary Mathematics I (MTH 101)",
    PHY101: "General Physics I (PHY 101)",
    STA111: "Descriptive Statistics (STA 111)",
    BIO101: "General Biology I (BIO 101)",
    CHE101: "General Chemistry I (CHE 101)"
};

const MPROMPTS: Record<string, string> = {
    chat: "Answer helpfully and conversationally for a FUTA 100-level student. Be friendly but academically accurate.",
    quiz: `Generate exactly ONE multiple-choice question on the topic. Use EXACTLY this format:
QUESTION: [question text]
A) [option]
B) [option]
C) [option]
D) [option]
ANSWER: [single letter A/B/C/D only]
EXPLANATION: [one clear sentence explaining why]`,
    explain: "Give a structured academic explanation: 1) Simple definition 2) Key concepts with examples 3) Real-world application 4) Common student mistakes. Use **bold** for key terms.",
    formula: "List all key formulas for this topic. Format each as: Formula → Variable definitions → Units → One worked example.",
    solve: "Solve this problem step-by-step. Number every step clearly. State the method/theorem used. Show all working. Write the final answer in **bold**.",
    cbt: "You are reviewing a FUTA student's CBT exam mistakes. For EACH missed question: (1) Explain clearly why the correct answer is right (2) Explain why the student's choice was wrong (3) Give a short memory trick or rule. Be detailed and encouraging."
};

let curSub = "GENERAL";
let curMode = "chat";
let history: { role: string, content: string }[] = [];
let isLoading = false;
let msgCount = 0;
let topicsSet = new Set<string>();
let qzC = 0;
let qzT = 0;
let pendingCBT: any = null;

/**
 * Call Claude AI via Proxy or direct API
 */
async function callClaude(userText: string): Promise<string> {
    const systemPrompt =
        `You are Renance AI, a brilliant academic tutor for FUTA (Federal University of Technology, Akure) 100-level students.\n` +
        `Subject focus: ${SMAP[curSub]}\nMode: ${curMode.toUpperCase()}\n` +
        `${MPROMPTS[curMode]}\n\n` +
        `Additional rules: Use **bold** for key terms. Numbered lists for steps. Bullet points for enumerations. \`backticks\` for formulas/code. End every explanation with one follow-up question to deepen understanding.`;

    history.push({ role: "user", content: userText });

    const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": "", // Placeholder - should be handled by a secure proxy
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-calls": "true"
        },
        body: JSON.stringify({
            model: CLAUDE_MODEL,
            max_tokens: 1000,
            system: systemPrompt,
            messages: history.slice(-12)
        })
    });

    if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error?.message || e?.error || `API error ${res.status} — check your Proxy setup.`);
    }
    const data = await res.json();
    const reply = data.content?.map((b: any) => b.text || "").join("") || "No response received.";
    history.push({ role: "assistant", content: reply });
    return reply;
}

/**
 * Format markdown-like text to HTML
 */
function fmt(raw: string): string {
    let t = raw
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, l, c) => `<pre><code>${c.trim()}</code></pre>`)
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/^#{1,3}\s+(.+)$/gm, "<h3>$1</h3>")
        .replace(/^\d+\.\s(.+)$/gm, "<li>$1</li>")
        .replace(/^[-•]\s(.+)$/gm, "<li>$1</li>")
        .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
        .replace(/^---+$/gm, "<hr>")
        .replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");
    return `<p>${t}</p>`;
}

/**
 * Parse AI response for a quiz structure
 */
function tryQuiz(text: string, bub: HTMLElement): boolean {
    const qM = text.match(/QUESTION:\s*(.+)/);
    const opts = ["A", "B", "C", "D"].map(l => {
        const m = text.match(new RegExp(l + "\\)\\s*(.+)"));
        return m ? { l, t: m[1].trim() } : null;
    }).filter(Boolean) as { l: string, t: string }[];

    const aM = text.match(/ANSWER:\s*([A-D])/i);
    const eM = text.match(/EXPLANATION:\s*([\s\S]+)/);

    if (!qM || opts.length < 2 || !aM) return false;

    const correct = aM[1].toUpperCase();
    qzT++;
    let done = false;

    const card = document.createElement("div");
    card.className = "qcard";
    card.innerHTML = `<div class="qcard-q">❓ ${qM[1].trim()}</div><div class="qopts"></div>`;

    const ob = card.querySelector(".qopts") as HTMLElement;
    opts.forEach(o => {
        const b = document.createElement("button");
        b.className = "qopt";
        b.textContent = `${o.l}) ${o.t}`;
        b.onclick = () => {
            if (done) return;
            done = true;
            ob.querySelectorAll(".qopt").forEach(x => {
                (x as HTMLButtonElement).disabled = true;
                if (x.textContent?.startsWith(correct + ")")) x.classList.add("ok");
            });
            if (o.l === correct) {
                b.classList.add("ok");
                qzC++;
                toast("✅ Correct!");
            } else {
                b.classList.add("no");
                toast("❌ Wrong — correct is " + correct);
            }
            if (eM) {
                const ep = document.createElement("div");
                ep.className = "qexp";
                ep.textContent = "💡 " + eM[1].trim();
                card.appendChild(ep);
            }
            updateStats();
        };
        ob.appendChild(b);
    });

    bub.innerHTML = "";
    bub.appendChild(card);
    return true;
}

/**
 * Add message to chat UI
 */
function addMsg(text: string, role: string): HTMLElement {
    const wrap = document.getElementById("chatWrap") as HTMLElement;
    document.getElementById("welcome")?.remove();
    
    const row = document.createElement("div");
    row.className = `msg ${role}`;
    const isAI = role === "bot";
    
    const av = document.createElement("div");
    av.className = `av ${isAI ? "av-ai" : "av-u"}`;
    av.textContent = isAI ? "🧠" : "👤";
    
    const bub = document.createElement("div");
    bub.className = `bub ${isAI ? "bub-ai" : "bub-u"}`;
    
    if (role === "user") {
        row.appendChild(bub);
        row.appendChild(av);
    } else {
        row.appendChild(av);
        row.appendChild(bub);
    }
    
    wrap.appendChild(row);
    
    if (text === "__ld__") {
        bub.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
    } else if (role === "user") {
        bub.innerHTML = fmt(text);
    } else if (!tryQuiz(text, bub)) {
        bub.innerHTML = fmt(text);
    }
    
    wrap.scrollTop = wrap.scrollHeight;
    return bub;
}

/**
 * Main send function
 */
export async function doSend(): Promise<void> {
    const inp = document.getElementById("inp") as HTMLTextAreaElement;
    const t = inp?.value.trim();
    if (!t || isLoading) return;
    inp.value = "";
    inp.style.height = "auto";
    await doSendText(t);
}

async function doSendText(text: string): Promise<void> {
    if (isLoading) return;
    addMsg(text, "user");
    const lb = addMsg("__ld__", "bot");
    
    isLoading = true;
    const sendBtn = document.getElementById("sendBtn") as HTMLButtonElement;
    if (sendBtn) sendBtn.disabled = true;
    
    msgCount++;
    topicsSet.add(text.split(" ").slice(0, 3).join(" "));
    updateStats();
    
    try {
        const reply = await callClaude(text);
        lb.innerHTML = "";
        if (!tryQuiz(reply, lb)) lb.innerHTML = fmt(reply);
    } catch (e: any) {
        lb.innerHTML = `<span style="color:var(--red)">⚠️ ${e.message}</span><br><small style="color:var(--muted);font-size:.75rem">If this keeps happening, check your Proxy setup.</small>`;
        history.pop();
        if (e.message.includes("Proxy URL")) {
            const errBanner = document.getElementById("errBanner");
            if (errBanner) errBanner.style.display = "block";
        }
    }
    
    isLoading = false;
    if (sendBtn) sendBtn.disabled = false;
    const wrap = document.getElementById("chatWrap");
    if (wrap) wrap.scrollTop = 99999;
}

/**
 * Quick Suggestion Click
 */
export function qs(t: string): void {
    const inp = document.getElementById("inp") as HTMLTextAreaElement;
    if (inp) inp.value = t;
    doSend();
}

/**
 * Set Mode and Question
 */
export function setMQ(m: string, t: string): void {
    setModeRaw(m);
    qs(t);
}

/**
 * Change Subject
 */
export function pickSub(el: HTMLElement): void {
    document.querySelectorAll(".spill").forEach(p => p.classList.remove("on"));
    el.classList.add("on");
    curSub = el.dataset.s || "GENERAL";
    toast("📚 " + SMAP[curSub]);
}

/**
 * Change Mode via Sidebar
 */
export function pickMode(el: HTMLElement, m: string): void {
    document.querySelectorAll(".sbm").forEach(b => b.classList.remove("on"));
    el.classList.add("on");
    setModeRaw(m);
}

function setModeRaw(m: string): void {
    curMode = m;
    document.querySelectorAll(".mtag").forEach(t => {
        ["on-chat", "on-quiz", "on-explain", "on-formula", "on-solve", "on-cbt"].forEach(c => t.classList.remove(c));
    });
    document.querySelector(`.mtag[data-m="${m}"]`)?.classList.add(`on-${m}`);
}

/**
 * Change Mode via Input Tags
 */
export function tagM(el: HTMLElement, m: string): void {
    document.querySelectorAll(".mtag").forEach(t => {
        ["on-chat", "on-quiz", "on-explain", "on-formula", "on-solve", "on-cbt"].forEach(c => t.classList.remove(c));
    });
    el.classList.add(`on-${m}`);
    curMode = m;
    document.querySelectorAll(".sbm").forEach(b => {
        b.classList.toggle("on", (b as HTMLElement).dataset.m === m);
    });
}

/**
 * Check for pending CBT review data
 */
function checkCBTStorage(): void {
    const raw = localStorage.getItem("renance_cbt_review");
    if (!raw) return;
    try {
        pendingCBT = JSON.parse(raw);
        const cbtAlert = document.getElementById("cbtAlert");
        const cbtSub = document.getElementById("cbtSub");
        if (cbtAlert) cbtAlert.style.display = "block";
        if (cbtSub) cbtSub.textContent = `${pendingCBT.missed.length} missed in ${pendingCBT.course} — get AI explanations now.`;
    } catch (e) {}
}

/**
 * Start CBT Review with AI
 */
export function reviewCBT(): void {
    if (!pendingCBT) return;
    localStorage.removeItem("renance_cbt_review");
    const cbtAlert = document.getElementById("cbtAlert");
    if (cbtAlert) cbtAlert.style.display = "none";
    
    setModeRaw("cbt");

    const subEl = document.querySelector(`.spill[data-s="${pendingCBT.course}"]`) as HTMLElement;
    if (subEl) pickSub(subEl);

    const lines = pendingCBT.missed.map((q: any, i: number) =>
        `Q${i + 1}: ${q.question}\nStudent answered: ${q.studentAnswer || "Not answered"}\nCorrect answer: ${q.correctAnswer}${q.explanation ? "\nHint available: " + q.explanation : ""}`
    ).join("\n\n");

    doSendText(
        `I just completed a CBT exam on ${pendingCBT.course} — ${SMAP[pendingCBT.course] || pendingCBT.course}.\n` +
        `Final score: ${pendingCBT.correct}/${pendingCBT.total}\n\n` +
        `Please review these ${pendingCBT.missed.length} question(s) I got WRONG and explain each one thoroughly:\n\n${lines}`
    );
}

const SUGG = ["Give me a 4-option quiz on GNS103 time management", "Explain Newton's second law F=ma with a worked example", "All key PHY101 kinematics formulas", "Solve step by step: derivative of 3x³ + 2x² - 5x", "Difference between hearing and listening in GST111", "Binary to decimal conversion in COS101", "Mean, median and mode with examples STA111", "Morphemes and their types GST111", "Quiz on MTH101 quadratic equations", "Signal word functions in GNS103", "Electron configuration and atomic structure CHE101", "Cell organelles and their functions BIO101"];
let si = 0;

export function cycleSugg(): void {
    const inp = document.getElementById("inp") as HTMLTextAreaElement;
    if (inp) {
        inp.value = SUGG[si++ % SUGG.length];
        inp.focus();
    }
}

function updateStats(): void {
    const stQ = document.getElementById("stQ");
    const stT = document.getElementById("stT");
    const stS = document.getElementById("stS");
    const stBar = document.getElementById("stBar");

    if (stQ) stQ.textContent = msgCount.toString();
    if (stT) stT.textContent = topicsSet.size.toString();
    if (stS) stS.textContent = qzT > 0 ? Math.round(qzC / qzT * 100) + "%" : "—";
    if (stBar) stBar.style.width = Math.min(100, msgCount / 20 * 100) + "%";
}

export function newSession(): void {
    history = [];
    msgCount = 0;
    topicsSet.clear();
    qzC = 0;
    qzT = 0;
    updateStats();
    const wrap = document.getElementById("chatWrap");
    if (wrap) {
        wrap.innerHTML = `<div id="welcome" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 20px;animation:fu .5s ease both;"><div class="worb">🧠</div><div class="wtit">Session cleared!</div><div class="wsub" style="color:var(--muted)">Ask anything to start.</div></div>`;
    }
    if (window.innerWidth <= 768) toggleSb(false);
}

export function clearChat(): void {
    if (confirm("Clear this session?")) newSession();
}

export function exportChat(): void {
    let t = "Renance AI Export\n" + new Date().toLocaleString() + "\n\n";
    history.forEach(h => { t += `[${h.role.toUpperCase()}]\n${h.content}\n\n`; });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([t], { type: "text/plain" }));
    a.download = `renance-${Date.now()}.txt`;
    a.click();
    toast("💾 Exported!");
}

function toast(msg: string): void {
    document.querySelector(".toast")?.remove();
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

export function showGuide(): void {
    alert("5-MINUTE SETUP — Claude AI Proxy\n\n1. Go to https://workers.cloudflare.com\n   Sign up FREE (no credit card needed)\n\n2. Click 'Create Application' → 'Create Worker'\n   Delete the example code\n   Paste Proxy code\n   Click 'Deploy'\n\n3. Settings → Variables & Secrets → Add: CLAUDE_API_KEY\n\n4. Copy your Worker URL and paste into ai.ts (PROXY_URL)");
}

export function toggleSb(force?: boolean): void {
    const s = document.getElementById("sidebar");
    const o = document.getElementById("overlay");
    if (!s || !o) return;
    const open = force !== undefined ? force : !s.classList.contains("open");
    s.classList.toggle("open", open);
    o.classList.toggle("show", open);
}

// Initializers
window.addEventListener('DOMContentLoaded', () => {
    checkCBTStorage();
    
    const overlay = document.getElementById("overlay");
    if (overlay) overlay.addEventListener("click", () => toggleSb(false));
    
    const inp = document.getElementById("inp") as HTMLTextAreaElement;
    if (inp) {
        inp.addEventListener("input", () => {
            inp.style.height = "auto";
            inp.style.height = Math.min(inp.scrollHeight, 130) + "px";
        });
        inp.addEventListener("keydown", e => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                doSend();
            }
        });
    }

    // Bind to window for HTML event handlers
    (window as any).pickSub = pickSub;
    (window as any).clearChat = clearChat;
    (window as any).exportChat = exportChat;
    (window as any).toggleSb = toggleSb;
    (window as any).pickMode = pickMode;
    (window as any).newSession = newSession;
    (window as any).reviewCBT = reviewCBT;
    (window as any).qs = qs;
    (window as any).setMQ = setMQ;
    (window as any).tagM = tagM;
    (window as any).cycleSugg = cycleSugg;
    (window as any).doSend = doSend;
    (window as any).showGuide = showGuide;
});
