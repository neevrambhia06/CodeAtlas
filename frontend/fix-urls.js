const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const API_VAR = "process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'";

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // For 'http://127.0.0.1:8000/...' -> (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/...'
  content = content.replace(/'http:\/\/127\.0\.0\.1:8000([^']*)'/g, "(" + API_VAR + ") + '$1'");
  content = content.replace(/'http:\/\/localhost:8000([^']*)'/g, "(" + API_VAR + ") + '$1'");
  
  // For `http://127.0.0.1:8000/...` -> `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/...`
  // We use a function to safely inject without triggering further replacements
  content = content.replace(/`http:\/\/127\.0\.0\.1:8000([^`]*)`/g, "`\\${" + API_VAR + "}$1`");
  content = content.replace(/`http:\/\/localhost:8000([^`]*)`/g, "`\\${" + API_VAR + "}$1`");
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
});
