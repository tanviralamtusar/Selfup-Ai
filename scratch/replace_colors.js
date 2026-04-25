const fs = require('fs');
const path = require('path');

const rootDir = 'd:\\Coding\\Selfup Ai\\web\\src';

const replacements = [
  { from: /indigo/gi, to: 'blue' },
  { from: /purple/gi, to: 'blue' },
  { from: /violet/gi, to: 'blue' },
  // Hex codes if found (the common ones)
  { from: /#aea2ff/gi, to: '#90caf9' }, // xp-purple
  { from: /#a88cfb/gi, to: '#82b1ff' }, // secondary
];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const rep of replacements) {
        if (rep.from.test(content)) {
          content = content.replace(rep.from, rep.to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

walk(rootDir);
