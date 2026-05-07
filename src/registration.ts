export {};

// ── Types ─────────────────────────────────────────────────────────────────────

interface RegistrationFormData {
  fullname: string;
  email: string;
  password: string;
  phone: string;
  faculty: string;
  dept: string;
}

type ToastType = "ok" | "bad" | "info";

// ── Faculty → Dept map ────────────────────────────────────────────────────────

const FACULTY_DEPTS: Record<string, string[]> = {
  SOC:   ["Computer Science", "Information Technology", "Software Engineering", "Cybersecurity"],
  SLIT:  ["Logistics Technology", "Innovation Management", "Supply Chain Systems"],
  SPS:   ["Physics", "Chemistry", "Mathematics", "Statistics"],
  SESE:  ["Electrical Engineering", "Electronic Engineering", "Computer Engineering", "Mechatronics"],
  SIMME: ["Mechanical Engineering", "Manufacturing Engineering", "Industrial Engineering"],
  SET:   ["Civil Engineering", "Architecture", "Urban Planning", "Environmental Engineering"],
  SAAT:  ["Agricultural Science", "Food Technology", "Agricultural Engineering"],
  SEMS:  ["Geology", "Mining Engineering", "Petroleum Engineering"],
  SLS:   ["Biochemistry", "Biology", "Microbiology"],
  CHS:   ["Medicine", "Pharmacy", "Nursing", "Medical Laboratory Science"],
  GNS:   ["General Studies"],
};

// ── Password Strength ─────────────────────────────────────────────────────────

const STRENGTH_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"];
const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];

function getStrength(pw: string): number {
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

// ── DOM Helpers ───────────────────────────────────────────────────────────────

function qs<T extends HTMLElement>(sel: string): T {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`Element not found: ${sel}`);
  return el;
}

function showErr(el: HTMLElement, msg: string): void {
  el.textContent = msg;
  el.style.display = "block";
}

function hideErr(el: HTMLElement): void {
  el.style.display = "none";
}

// ── Toast ─────────────────────────────────────────────────────────────────────

let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(msg: string, type: ToastType = "info"): void {
  const toast = qs<HTMLDivElement>("#toast");
  toast.textContent = msg;
  toast.className = `show ${type}`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = toast.className.replace("show", "").trim();
  }, 3000);
}

// ── Password visibility toggle ────────────────────────────────────────────────

function initPasswordToggle(): void {
  const togBtn  = qs<HTMLElement>("#togPw");
  const pwInput = qs<HTMLInputElement>("#password");

  togBtn.addEventListener("click", () => {
    const isHidden = pwInput.type === "password";
    pwInput.type = isHidden ? "text" : "password";
    togBtn.classList.toggle("fa-eye",       !isHidden);
    togBtn.classList.toggle("fa-eye-slash",  isHidden);
  });
}

// ── Password strength bar ─────────────────────────────────────────────────────

function initStrengthBar(): void {
  const pwInput = qs<HTMLInputElement>("#password");
  const bars    = [
    qs<HTMLDivElement>("#s1"),
    qs<HTMLDivElement>("#s2"),
    qs<HTMLDivElement>("#s3"),
    qs<HTMLDivElement>("#s4"),
  ];

  pwInput.addEventListener("input", () => {
    const strength = getStrength(pwInput.value);

    bars.forEach((bar, i) => {
      const active = strength >= i + 1;
      bar.style.background    = active ? STRENGTH_COLORS[strength] : "rgba(255,255,255,0.05)";
      bar.style.boxShadow     = active ? `0 0 6px ${STRENGTH_COLORS[strength]}80` : "none";
    });

    // Show/hide strength label (reuse the error slot for UX)
    const errEl = qs<HTMLDivElement>("#e-pw");
    if (pwInput.value && strength > 0) {
      errEl.textContent     = STRENGTH_LABELS[strength];
      errEl.style.color     = STRENGTH_COLORS[strength];
      errEl.style.display   = "block";
    } else {
      errEl.style.display   = "none";
    }
  });
}

// ── Department population ─────────────────────────────────────────────────────

function populateDepts(facultyVal: string): void {
  const deptSelect = qs<HTMLSelectElement>("#dept");
  deptSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value    = "";
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = facultyVal ? "Select department" : "Select faculty first";
  deptSelect.appendChild(placeholder);

  const depts = FACULTY_DEPTS[facultyVal] ?? [];
  depts.forEach((dept) => {
    const opt = document.createElement("option");
    opt.value       = dept;
    opt.textContent = dept;
    deptSelect.appendChild(opt);
  });
}

function initFacultySelect(): void {
  const facultySelect = qs<HTMLSelectElement>("#faculty");
  facultySelect.addEventListener("change", () => {
    populateDepts(facultySelect.value);
    hideErr(qs<HTMLDivElement>("#e-fac"));
    hideErr(qs<HTMLDivElement>("#e-dept"));
  });
}

// ── Step navigation ───────────────────────────────────────────────────────────

let currentStep = 1;

function goToStep(step: 1 | 2): void {
  currentStep = step;

  const track = qs<HTMLDivElement>("#formTrack");
  const dot1  = qs<HTMLDivElement>("#dot1");
  const dot2  = qs<HTMLDivElement>("#dot2");

  track.style.transform = step === 1 ? "translateX(0)" : "translateX(-50%)";

  dot1.classList.toggle("active", step === 1);
  dot2.classList.toggle("active", step === 2);
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateStep1(): boolean {
  const fullname = qs<HTMLInputElement>("#fullname").value.trim();
  const email    = qs<HTMLInputElement>("#email").value.trim();
  const password = qs<HTMLInputElement>("#password").value;
  let valid = true;

  const nameErr  = qs<HTMLDivElement>("#e-name");
  const emailErr = qs<HTMLDivElement>("#e-email");
  const pwErr    = qs<HTMLDivElement>("#e-pw");

  if (!fullname) {
    showErr(nameErr, "Enter your full name");
    valid = false;
  } else {
    hideErr(nameErr);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showErr(emailErr, "Enter a valid email");
    valid = false;
  } else {
    hideErr(emailErr);
  }

  if (password.length < 8) {
    showErr(pwErr, "Minimum 8 characters");
    pwErr.style.color = "#f87171";
    valid = false;
  } else if (valid) {
    hideErr(pwErr);
  }

  return valid;
}

function validateStep2(): boolean {
  const phone   = qs<HTMLInputElement>("#phone").value.replace(/\s/g, "");
  const faculty = qs<HTMLSelectElement>("#faculty").value;
  const dept    = qs<HTMLSelectElement>("#dept").value;
  let valid = true;

  const phoneErr = qs<HTMLDivElement>("#e-phone");
  const facErr   = qs<HTMLDivElement>("#e-fac");
  const deptErr  = qs<HTMLDivElement>("#e-dept");

  if (!/^0\d{10}$/.test(phone)) {
    showErr(phoneErr, "Enter a valid 11-digit number");
    valid = false;
  } else {
    hideErr(phoneErr);
  }

  if (!faculty) {
    showErr(facErr, "Select your faculty");
    valid = false;
  } else {
    hideErr(facErr);
  }

  if (!dept) {
    showErr(deptErr, "Select your department");
    valid = false;
  } else {
    hideErr(deptErr);
  }

  return valid;
}

// ── Form submission ───────────────────────────────────────────────────────────

async function handleSubmit(): Promise<void> {
  if (!validateStep2()) return;

  const subBtn = qs<HTMLButtonElement>("#subBtn");
  const btxt   = subBtn.querySelector<HTMLSpanElement>(".btxt")!;

  subBtn.disabled     = true;
  btxt.innerHTML      = `<i class="fa-solid fa-circle-notch fa-spin"></i> CREATING...`;

  const formData: RegistrationFormData = {
    fullname: qs<HTMLInputElement>("#fullname").value.trim(),
    email:    qs<HTMLInputElement>("#email").value.trim(),
    password: qs<HTMLInputElement>("#password").value,
    phone:    qs<HTMLInputElement>("#phone").value.replace(/\s/g, ""),
    faculty:  qs<HTMLSelectElement>("#faculty").value,
    dept:     qs<HTMLSelectElement>("#dept").value,
  };

  try {
    // TODO: replace with your actual Supabase / API call
    // e.g. const { error } = await supabase.auth.signUp({ email: formData.email, password: formData.password })
    await new Promise<void>((resolve) => setTimeout(resolve, 1800)); // dev stub
    console.log("Registering:", formData);
    showToast("Account created successfully!", "ok");
    setTimeout(() => { window.location.href = "login.html"; }, 1500);
  } catch (err) {
    console.error(err);
    showToast("Registration failed. Try again.", "bad");
    subBtn.disabled = false;
    btxt.innerHTML  = `<i class="fa-solid fa-user-plus"></i> REGISTER`;
  }
}

// ── Custom cursor ─────────────────────────────────────────────────────────────

function initCursor(): void {
  if (window.innerWidth < 1024) return;

  const cur  = qs<HTMLDivElement>("#cur");
  const ring = qs<HTMLDivElement>("#cur-ring");

  document.addEventListener("mousemove", (e: MouseEvent) => {
    cur.style.left  = e.clientX + "px";
    cur.style.top   = e.clientY + "px";
    ring.style.left = e.clientX + "px";
    ring.style.top  = e.clientY + "px";
  });

  document.addEventListener("mousedown", () => {
    cur.style.width  = "6px";
    cur.style.height = "6px";
    ring.style.width  = "28px";
    ring.style.height = "28px";
  });

  document.addEventListener("mouseup", () => {
    cur.style.width  = "10px";
    cur.style.height = "10px";
    ring.style.width  = "40px";
    ring.style.height = "40px";
  });

  // Scale cursor on interactive elements
  document.querySelectorAll<HTMLElement>("a, button, input, select").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      ring.style.width       = "56px";
      ring.style.height      = "56px";
      ring.style.borderColor = "rgba(0,207,255,0.6)";
    });
    el.addEventListener("mouseleave", () => {
      ring.style.width       = "40px";
      ring.style.height      = "40px";
      ring.style.borderColor = "rgba(59,130,246,0.45)";
    });
  });
}

// ── Glare effect ──────────────────────────────────────────────────────────────

function initGlare(): void {
  const card  = qs<HTMLDivElement>("#card");
  const glare = qs<HTMLDivElement>("#glare");

  card.addEventListener("mousemove", (e: MouseEvent) => {
    const rect = card.getBoundingClientRect();
    const x    = ((e.clientX - rect.left) / rect.width)  * 100;
    const y    = ((e.clientY - rect.top)  / rect.height) * 100;
    glare.style.setProperty("--mx", `${x}%`);
    glare.style.setProperty("--my", `${y}%`);
  });
}

// ── Particle canvas ───────────────────────────────────────────────────────────

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number; a: number;
  hue: number;
}

function initCanvas(): void {
  const canvas = document.querySelector<HTMLCanvasElement>("#c");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const resize = (): void => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  const particles: Particle[] = Array.from({ length: 55 }, () => ({
    x:   Math.random() * window.innerWidth,
    y:   Math.random() * window.innerHeight,
    vx:  (Math.random() - 0.5) * 0.35,
    vy:  (Math.random() - 0.5) * 0.35,
    r:   Math.random() * 1.6 + 0.3,
    a:   Math.random() * 0.5 + 0.08,
    hue: Math.random() > 0.6 ? 200 : 340,
  }));

  const draw = (): void => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0)             p.x = canvas.width;
      if (p.x > canvas.width)  p.x = 0;
      if (p.y < 0)             p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${p.a})`;
      ctx.fill();
    });

    // Connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 207, 255, ${(1 - dist / 110) * 0.12})`;
          ctx.lineWidth   = 0.7;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  };

  draw();
}

// ── Real-time inline validation (clear errors on input) ───────────────────────

function initLiveValidation(): void {
  const fields: Array<[string, string]> = [
    ["#fullname", "#e-name"],
    ["#email",    "#e-email"],
    ["#phone",    "#e-phone"],
  ];

  fields.forEach(([inputSel, errSel]) => {
    const input = document.querySelector<HTMLInputElement>(inputSel);
    const err   = document.querySelector<HTMLDivElement>(errSel);
    if (!input || !err) return;
    input.addEventListener("input", () => hideErr(err));
  });

  // Faculty / dept selects
  qs<HTMLSelectElement>("#faculty").addEventListener("change", () =>
    hideErr(qs<HTMLDivElement>("#e-fac"))
  );
  qs<HTMLSelectElement>("#dept").addEventListener("change", () =>
    hideErr(qs<HTMLDivElement>("#e-dept"))
  );
}

// ── Wire up buttons ───────────────────────────────────────────────────────────

function initButtons(): void {
  qs<HTMLButtonElement>("#nextBtn").addEventListener("click", () => {
    if (validateStep1()) goToStep(2);
  });

  qs<HTMLButtonElement>("#backBtn").addEventListener("click", () => goToStep(1));

  qs<HTMLFormElement>("#sf").addEventListener("submit", (e: Event) => {
    e.preventDefault();
    void handleSubmit();
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  initCanvas();
  initCursor();
  initGlare();
  initPasswordToggle();
  initStrengthBar();
  initFacultySelect();
  initButtons();
  initLiveValidation();
  populateDepts(""); // seed empty dept list
});