const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

// ─── Icon helpers ───────────────────────────────────────────────────────────
async function iconToBase64Png(IconComponent, color, size = 256) {
  const { createRequire } = require("module");
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// ─── Brand colours ───────────────────────────────────────────────────────────
const RED   = "E63946";
const BLACK = "0A0A0A";
const WHITE = "FFFFFF";
const MUTED = "888888";
const DARK_RED = "B71C2B";

// ─── Transition helper ───────────────────────────────────────────────────────
// PptxGenJS supports slide.transition for morph/fade
function setTransition(slide, type = "fade") {
  slide.transition = { type };
}

// ─── Animation helper: fade-up from bottom (approximated via appear + offset) ─
function fadeUp(delay = 0) {
  return {
    type: "appear",
    animTrig: "onClick",   // "afterPrev" needs explicit timing
    delay: delay * 1000,   // ms
  };
}

// ─── Placeholder box ─────────────────────────────────────────────────────────
function addPlaceholder(slide, label, x, y, w, h) {
  slide.addShape("rect", {
    x, y, w, h,
    fill: { color: "1A1A1A" },
    line: { color: RED, width: 1.5, dashType: "dash" },
  });
  slide.addText(`[ ${label} ]`, {
    x, y, w, h,
    align: "center", valign: "middle",
    color: RED, fontSize: 11, bold: false, italic: true,
  });
}

// ─── Slide footer ─────────────────────────────────────────────────────────────
function addFooter(slide, label = "Renance  ·  Redefining Everything  ·  MTC 6.0 | FUTA 2026") {
  slide.addText(label, {
    x: 0.4, y: 5.35, w: 9.2, h: 0.18,
    color: "444444", fontSize: 8, align: "center",
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
async function buildPresentation() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author  = "Ariyo Oluwafemi Stephen (Resolute Femi)";
  pres.title   = "Renance — More Than Certificate 6.0 | FUTA 2026";

  // Load icon modules
  const fa = require("react-icons/fa");
  const md = require("react-icons/md");
  const hi = require("react-icons/hi");

  const icnTool   = await iconToBase64Png(fa.FaTools,         WHITE);
  const icnJamb   = await iconToBase64Png(fa.FaGraduationCap, WHITE);
  const icnRust   = await iconToBase64Png(fa.FaCode,          WHITE);
  const icnCbt    = await iconToBase64Png(fa.FaUniversity,    WHITE);
  const icnPath   = await iconToBase64Png(fa.FaMapSigns,      WHITE);
  const icnDot    = await iconToBase64Png(fa.FaCircle,        RED);
  const icnArrow  = await iconToBase64Png(fa.FaChevronRight,  WHITE);
  const icnCheck  = await iconToBase64Png(fa.FaCheckCircle,   RED);

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 0 — PRE-LOADER (loading animation slide)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };
    setTransition(s, "fade");

    // Centered loader ring simulation — large R logo fills with red
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: BLACK }, line: { color: BLACK } });

    // Animated "R" mark
    s.addText("R", {
      x: 3.5, y: 1.0, w: 3, h: 2.6,
      fontSize: 200, bold: true, align: "center", valign: "middle",
      color: "1A1A1A", fontFace: "Arial Black",
      animate: { type: "appear" },
    });
    s.addText("R", {
      x: 3.5, y: 1.0, w: 3, h: 2.6,
      fontSize: 200, bold: true, align: "center", valign: "middle",
      color: RED, fontFace: "Arial Black",
      animate: { type: "appear", delay: 400 },
    });

    // Loading bar
    s.addShape("rect", { x: 3.0, y: 4.6, w: 4.0, h: 0.06, fill: { color: "222222" }, line: { color: "222222" } });
    s.addShape("rect", {
      x: 3.0, y: 4.6, w: 0.01, h: 0.06, fill: { color: RED }, line: { color: RED },
      animate: { type: "appear", delay: 200 },
    });
    s.addShape("rect", {
      x: 3.0, y: 4.6, w: 4.0, h: 0.06, fill: { color: RED }, line: { color: RED },
      animate: { type: "appear", delay: 800 },
    });

    s.addText("Loading…", {
      x: 3.0, y: 4.78, w: 4, h: 0.25,
      fontSize: 9, color: MUTED, align: "center",
      animate: { type: "appear", delay: 200 },
    });

    s.addNotes("This is the opening loader slide. It appears for 1–2 seconds before you click to advance. You can set it to auto-advance if using Presenter Mode. Just breathe, let the red R appear, then advance.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 1 — OPENING TITLE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };
    setTransition(s, "fade");

    // Large diagonal red accent — top right
    s.addShape("rect", { x: 6.5, y: 0, w: 3.5, h: 5.625, fill: { color: "0F0F0F" }, line: { color: "0F0F0F" } });

    // Red vertical bar — far right edge
    s.addShape("rect", { x: 9.7, y: 0, w: 0.3, h: 5.625, fill: { color: RED }, line: { color: RED } });

    // Small event badge top-left
    s.addShape("rect", { x: 0.5, y: 0.4, w: 2.6, h: 0.32, fill: { color: RED }, line: { color: RED } });
    s.addText("MORE THAN CERTIFICATE 6.0", {
      x: 0.5, y: 0.4, w: 2.6, h: 0.32,
      fontSize: 7, bold: true, color: WHITE, align: "center", valign: "middle", charSpacing: 1,
    });

    // RENANCE — big, white, letter-spaced
    s.addText("RENANCE", {
      x: 0.5, y: 1.3, w: 7.5, h: 1.5,
      fontSize: 96, bold: true, color: WHITE, fontFace: "Arial Black",
      charSpacing: 8, align: "left",
      animate: { type: "appear" },
    });

    // Red dash separator
    s.addShape("rect", { x: 0.5, y: 3.05, w: 0.9, h: 0.08, fill: { color: RED }, line: { color: RED } });

    // Tagline
    s.addText("Redefining Everything", {
      x: 0.5, y: 3.25, w: 7, h: 0.55,
      fontSize: 24, bold: false, italic: true, color: WHITE, fontFace: "Arial",
      animate: { type: "appear", delay: 400 },
    });

    // Event info bottom-right
    s.addText("More Than Certificate 6.0  ·  FUTA 2026", {
      x: 5.5, y: 5.1, w: 4.1, h: 0.25,
      fontSize: 9, color: MUTED, align: "right",
    });

    s.addNotes("Walk in calmly. Don't rush to the slide. Let people see your name or the event name first. Then advance. The one word that should echo in their heads when RENANCE appears: presence. Pause for 3 full seconds before speaking.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 2 — PRESENTER INTRO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };
    setTransition(s, "fade");

    // Left red panel
    s.addShape("rect", { x: 0, y: 0, w: 4.0, h: 5.625, fill: { color: RED }, line: { color: RED } });

    // Big quote mark on red
    s.addText("\u201C", {
      x: 0.3, y: 0.3, w: 1.0, h: 1.0,
      fontSize: 100, bold: true, color: "C62030", fontFace: "Georgia", align: "left",
    });

    // Name
    s.addText("Ariyo Oluwafemi\nStephen", {
      x: 0.3, y: 1.2, w: 3.4, h: 1.4,
      fontSize: 30, bold: true, color: WHITE, fontFace: "Arial Black", align: "left",
    });
    s.addText("Resolute Femi", {
      x: 0.3, y: 2.7, w: 3.4, h: 0.4,
      fontSize: 16, bold: false, italic: true, color: "FFD0D3", align: "left",
    });
    // Red dash
    s.addShape("rect", { x: 0.3, y: 3.2, w: 0.7, h: 0.07, fill: { color: WHITE }, line: { color: WHITE } });
    s.addText("Founder, Renance Technology", {
      x: 0.3, y: 3.4, w: 3.4, h: 0.3,
      fontSize: 11, color: WHITE, align: "left",
    });
    s.addText("FUTA Student  ·  Software Developer", {
      x: 0.3, y: 3.8, w: 3.4, h: 0.3,
      fontSize: 10, color: "FFD0D3", align: "left",
    });

    // Right side — quote / hook
    s.addText("I didn\u2019t build these because I wanted a startup.", {
      x: 4.4, y: 1.1, w: 5.2, h: 0.8,
      fontSize: 22, bold: true, color: WHITE, fontFace: "Arial Black", align: "left",
    });
    s.addText("I built them because the tools I needed didn\u2019t exist — or weren\u2019t built for people like me.\n\nThis is what came out of that.", {
      x: 4.4, y: 2.1, w: 5.2, h: 1.8,
      fontSize: 14, color: WHITE, align: "left", lineSpacingMultiple: 1.4,
    });

    addFooter(s);
    s.addNotes("Look up from the slide. Speak this honestly. This is your moment to be a person, not a presenter. The goal is connection, not impression.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 3 — WHAT IS RENANCE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    setTransition(s, "fade");

    // Red left strip
    s.addShape("rect", { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: RED }, line: { color: RED } });

    s.addText("What we are building", {
      x: 0.5, y: 0.5, w: 9, h: 0.7,
      fontSize: 38, bold: true, color: BLACK, fontFace: "Arial Black",
      animate: { type: "appear" },
    });

    s.addText("Renance is a software company building a connected ecosystem of tools for students and developers.", {
      x: 0.5, y: 1.5, w: 8.8, h: 0.6,
      fontSize: 17, bold: true, color: BLACK, align: "left",
      animate: { type: "appear", delay: 200 },
    });
    s.addText("We started by solving problems we personally experienced — as developers, as students, and as Nigerians who wanted better tools.", {
      x: 0.5, y: 2.25, w: 8.8, h: 0.6,
      fontSize: 15, color: "333333", align: "left", lineSpacingMultiple: 1.4,
      animate: { type: "appear", delay: 400 },
    });
    s.addText("Each product we build solves one real problem completely.", {
      x: 0.5, y: 3.0, w: 8.8, h: 0.45,
      fontSize: 15, color: "333333", align: "left", lineSpacingMultiple: 1.4,
      animate: { type: "appear", delay: 600 },
    });

    // Red highlight block
    s.addShape("rect", { x: 0.5, y: 3.65, w: 8.8, h: 0.75, fill: { color: RED }, line: { color: RED } });
    s.addText("Not features of one app. Five separate products. Each one built to last.", {
      x: 0.5, y: 3.65, w: 8.8, h: 0.75,
      fontSize: 15, bold: true, color: WHITE, align: "center", valign: "middle",
      animate: { type: "appear", delay: 800 },
    });

    addFooter(s);
    s.addNotes("Keep your voice level here. Don't oversell. Read the paragraph out naturally, almost conversationally. The red box at the bottom is your punchy summary — slight pause before you read it.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 4 — THE ECOSYSTEM (2×2 product grid)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };
    setTransition(s, "morph");

    s.addText("The Renance Ecosystem", {
      x: 0.5, y: 0.3, w: 9, h: 0.6,
      fontSize: 32, bold: true, color: WHITE, fontFace: "Arial Black",
    });
    s.addText("Five products. One connected foundation.", {
      x: 0.5, y: 0.95, w: 9, h: 0.3,
      fontSize: 13, color: MUTED, italic: true,
    });

    const cards = [
      { icon: icnTool,  name: "Renance DevTools",   desc: "CLI tools for everyday\ndeveloper tasks",  x: 0.4,  y: 1.45 },
      { icon: icnJamb,  name: "Renance JAMB CBT",   desc: "Smart exam prep for\nJAMB students",      x: 5.15, y: 1.45 },
      { icon: icnRust,  name: "RustByMastery",       desc: "Interactive platform\nfor learning Rust", x: 0.4,  y: 3.2  },
      { icon: icnCbt,   name: "Renance FUTA CBT",    desc: "Campus exam practice\nfor FUTA students", x: 5.15, y: 3.2  },
    ];

    cards.forEach((c, i) => {
      const delay = i * 200;
      // card bg
      s.addShape("rect", {
        x: c.x, y: c.y, w: 4.35, h: 1.55,
        fill: { color: "141414" }, line: { color: "2A2A2A", width: 1 },
        shadow: { type: "outer", blur: 10, offset: 3, angle: 135, color: "000000", opacity: 0.4 },
        animate: { type: "appear", delay },
      });
      // left red accent bar
      s.addShape("rect", { x: c.x, y: c.y, w: 0.08, h: 1.55, fill: { color: RED }, line: { color: RED } });
      // icon
      s.addImage({ data: c.icon, x: c.x + 0.2, y: c.y + 0.35, w: 0.42, h: 0.42 });
      // name
      s.addText(c.name, {
        x: c.x + 0.72, y: c.y + 0.18, w: 3.5, h: 0.4,
        fontSize: 14, bold: true, color: WHITE, fontFace: "Arial Black",
      });
      // separator
      s.addShape("rect", { x: c.x + 0.72, y: c.y + 0.62, w: 0.5, h: 0.04, fill: { color: RED }, line: { color: RED } });
      // desc
      s.addText(c.desc, {
        x: c.x + 0.72, y: c.y + 0.75, w: 3.5, h: 0.65,
        fontSize: 11, color: MUTED, lineSpacingMultiple: 1.35,
      });
    });

    // 5th product card — DevPath — centered bottom
    s.addShape("rect", {
      x: 2.78, y: 4.85, w: 4.35, h: 0.55,
      fill: { color: RED }, line: { color: RED },
    });
    s.addImage({ data: icnPath, x: 2.98, y: 4.9, w: 0.35, h: 0.35 });
    s.addText("Renance DevPath  —  Career roadmaps for developers", {
      x: 3.38, y: 4.85, w: 3.7, h: 0.55,
      fontSize: 11, bold: true, color: WHITE, valign: "middle",
    });

    addFooter(s);
    s.addNotes("Let each card appear as you say its name. Don't rush through the grid. Give each product one breath of air. Then move on.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 5 — PRODUCT 1: RENANCE DEVTOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    setTransition(s, "fade");

    // Left heavy red column
    s.addShape("rect", { x: 0, y: 0, w: 4.5, h: 5.625, fill: { color: RED }, line: { color: RED } });

    // Product number
    s.addText("01", {
      x: 0.3, y: 0.3, w: 1.5, h: 1.0,
      fontSize: 64, bold: true, color: "C62030", fontFace: "Arial Black",
    });

    s.addImage({ data: icnTool, x: 0.35, y: 1.4, w: 0.55, h: 0.55 });
    s.addText("Renance\nDevTools", {
      x: 0.3, y: 2.05, w: 3.9, h: 1.2,
      fontSize: 34, bold: true, color: WHITE, fontFace: "Arial Black",
    });
    s.addShape("rect", { x: 0.3, y: 3.3, w: 0.7, h: 0.07, fill: { color: WHITE }, line: { color: WHITE } });
    s.addText("A CLI toolkit for everyday developer tasks", {
      x: 0.3, y: 3.5, w: 3.9, h: 0.45,
      fontSize: 12, color: "FFD0D3", italic: true, align: "left",
    });
    s.addText("pip install renance-dt", {
      x: 0.3, y: 4.3, w: 3.7, h: 0.35,
      fontSize: 10, bold: true, color: WHITE, fontFace: "Courier New",
    });

    // Right explanation
    s.addText("Developers spend a lot of time doing repetitive system tasks — moving files, processing media, managing directories.", {
      x: 4.9, y: 0.55, w: 4.7, h: 0.85,
      fontSize: 13, color: "222222", lineSpacingMultiple: 1.4,
      animate: { type: "appear" },
    });
    s.addText("Renance DevTools is a collection of 200+ commands that handle these tasks with a single word.", {
      x: 4.9, y: 1.55, w: 4.7, h: 0.6,
      fontSize: 13, color: "222222", lineSpacingMultiple: 1.4,
      animate: { type: "appear", delay: 200 },
    });
    s.addText("Instead of writing long scripts or remembering complex commands, developers just type:", {
      x: 4.9, y: 2.3, w: 4.7, h: 0.5,
      fontSize: 13, color: "222222", lineSpacingMultiple: 1.4,
      animate: { type: "appear", delay: 400 },
    });

    // Terminal block
    s.addShape("rect", { x: 4.9, y: 2.95, w: 4.7, h: 0.55, fill: { color: BLACK }, line: { color: "333333" } });
    s.addText("> dt compress ./video.mp4", {
      x: 5.0, y: 2.95, w: 4.5, h: 0.55,
      fontSize: 13, color: RED, fontFace: "Courier New", bold: true, valign: "middle",
    });

    s.addText("And it works.", {
      x: 4.9, y: 3.63, w: 4.7, h: 0.35,
      fontSize: 14, bold: true, color: BLACK,
      animate: { type: "appear", delay: 600 },
    });

    addPlaceholder(s, "INSERT DEVTOOLS WEBSITE SCREENSHOT", 4.9, 4.1, 4.7, 1.1);
    addFooter(s);
    s.addNotes("The terminal line is your demo moment. Pause there. Let the simplicity sink in — one command, zero friction. That's the point.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 6 — DEVTOOLS IN ACTION
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };
    setTransition(s, "fade");

    s.addText("See it work", {
      x: 0.5, y: 0.3, w: 9, h: 0.6,
      fontSize: 34, bold: true, color: WHITE, fontFace: "Arial Black",
    });

    addPlaceholder(s, "INSERT CLI SCREEN RECORDING OR SCREENSHOT OF COMMANDS RUNNING", 0.5, 1.1, 9.0, 3.7);

    s.addText("These are real commands solving real developer problems.", {
      x: 0.5, y: 5.0, w: 9, h: 0.3,
      fontSize: 12, color: MUTED, italic: true, align: "center",
    });

    addFooter(s);
    s.addNotes("If you have a screen recording, this is the moment to play it. Otherwise, walk them through the screenshot. Don't explain too much — let the demo speak.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 7 — PRODUCT 2: JAMB CBT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };
    setTransition(s, "fade");

    // Right red panel
    s.addShape("rect", { x: 6.0, y: 0, w: 4.0, h: 5.625, fill: { color: RED }, line: { color: RED } });

    // Product number
    s.addText("02", {
      x: 6.2, y: 0.3, w: 1.5, h: 1.0,
      fontSize: 64, bold: true, color: "C62030", fontFace: "Arial Black",
    });
    s.addImage({ data: icnJamb, x: 6.25, y: 1.4, w: 0.55, h: 0.55 });
    s.addText("Renance\nJAMB CBT", {
      x: 6.2, y: 2.05, w: 3.6, h: 1.2,
      fontSize: 30, bold: true, color: WHITE, fontFace: "Arial Black",
    });
    s.addShape("rect", { x: 6.2, y: 3.3, w: 0.7, h: 0.07, fill: { color: WHITE }, line: { color: WHITE } });
    s.addText("A smarter way to prepare for JAMB", {
      x: 6.2, y: 3.5, w: 3.6, h: 0.45,
      fontSize: 11, color: "FFD0D3", italic: true,
    });

    // Left explanation
    s.addText("Every year, students prepare for JAMB using printed past questions or basic apps that show questions with no feedback.", {
      x: 0.4, y: 0.5, w: 5.3, h: 0.75,
      fontSize: 13, color: WHITE, lineSpacingMultiple: 1.4,
      animate: { type: "appear" },
    });
    s.addText("Renance JAMB CBT goes further. Three modes built around how students actually study:", {
      x: 0.4, y: 1.4, w: 5.3, h: 0.55,
      fontSize: 13, color: WHITE, lineSpacingMultiple: 1.4,
      animate: { type: "appear", delay: 200 },
    });

    const modes = [
      { label: "Practice Mode",        desc: "Instant feedback + AI explanations on every wrong answer" },
      { label: "Full Exam Mode",        desc: "180 questions, 180 minutes, 4 subjects — real JAMB simulation" },
      { label: "Single Subject Mode",   desc: "Set your own question count and timer. Pure focus." },
    ];
    modes.forEach((m, i) => {
      s.addShape("rect", { x: 0.4, y: 2.15 + i * 0.78, w: 5.3, h: 0.65, fill: { color: "141414" }, line: { color: "2A2A2A" } });
      s.addShape("rect", { x: 0.4, y: 2.15 + i * 0.78, w: 0.08, h: 0.65, fill: { color: RED }, line: { color: RED } });
      s.addText(m.label, {
        x: 0.6, y: 2.15 + i * 0.78, w: 5.0, h: 0.28,
        fontSize: 12, bold: true, color: WHITE, valign: "bottom",
        animate: { type: "appear", delay: 400 + i * 150 },
      });
      s.addText(m.desc, {
        x: 0.6, y: 2.43 + i * 0.78, w: 5.0, h: 0.3,
        fontSize: 10, color: MUTED, valign: "top",
      });
    });

    addFooter(s);
    s.addNotes("Pause after 'Renance JAMB CBT goes further.' That sentence needs room. Then walk through the three modes. Mention the AI explanation — that's the differentiator people haven't heard before.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 8 — JAMB CBT SCREENS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: "111111" };
    setTransition(s, "fade");

    s.addText("Inside Renance JAMB CBT", {
      x: 0.5, y: 0.3, w: 9, h: 0.6,
      fontSize: 30, bold: true, color: WHITE, fontFace: "Arial Black",
    });

    const screens = ["Subject Selection Screen", "Quiz / Question Screen", "Results & Review Screen"];
    screens.forEach((label, i) => {
      addPlaceholder(s, `INSERT JAMB CBT: ${label}`, 0.35 + i * 3.15, 1.1, 2.9, 3.8);
    });

    s.addText("Designed for how students actually study.", {
      x: 0.5, y: 5.05, w: 9, h: 0.3,
      fontSize: 12, color: MUTED, italic: true, align: "center",
    });

    addFooter(s);
    s.addNotes("Let the screens speak. You don't need to describe everything you can see. Just say: 'This is what a student sees when they open the app.' Then let them look.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 9 — PRODUCT 3: RUSTBYMASTERY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    setTransition(s, "fade");

    s.addShape("rect", { x: 0, y: 0, w: 4.5, h: 5.625, fill: { color: BLACK }, line: { color: BLACK } });

    s.addText("03", {
      x: 0.3, y: 0.3, w: 1.5, h: 1.0,
      fontSize: 64, bold: true, color: "222222", fontFace: "Arial Black",
    });
    s.addImage({ data: icnRust, x: 0.35, y: 1.4, w: 0.55, h: 0.55 });
    s.addText("Rust\nByMastery", {
      x: 0.3, y: 2.05, w: 3.9, h: 1.2,
      fontSize: 34, bold: true, color: WHITE, fontFace: "Arial Black",
    });
    s.addShape("rect", { x: 0.3, y: 3.3, w: 0.7, h: 0.07, fill: { color: RED }, line: { color: RED } });
    s.addText("Interactive platform for learning Rust", {
      x: 0.3, y: 3.5, w: 3.9, h: 0.45,
      fontSize: 11, color: MUTED, italic: true,
    });

    // Right explanation
    s.addText("Rust is quickly becoming one of the most important programming languages in software development.", {
      x: 4.9, y: 0.55, w: 4.7, h: 0.65,
      fontSize: 13, color: "222222", lineSpacingMultiple: 1.4,
      animate: { type: "appear" },
    });
    s.addText("But learning it is hard. The official documentation is technical and the learning curve is steep.", {
      x: 4.9, y: 1.35, w: 4.7, h: 0.65,
      fontSize: 13, color: "222222", lineSpacingMultiple: 1.4,
      animate: { type: "appear", delay: 200 },
    });
    s.addText("RustByMastery breaks Rust down into structured notes, examples and quizzes that make it approachable for any developer — regardless of experience level.", {
      x: 4.9, y: 2.1, w: 4.7, h: 0.85,
      fontSize: 13, color: "222222", lineSpacingMultiple: 1.4,
      animate: { type: "appear", delay: 400 },
    });

    // Global callout
    s.addShape("rect", { x: 4.9, y: 3.1, w: 4.7, h: 0.6, fill: { color: RED }, line: { color: RED } });
    s.addText("Not just a Nigerian product. Built for developers anywhere who want to learn Rust properly.", {
      x: 4.9, y: 3.1, w: 4.7, h: 0.6,
      fontSize: 11, bold: true, color: WHITE, align: "center", valign: "middle",
      animate: { type: "appear", delay: 600 },
    });

    addPlaceholder(s, "INSERT RUSTBYMASTERY WEBSITE SCREENSHOT", 4.9, 3.85, 4.7, 1.35);

    addFooter(s);
    s.addNotes("Mention that this is a global product, not just local. It matters for credibility and scope. Say it naturally — 'This one isn't just for Nigeria. Anyone learning Rust, anywhere, can use it.'");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 10 — PRODUCT 4: FUTA CBT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };
    setTransition(s, "fade");

    s.addShape("rect", { x: 6.0, y: 0, w: 4.0, h: 5.625, fill: { color: RED }, line: { color: RED } });

    s.addText("04", {
      x: 6.2, y: 0.3, w: 1.5, h: 1.0,
      fontSize: 64, bold: true, color: "C62030", fontFace: "Arial Black",
    });
    s.addImage({ data: icnCbt, x: 6.25, y: 1.4, w: 0.55, h: 0.55 });
    s.addText("Renance\nFUTA CBT", {
      x: 6.2, y: 2.05, w: 3.6, h: 1.2,
      fontSize: 30, bold: true, color: WHITE, fontFace: "Arial Black",
    });
    s.addShape("rect", { x: 6.2, y: 3.3, w: 0.7, h: 0.07, fill: { color: WHITE }, line: { color: WHITE } });
    s.addText("Exam practice built for FUTA students", {
      x: 6.2, y: 3.5, w: 3.6, h: 0.45,
      fontSize: 11, color: "FFD0D3", italic: true,
    });

    s.addText("Renance FUTA CBT is a practice platform specifically for students right here at FUTA.", {
      x: 0.4, y: 0.5, w: 5.3, h: 0.65,
      fontSize: 13, color: WHITE, lineSpacingMultiple: 1.4,
      animate: { type: "appear" },
    });
    s.addText("Students can practice past exam questions by course and department, track their progress over time, and walk into their exams more prepared.", {
      x: 0.4, y: 1.3, w: 5.3, h: 0.85,
      fontSize: 13, color: WHITE, lineSpacingMultiple: 1.4,
      animate: { type: "appear", delay: 200 },
    });

    s.addShape("rect", { x: 0.4, y: 2.35, w: 5.3, h: 0.7, fill: { color: "141414" }, line: { color: "2A2A2A" } });
    s.addShape("rect", { x: 0.4, y: 2.35, w: 0.08, h: 0.7, fill: { color: RED }, line: { color: RED } });
    s.addText("Built by someone who attends FUTA and understands exactly what students here need.", {
      x: 0.6, y: 2.35, w: 5.1, h: 0.7,
      fontSize: 12, bold: true, color: WHITE, valign: "middle",
      animate: { type: "appear", delay: 400 },
    });

    addPlaceholder(s, "INSERT FUTA CBT: Course Selection Screen", 0.4, 3.2, 2.5, 1.8);
    addPlaceholder(s, "INSERT FUTA CBT: Question Screen", 3.0, 3.2, 2.8, 1.8);

    addFooter(s);
    s.addNotes("This is personal. You built this for this room, basically. Own it. Tell them you go here, you felt the same problem, you built the solution. Short and grounded.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 11 — PRODUCT 5: RENANCE DEVPATH
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    setTransition(s, "fade");

    s.addShape("rect", { x: 0, y: 0, w: 4.5, h: 5.625, fill: { color: RED }, line: { color: RED } });

    s.addText("05", {
      x: 0.3, y: 0.3, w: 1.5, h: 1.0,
      fontSize: 64, bold: true, color: "C62030", fontFace: "Arial Black",
    });
    s.addImage({ data: icnPath, x: 0.35, y: 1.4, w: 0.55, h: 0.55 });
    s.addText("Renance\nDevPath", {
      x: 0.3, y: 2.05, w: 3.9, h: 1.2,
      fontSize: 34, bold: true, color: WHITE, fontFace: "Arial Black",
    });
    s.addShape("rect", { x: 0.3, y: 3.3, w: 0.7, h: 0.07, fill: { color: WHITE }, line: { color: WHITE } });
    s.addText("A clear path for every developer who wants to grow", {
      x: 0.3, y: 3.5, w: 3.9, h: 0.55,
      fontSize: 11, color: "FFD0D3", italic: true,
    });

    s.addText("Most developers know they need to improve — but they don\u2019t know where to start or what to learn next.", {
      x: 4.9, y: 0.55, w: 4.7, h: 0.65,
      fontSize: 13, color: "222222", lineSpacingMultiple: 1.4,
      animate: { type: "appear" },
    });
    s.addText("Renance DevPath gives developers a clear, structured roadmap for any tech career path they want to pursue:", {
      x: 4.9, y: 1.35, w: 4.7, h: 0.65,
      fontSize: 13, color: "222222", lineSpacingMultiple: 1.4,
      animate: { type: "appear", delay: 200 },
    });

    const paths = ["Frontend", "Backend", "DevOps", "Mobile", "and more"];
    let px = 4.9;
    paths.forEach((p, i) => {
      const w = i < 4 ? 0.9 : 0.75;
      s.addShape("rect", { x: px, y: 2.15, w: w, h: 0.38, fill: { color: i < 4 ? RED : "222222" }, line: { color: i < 4 ? RED : "555555" } });
      s.addText(p, { x: px, y: 2.15, w, h: 0.38, fontSize: 9.5, bold: true, color: WHITE, align: "center", valign: "middle" });
      px += w + 0.08;
    });

    s.addText("Each roadmap breaks down exactly what to learn, in what order, and where to learn it. Not just a list — a step-by-step guide from where you are to where you want to be.", {
      x: 4.9, y: 2.7, w: 4.7, h: 0.85,
      fontSize: 13, color: "222222", lineSpacingMultiple: 1.4,
      animate: { type: "appear", delay: 400 },
    });

    s.addShape("rect", { x: 4.9, y: 3.7, w: 4.7, h: 0.5, fill: { color: BLACK }, line: { color: BLACK } });
    s.addText("Built for African developers first. Useful for anyone who wants a clear direction.", {
      x: 4.9, y: 3.7, w: 4.7, h: 0.5,
      fontSize: 11, bold: true, color: WHITE, align: "center", valign: "middle",
    });

    addPlaceholder(s, "INSERT DEVPATH SCREENSHOT", 4.9, 4.32, 4.7, 0.9);

    addFooter(s);
    s.addNotes("'Built for African developers first' — own that line. It's the kind of thing an African audience needs to hear from a builder who looks like them. Don't shy away from it.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 12 — HOW THEY CONNECT (ecosystem diagram)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };
    setTransition(s, "morph");

    s.addText("Why we call it an ecosystem", {
      x: 0.5, y: 0.3, w: 9, h: 0.55,
      fontSize: 30, bold: true, color: WHITE, fontFace: "Arial Black",
    });

    // Paragraph
    s.addText("Each Renance product is complete on its own. But they are all built on the same foundation — the same design language, the same values, and the same goal.\n\nA developer who uses Renance DevTools can learn Rust on RustByMastery. A student who practices on JAMB CBT can continue their education journey across the ecosystem.\n\nEvery product we add makes the whole thing more valuable.", {
      x: 0.5, y: 1.0, w: 4.4, h: 3.5,
      fontSize: 12, color: WHITE, lineSpacingMultiple: 1.55, align: "left",
      animate: { type: "appear" },
    });

    // Ecosystem diagram — center node + spokes
    const cx = 7.5, cy = 3.0, r = 1.3;
    // Center
    s.addShape("oval", { x: cx - 0.6, y: cy - 0.35, w: 1.2, h: 0.7, fill: { color: RED }, line: { color: RED } });
    s.addText("RENANCE", { x: cx - 0.6, y: cy - 0.35, w: 1.2, h: 0.7, fontSize: 8, bold: true, color: WHITE, align: "center", valign: "middle" });

    const nodes = [
      { label: "DevTools",    angle: 270 },
      { label: "JAMB CBT",   angle: 330 },
      { label: "RustByMastery", angle: 30 },
      { label: "FUTA CBT",   angle: 90 },
      { label: "DevPath",    angle: 210 },
    ];
    nodes.forEach((n, i) => {
      const rad = (n.angle * Math.PI) / 180;
      const nx = cx + r * Math.cos(rad);
      const ny = cy + r * Math.sin(rad) * 0.8;

      // Line from center to node
      s.addShape("line", {
        x: cx, y: cy, w: nx - cx, h: ny - cy,
        line: { color: RED, width: 1, dashType: "sysDash" },
        animate: { type: "appear", delay: i * 150 },
      });
      // Node dot
      s.addShape("oval", { x: nx - 0.08, y: ny - 0.08, w: 0.16, h: 0.16, fill: { color: RED }, line: { color: RED } });
      // Label
      s.addText(n.label, {
        x: nx - 0.65, y: ny - 0.25, w: 1.3, h: 0.32,
        fontSize: 9, bold: true, color: WHITE, align: "center",
        animate: { type: "appear", delay: i * 150 + 100 },
      });
    });

    addFooter(s);
    s.addNotes("This slide is about vision, not marketing. You're showing interconnection — that these aren't five random apps, they are a family. Walk through the diagram slowly.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 13 — TRACTION / PROOF
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    setTransition(s, "fade");

    s.addShape("rect", { x: 0, y: 0, w: 10, h: 1.1, fill: { color: RED }, line: { color: RED } });
    s.addText("What we have already done", {
      x: 0.5, y: 0, w: 9, h: 1.1,
      fontSize: 30, bold: true, color: WHITE, fontFace: "Arial Black", valign: "middle",
    });

    const stats = [
      { val: "200+",    label: "CLI Commands\nin DevTools",    sub: "Available via pip install today" },
      { val: "3",       label: "Study Modes\nin JAMB CBT",    sub: "With AI-powered explanations" },
      { val: "132+",    label: "Lessons Planned\nRustByMastery", sub: "Across 7 ranks + specialist tracks" },
      { val: "5",       label: "Products\nin the Ecosystem", sub: "Each one complete and standalone" },
    ];

    stats.forEach((st, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const bx = 0.4 + col * 4.9, by = 1.35 + row * 1.85;

      s.addShape("rect", {
        x: bx, y: by, w: 4.6, h: 1.65,
        fill: { color: "F8F8F8" }, line: { color: "EEEEEE" },
        animate: { type: "appear", delay: i * 150 },
      });
      s.addShape("rect", { x: bx, y: by, w: 0.08, h: 1.65, fill: { color: RED }, line: { color: RED } });

      s.addText(st.val, {
        x: bx + 0.25, y: by + 0.15, w: 1.2, h: 0.9,
        fontSize: 52, bold: true, color: RED, fontFace: "Arial Black", valign: "middle",
      });
      s.addText(st.label, {
        x: bx + 1.55, y: by + 0.15, w: 2.9, h: 0.8,
        fontSize: 13, bold: true, color: BLACK, lineSpacingMultiple: 1.3,
      });
      s.addText(st.sub, {
        x: bx + 1.55, y: by + 1.05, w: 2.9, h: 0.45,
        fontSize: 9.5, color: MUTED,
      });
    });

    addFooter(s);
    s.addNotes("Don't just read the numbers — explain one. '200+ commands' means someone doesn't have to Google a bash trick ever again. Ground each stat in what it means for a real person.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 14 — THE AUDIENCE WE SERVE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };
    setTransition(s, "fade");

    s.addText("Who we build for", {
      x: 0.5, y: 0.3, w: 9, h: 0.55,
      fontSize: 30, bold: true, color: WHITE, fontFace: "Arial Black",
    });

    const audiences = [
      { icon: icnCheck, title: "Students preparing for JAMB",           desc: "No premium coaching budget. Just a phone and a will to pass." },
      { icon: icnCheck, title: "FUTA students facing exams",            desc: "Right here in this building. People just like you." },
      { icon: icnCheck, title: "Developers on Android phones",          desc: "Africa's reality: Termux, not MacBooks. We build for that." },
      { icon: icnCheck, title: "Self-taught developers with no roadmap",desc: "Talented, stuck, and unsure what to learn next." },
      { icon: icnCheck, title: "Anyone serious about learning Rust",    desc: "Globally. The language matters. So does the curriculum." },
    ];

    audiences.forEach((a, i) => {
      s.addImage({ data: a.icon, x: 0.4, y: 1.1 + i * 0.82, w: 0.3, h: 0.3 });
      s.addText(a.title, {
        x: 0.85, y: 1.05 + i * 0.82, w: 8.7, h: 0.32,
        fontSize: 14, bold: true, color: WHITE,
        animate: { type: "appear", delay: i * 120 },
      });
      s.addText(a.desc, {
        x: 0.85, y: 1.37 + i * 0.82, w: 8.7, h: 0.3,
        fontSize: 11, color: MUTED,
      });
    });

    addFooter(s);
    s.addNotes("The Android + Termux point will resonate in this room. Say it clearly: we don't assume people have MacBooks. We don't build for Silicon Valley developers. We build for us.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 15 — WHAT MAKES US DIFFERENT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    setTransition(s, "fade");

    s.addShape("rect", { x: 0, y: 0, w: 10, h: 1.1, fill: { color: BLACK }, line: { color: BLACK } });
    s.addText("What makes us different", {
      x: 0.5, y: 0, w: 9, h: 1.1,
      fontSize: 28, bold: true, color: WHITE, fontFace: "Arial Black", valign: "middle",
    });

    const diffs = [
      { num: "01", title: "We use what we build",         body: "Every Renance product was built because we personally felt the problem. No guessing who the user is — we are the user." },
      { num: "02", title: "We don't fake scale",          body: "We build things that work completely before we move to the next. No half-finished products dressed up as MVPs." },
      { num: "03", title: "We build for the real context",body: "Our tools work on low-end devices, slow connections, and Android phones. That's not a compromise — it's a design decision." },
      { num: "04", title: "We are in it long term",       body: "These products will still be here and still improving in 5 years. This is not a competition project. This is a company." },
    ];

    diffs.forEach((d, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const bx = 0.4 + col * 5.0, by = 1.3 + row * 1.85;
      s.addText(d.num, { x: bx, y: by, w: 0.7, h: 0.7, fontSize: 28, bold: true, color: RED, fontFace: "Arial Black" });
      s.addText(d.title, {
        x: bx, y: by + 0.62, w: 4.6, h: 0.45,
        fontSize: 14, bold: true, color: BLACK,
        animate: { type: "appear", delay: i * 150 },
      });
      s.addText(d.body, {
        x: bx, y: by + 1.1, w: 4.6, h: 0.65,
        fontSize: 11, color: "444444", lineSpacingMultiple: 1.35,
      });
    });

    addFooter(s);
    s.addNotes("This is your confidence slide. Say each differentiator cleanly. Don't apologise for any of them. You built something real. You know who it's for. You know why it matters.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 16 — ROADMAP
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };
    setTransition(s, "morph");

    s.addText("What comes next", {
      x: 0.5, y: 0.3, w: 9, h: 0.55,
      fontSize: 30, bold: true, color: WHITE, fontFace: "Arial Black",
    });

    const milestones = [
      { phase: "Now",   title: "Products Live",        items: ["DevTools on PyPI", "JAMB CBT active", "FUTA CBT active", "RustByMastery in development"] },
      { phase: "2026",  title: "Full Product Suite",   items: ["JAMB CBT full launch", "DevPath public beta", "RustByMastery Rank 1 complete"] },
      { phase: "2027",  title: "Mobile & Growth",      items: ["Native mobile apps", "Expand FUTA CBT content", "More universities"] },
      { phase: "2028",  title: "Scale & Impact",       items: ["100k+ active users", "B2B partnerships", "Expanded DevPath tracks"] },
    ];

    // Timeline bar
    s.addShape("rect", { x: 0.4, y: 1.85, w: 9.2, h: 0.05, fill: { color: RED }, line: { color: RED } });

    milestones.forEach((m, i) => {
      const bx = 0.4 + i * 2.35;

      // Phase dot
      s.addShape("oval", {
        x: bx + 0.8, y: 1.68, w: 0.34, h: 0.34,
        fill: { color: i === 0 ? RED : BLACK }, line: { color: RED, width: 2 },
        animate: { type: "appear", delay: i * 200 },
      });

      // Phase label
      s.addText(m.phase, {
        x: bx, y: 1.2, w: 2.1, h: 0.38,
        fontSize: 13, bold: true, color: RED, align: "center", fontFace: "Arial Black",
      });

      // Card
      s.addShape("rect", {
        x: bx, y: 2.15, w: 2.2, h: 3.0,
        fill: { color: "141414" }, line: { color: i === 0 ? RED : "2A2A2A" },
        animate: { type: "appear", delay: i * 200 + 100 },
      });
      s.addText(m.title, {
        x: bx + 0.1, y: 2.25, w: 2.0, h: 0.45,
        fontSize: 12, bold: true, color: WHITE,
      });
      s.addShape("rect", { x: bx + 0.1, y: 2.73, w: 0.5, h: 0.04, fill: { color: RED }, line: { color: RED } });

      m.items.forEach((item, j) => {
        s.addText(`· ${item}`, {
          x: bx + 0.12, y: 2.85 + j * 0.5, w: 2.0, h: 0.42,
          fontSize: 10, color: MUTED, lineSpacingMultiple: 1.3,
        });
      });
    });

    addFooter(s);
    s.addNotes("Keep your voice grounded here. These are honest next steps, not promises. Say: 'This is the plan. Not all of it is certain. But this is the direction we're moving.'");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 17 — THEME TIE-IN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: RED };
    setTransition(s, "fade");

    s.addText("\u201C", {
      x: 0.5, y: 0.2, w: 1.2, h: 1.0,
      fontSize: 100, bold: true, color: "C62030", fontFace: "Georgia",
    });

    s.addText("Empowering the Next Generation:\nTechnology, Creativity and\nEntrepreneurship Beyond Certificate", {
      x: 0.5, y: 1.1, w: 7.0, h: 2.0,
      fontSize: 28, bold: true, color: WHITE, fontFace: "Arial Black", lineSpacingMultiple: 1.3,
      animate: { type: "appear" },
    });

    s.addText("That\u2019s the event theme. That\u2019s also what Renance is.", {
      x: 0.5, y: 3.3, w: 9.0, h: 0.55,
      fontSize: 18, color: WHITE, italic: true,
      animate: { type: "appear", delay: 400 },
    });
    s.addText("Not a proof of concept. Not a school project. A real company, built by someone who had no roadmap and decided to draw one.", {
      x: 0.5, y: 4.0, w: 8.8, h: 0.65,
      fontSize: 14, color: "FFD0D3", lineSpacingMultiple: 1.4,
      animate: { type: "appear", delay: 700 },
    });

    addFooter(s);
    s.addNotes("Slow down here. This is your connection to why you're in the room. Take a breath before this slide. Let it land. The quote at the top is the event theme — show them you heard it and built your response to it.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 18 — THE ASK
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    setTransition(s, "fade");

    s.addShape("rect", { x: 0, y: 0, w: 10, h: 1.1, fill: { color: BLACK }, line: { color: BLACK } });
    s.addText("What we are asking for", {
      x: 0.5, y: 0, w: 9, h: 1.1,
      fontSize: 28, bold: true, color: WHITE, fontFace: "Arial Black", valign: "middle",
    });

    const asks = [
      { num: "01", ask: "Use the products",   body: "Try Renance DevTools. Open JAMB CBT. Use them. Tell us what's broken. That feedback is more valuable than money right now." },
      { num: "02", ask: "Share them",         body: "If someone you know is preparing for JAMB or wants to learn Rust, tell them. Word of mouth is how we grow." },
      { num: "03", ask: "Connect us",         body: "If you know someone — a developer, an investor, a student organization — who should know about Renance, make the introduction." },
      { num: "04", ask: "Build with us",      body: "If you are a developer who wants to work on something real, not just practise projects, reach out. We are always building." },
    ];

    asks.forEach((a, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const bx = 0.4 + col * 5.0, by = 1.35 + row * 1.85;

      s.addText(a.num, { x: bx, y: by, w: 0.6, h: 0.55, fontSize: 24, bold: true, color: RED, fontFace: "Arial Black" });
      s.addText(a.ask, {
        x: bx, y: by + 0.5, w: 4.6, h: 0.4,
        fontSize: 15, bold: true, color: BLACK,
        animate: { type: "appear", delay: i * 150 },
      });
      s.addText(a.body, {
        x: bx, y: by + 0.95, w: 4.6, h: 0.75,
        fontSize: 11, color: "444444", lineSpacingMultiple: 1.35,
      });
    });

    addFooter(s);
    s.addNotes("This is the moment to ask — not demand. Be genuine here. You're not begging, you're inviting. The asks are small. Anyone in the room can do at least one of them.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 19 — CONTACT / QR
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };
    setTransition(s, "fade");

    // Left red block
    s.addShape("rect", { x: 0, y: 0, w: 4.5, h: 5.625, fill: { color: RED }, line: { color: RED } });
    s.addText("Find us.", {
      x: 0.4, y: 1.5, w: 3.8, h: 1.2,
      fontSize: 54, bold: true, color: WHITE, fontFace: "Arial Black",
    });
    s.addShape("rect", { x: 0.4, y: 2.8, w: 0.7, h: 0.07, fill: { color: WHITE }, line: { color: WHITE } });

    const links = [
      "renance.dev",
      "rustbymastery.dev",
      "pip install renance-dt",
    ];
    links.forEach((l, i) => {
      s.addText(l, {
        x: 0.4, y: 3.05 + i * 0.48,  w: 3.8, h: 0.38,
        fontSize: 12, color: WHITE, fontFace: "Courier New",
        animate: { type: "appear", delay: i * 150 },
      });
    });

    // Right side
    s.addText("Ariyo Oluwafemi Stephen", {
      x: 4.9, y: 1.0, w: 4.8, h: 0.55,
      fontSize: 22, bold: true, color: WHITE, fontFace: "Arial Black",
    });
    s.addText("Resolute Femi  ·  Founder, Renance", {
      x: 4.9, y: 1.6, w: 4.8, h: 0.35,
      fontSize: 12, color: MUTED, italic: true,
    });

    addPlaceholder(s, "INSERT QR CODE — links to renance.dev or linktr.ee", 4.9, 2.2, 3.0, 2.8);

    s.addText("Scan or search for Renance", {
      x: 4.9, y: 5.1, w: 4.8, h: 0.25,
      fontSize: 10, color: MUTED, italic: true,
    });

    addFooter(s);
    s.addNotes("Don't rush off stage. Stay here for 10–15 seconds. Let people look at the links. If someone pulls out their phone, that's a win. Invite questions from here.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 20 — CLOSING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };
    setTransition(s, "fade");

    // Subtle red glint
    s.addShape("rect", { x: 9.7, y: 0, w: 0.3, h: 5.625, fill: { color: RED }, line: { color: RED } });

    s.addText("We are still building.", {
      x: 1.0, y: 1.1, w: 8.0, h: 0.8,
      fontSize: 36, bold: true, color: WHITE, fontFace: "Arial Black", align: "center",
      animate: { type: "appear" },
    });
    s.addText("But everything you saw today is already real.", {
      x: 1.0, y: 2.0, w: 8.0, h: 0.65,
      fontSize: 22, color: WHITE, align: "center", italic: true,
      animate: { type: "appear", delay: 500 },
    });

    // Red line separator
    s.addShape("rect", { x: 4.25, y: 2.9, w: 1.5, h: 0.05, fill: { color: RED }, line: { color: RED } });

    s.addText("RENANCE", {
      x: 1.0, y: 3.1, w: 8.0, h: 0.9,
      fontSize: 72, bold: true, color: WHITE, fontFace: "Arial Black", align: "center", charSpacing: 8,
      animate: { type: "appear", delay: 1200 },
    });
    s.addText("Redefining Everything", {
      x: 1.0, y: 4.05, w: 8.0, h: 0.45,
      fontSize: 18, color: RED, italic: true, align: "center",
      animate: { type: "appear", delay: 1500 },
    });

    s.addText("Ariyo Oluwafemi Stephen  ·  Resolute Femi  ·  More Than Certificate 6.0  ·  FUTA 2026", {
      x: 0.5, y: 5.2, w: 9.0, h: 0.22,
      fontSize: 8, color: MUTED, align: "center",
    });

    s.addNotes("Take a breath before this slide. Walk here slowly. Speak the first line, pause. Speak the second, pause longer. Then let RENANCE appear on its own. Don't say anything after that. Just nod. The room closes itself.");
  }

  // ─── Write file ─────────────────────────────────────────────────────────────
  await pres.writeFile({ fileName: "/mnt/user-data/outputs/Renance_MTC6_FUTA2026.pptx" });
  console.log("✅  Done: Renance_MTC6_FUTA2026.pptx");
}

buildPresentation().catch(err => { console.error(err); process.exit(1); });