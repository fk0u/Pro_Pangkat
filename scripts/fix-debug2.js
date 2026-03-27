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
    if (content.trim() === '') {
       fs.writeFileSync(filePath, `export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
  }
  return new Response("Debug Route Placeholder", { status: 200 });
}
`);
       console.log('Filled empty file ' + filePath);
       return;
    }
    
    if (!content.includes('NODE_ENV === \'production\'') && !content.includes('NODE_ENV === "production"')) {
      const g = "  // SECURITY: Disable debug routes in production\n  if (process.env.NODE_ENV === 'production') {\n    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });\n  }\n";
      
      // Match export async function GET/POST etc
      const res = content.replace(/(export\s+(?:async\s+)?function\s+(?:GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\)\s*\{)/g, "$1\n" + g);
      if (res !== content) {
          fs.writeFileSync(filePath, res);
          console.log('Fixed ' + filePath);
      } else {
        console.log('Could not match function signature in ' + filePath);
      }
    }
  }
});
