const fs = require('fs');

const mappings = {
    'ams101.html': 'AMS 101',
    'bio101.html': 'BIO 101',
    'che101.html': 'CHE 101',
    'che103.html': 'CHE 103',
    'csc101.html': 'CSC 101',
    'cve105.html': 'CVE 105',
    'gns103.html': 'GNS 103',
    'gst111.html': 'GST 111',
    'mth101.html': 'MTH 101',
    'phy101.html': 'PHY 101',
    'phy103.html': 'PHY 103',
    'sen101.html': 'SEN 101',
    'sta111.html': 'STA 111'
};

Object.entries(mappings).forEach(([filename, code]) => {
    let html = fs.readFileSync(filename, 'utf8');

    const cleanNav = `
<nav>
    <div class="nav-brand">
        <i class="fa-solid fa-graduation-cap"></i> ${code} Practice Portal
    </div>
    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <button class="btn" style="background:var(--accent); display:none; padding:7px 14px; font-size:0.85rem;" id="resume-btn" onclick="resumeExam()">
            <i class="fa-solid fa-rotate-right"></i> Resume
        </button>
        <button class="btn" style="background:#64748b; padding:7px 14px;" onclick="document.body.classList.toggle('dark-mode')">
            <i class="fa-solid fa-moon"></i>
        </button>
    </div>
</nav>`;

    html = html.replace(/<nav>[\s\S]*?<\/nav>/i, cleanNav);

    fs.writeFileSync(filename, html);
    console.log(`Standardized nav in ${filename}`);
});
