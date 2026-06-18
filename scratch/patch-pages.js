const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'second_semester');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Clean up typo line "1" and insert cbt-ai-bridge.js if missing
  if (!content.includes('cbt-ai-bridge.js')) {
    console.log(`Patching cbt-ai-bridge.js script in ${file}...`);
    // Find where env-loader.js is loaded
    if (content.includes('env-loader.js')) {
      content = content.replace(
        /<script src="\.\.\/env-loader\.js"><\/script>\s*(?:1\s*)?/g,
        '<script src="../env-loader.js"></script>\n    <script src="../cbt-ai-bridge.js"></script>'
      );
      changed = true;
    }
  } else {
    // If it contains cbt-ai-bridge.js but still has the typo "1" in the header
    if (content.includes('\n    1\n')) {
      console.log(`Cleaning up typo line 1 in ${file}...`);
      content = content.replace(/\n    1\n/g, '\n');
      changed = true;
    }
  }

  // 2. Ensure Explain Missed Questions button is inside .result-actions in the modal
  if (content.includes('class="result-actions"') && !content.includes('askRenanceAI')) {
    console.log(`Injecting explainBtn button in ${file}...`);
    const buttonHtml = `            <button class="btn-action" id="explainBtn" onclick="askRenanceAI()" style="background: linear-gradient(135deg, #4f46e5, #4338ca); color: white; box-shadow: 0 4px 16px rgba(79,70,229,0.3);">
                <i class="fa-solid fa-robot"></i> Explain Missed Questions
            </button>\n`;
    content = content.replace(/(<div class="result-actions">)/g, `$1\n${buttonHtml}`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully patched ${file}`);
  }
});

console.log("All second semester pages have been checked and patched.");
