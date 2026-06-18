const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'second_semester');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace lines that consist of a single "1" with nothing
  // Specifically targeting headers before <style>
  const beforeStyle = content.split('<style>')[0];
  if (beforeStyle && beforeStyle.match(/^\s*1\s*$/m)) {
    console.log(`Removing header typo '1' in ${file}...`);
    content = content.replace(/^([ \t]*)1([ \t]*\r?\n)/m, '');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully cleaned ${file}`);
  }
});

console.log("Cleanup complete.");
