const fs = require('fs');
const path = require('path');
function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}
walkDir('./app/api/debug', function(filePath) {
  if (filePath.endsWith('route.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('process.env.NODE_ENV === \'production\'')) {
      const g = "  // SECURITY: Disable debug routes in production\n  if (process.env.NODE_ENV === 'production') {\n    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });\n  }\n";
      const res = content.replace(/(export (?:async )?function [A-Z]+\s*\([^)]*\)\s*\{)/g, "$1\n" + g);
      if (res !== content) {
          fs.writeFileSync(filePath, res);
          console.log('Fixed ' + filePath);
      }
    }
  }
});