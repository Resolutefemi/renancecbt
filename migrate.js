const fs = require('fs');
const path = require('path');

const mappings = {
    'ams101.html': { code: 'AMS 101', json: 'AMS101' },
    'bio101.html': { code: 'BIO 101', json: 'BIO101' },
    'che101.html': { code: 'CHE 101', json: 'CHE101' },
    'che103.html': { code: 'CHE 103', json: 'CHE103' },
    'csc101.html': { code: 'CSC 101', json: 'COS101' },
    'cve105.html': { code: 'CVE 105', json: 'CVE105' },
    'gns103.html': { code: 'GNS 103', json: 'GNS103' },
    'gst111.html': { code: 'GST 111', json: 'GST111' },
    'mth101.html': { code: 'MTH 101', json: 'MTH101' },
    'phy101.html': { code: 'PHY 101', json: 'PHY101' },
    'phy103.html': { code: 'PHY 103', json: 'PHY103' },
    'sen101.html': { code: 'SEN 101', json: 'SEN101' },
    'sta111.html': { code: 'STA 111', json: 'STA111' }
};

const tsTemplate = (code, json) => `import { QuizEngine } from './quizEngine';
import { SUPABASE_CONFIG } from './config';

const engine = new QuizEngine('${code}', SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);

document.addEventListener('DOMContentLoaded', () => {
    engine.init('questions/${json}.json');

    (window as any).startExam = () => engine.startExam();
    (window as any).move = (d: number) => engine.move(d);
    (window as any).showResults = () => engine.showResults();
    (window as any).goHome = () => engine.goHome();
});
`;

Object.entries(mappings).forEach(([filename, data]) => {
    const courseBase = filename.replace('.html', '');
    const tsFilePath = path.join('src', `${courseBase}.ts`);
    const htmlFilePath = filename;

    // 1. Create TS file
    fs.writeFileSync(tsFilePath, tsTemplate(data.code, data.json));
    console.log(`Created ${tsFilePath}`);

    // 2. Update HTML file
    let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

    // Remove old Supabase scripts and other library scripts if they are handled by ui-core or the new engine
    // The prompt says: Replace Supabase initialization and hardcoded keys with the new scripts.
    // And "Remove all inline <script> blocks that contain the quiz logic or MASTER_POOL".

    // First, remove any <script src="..."> tags that we are replacing or that are redundant
    // We are adding:
    // <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    // <script type="module" src="dist/ui-core.js"></script>
    // <script type="module" src="dist/<course>.js"></script>

    // Let's identify the insertion point. Usually in <head> or before </body>.
    // The ams101.html had some scripts in <head> and a big one before </body>.

    // Remove inline scripts
    // This regex matches <script>...</script> blocks. We need to be careful.
    // We only want to remove those that contain quiz logic.
    htmlContent = htmlContent.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (match, content) => {
        if (content.includes('MASTER_POOL') || 
            content.includes('RAW_DATA') || 
            content.includes('SUPABASE_KEY') || 
            content.includes('QuizEngine') ||
            content.includes('startExam') ||
            content.includes('renderQuestion')) {
            return '';
        }
        return match;
    });

    // Remove specific external scripts that are now handled
    htmlContent = htmlContent.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2"><\/script>/gi, '');
    
    // Insert the new scripts in the <head> or at the end of head
    const newScripts = `    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n    <script type="module" src="dist/ui-core.js"></script>\n    <script type="module" src="dist/${courseBase}.js"></script>`;
    
    if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `${newScripts}\n</head>`);
    }

    // Update title
    htmlContent = htmlContent.replace(/<title>([\s\S]*?)<\/title>/gi, `<title>${data.code} CBT Portal</title>`);

    // Update nav-brand / Practice Portal text
    // Looking at ams101.html: <div class="nav-brand"> ... AMS 101 Practice Portal ... </div>
    // Looking at csc101.html: <div id="user-info" ...>COS 101 Practice Portal</div>
    htmlContent = htmlContent.replace(/AMS 101 Practice Portal/g, `${data.code} Practice Portal`);
    htmlContent = htmlContent.replace(/COS 101 Practice Portal/g, `${data.code} Practice Portal`);
    htmlContent = htmlContent.replace(/GNS 103 - Information Literacy Portal/g, `${data.code} Practice Portal`);
    
    // General replacement for any "XXX 123 Practice Portal" or similar if we can find a pattern
    // But the explicit ones above cover the known cases.
    // Let's add a more generic one for the nav-brand area if possible.
    htmlContent = htmlContent.replace(/(<div[^>]*class="nav-brand"[^>]*>[\s\S]*?>)([\s\S]*?)(Practice Portal)/i, `$1${data.code} $3`);
    htmlContent = htmlContent.replace(/(<div[^>]*id="user-info"[^>]*>)([\s\S]*?)(Practice Portal)/i, `$1${data.code} $3`);

    fs.writeFileSync(htmlFilePath, htmlContent);
    console.log(`Updated ${htmlFilePath}`);
});
