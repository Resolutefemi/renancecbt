const fs = require('fs');
const path = require('path');

const dirs = [
  { path: path.join(process.cwd(), 'first_semester'), relPrefix: '../' },
  { path: path.join(process.cwd(), 'second_semester'), relPrefix: '../' },
  { path: path.join(process.cwd()), relPrefix: '', filesOnly: ['quiz.html'] }
];

dirs.forEach(({ path: dirPath, relPrefix, filesOnly }) => {
  if (!fs.existsSync(dirPath)) return;
  
  let files = fs.readdirSync(dirPath).filter(f => f.endsWith('.html'));
  if (filesOnly) {
    files = files.filter(f => filesOnly.includes(f));
  }

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // 1. Clean up typo line "1" and insert cbt-ai-bridge.js if missing
    const scriptTag = `<script src="${relPrefix}cbt-ai-bridge.js"></script>`;
    if (!content.includes('cbt-ai-bridge.js')) {
      console.log(`Patching cbt-ai-bridge.js script in ${path.basename(dirPath)}/${file}...`);
      if (content.includes('env-loader.js')) {
        content = content.replace(
          new RegExp(`<script src="${relPrefix.replace(/\//g, '\\/')}env-loader\\.js"><\\/script>\\s*(?:1\\s*)?`, 'g'),
          `<script src="${relPrefix}env-loader.js"></script>\n    ${scriptTag}`
        );
        changed = true;
      }
    } else {
      // Clean up typo line 1 if it exists
      if (content.includes('\n    1\n')) {
        console.log(`Cleaning up typo line 1 in ${path.basename(dirPath)}/${file}...`);
        content = content.replace(/\n    1\n/g, '\n');
        changed = true;
      }
    }

    // 2. Ensure Explain Missed Questions button is inside .result-actions in the modal
    if (content.includes('class="result-actions"') && !content.includes('askRenanceAI')) {
      console.log(`Injecting explainBtn button in ${path.basename(dirPath)}/${file}...`);
      const buttonHtml = `            <button class="btn-action" id="explainBtn" onclick="askRenanceAI()" style="background: linear-gradient(135deg, #4f46e5, #4338ca); color: white; box-shadow: 0 4px 16px rgba(79,70,229,0.3);">
                <i class="fa-solid fa-robot"></i> Explain Missed Questions
            </button>\n`;
      content = content.replace(/(<div class="result-actions">)/g, `$1\n${buttonHtml}`);
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully patched ${path.basename(dirPath)}/${file}`);
    }
  });
});

console.log("All CBT pages across the project have been checked and patched.");
