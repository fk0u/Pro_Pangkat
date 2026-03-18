const fs = require('fs');
const path = require('path');

const rootApiDir = path.join(__dirname, '../app/api');
const brunoDir = path.join(__dirname, '../bruno-collection');

function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.ts') {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const routes = findRouteFiles(rootApiDir);

routes.forEach((routeFile, index) => {
  // e.g. D:\PaidProject\... \app\api\admin\activity-logs\route.ts
  const relativePath = path.relative(rootApiDir, path.dirname(routeFile));
  // e.g. admin\activity-logs
  const parts = relativePath.split(path.sep);
  
  const endPointUrl = `{{baseUrl}}/api/${relativePath.replace(/\\/g, '/')}`;
  
  // Categorize by first folder
  let categoryName = 'General';
  let name = relativePath.replace(/\\/g, ' - ');
  
  if (parts.length > 0 && parts[0] !== '') {
    categoryName = parts[0];
    categoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
    
    // name without first category
    name = parts.slice(1).join(' ').replace(/[[\]]/g, '');
    if (!name) name = 'root';
  } else {
    name = 'root';
  }

  const categoryDir = path.join(brunoDir, categoryName);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }

  // default to GET, we would need to parse AST to find exact methods, 
  // but GET is a good placeholder. User can edit later.
  // Let's do a simple regex to find export async function POST/GET/PUT/DELETE
  const content = fs.readFileSync(routeFile, 'utf-8');
  const methods = [];
  if (/\bexport \s+(async \s+)?function \s+GET\b/.test(content)) methods.push('GET');
  if (/\bexport \s+(async \s+)?function \s+POST\b/.test(content)) methods.push('POST');
  if (/\bexport \s+(async \s+)?function \s+PUT\b/.test(content)) methods.push('PUT');
  if (/\bexport \s+(async \s+)?function \s+PATCH\b/.test(content)) methods.push('PATCH');
  if (/\bexport \s+(async \s+)?function \s+DELETE\b/.test(content)) methods.push('DELETE');
  
  if (methods.length === 0) methods.push('GET'); // fallback

  methods.forEach((method, mIndex) => {
    let cleanName = name.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, ' ').trim();
    if (!cleanName) cleanName = 'Index';
    
    // Title case
    cleanName = cleanName.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    
    const reqName = `${method} ${cleanName}`;
    const bruFileName = `${reqName}.bru`;
    const bruFilePath = path.join(categoryDir, bruFileName);

    let bruContent = `meta {
  name: ${reqName}
  type: http
  seq: ${index + mIndex + 1}
}

${method.toLowerCase()} {
  url: ${endPointUrl}
  body: none
  auth: none
}
`;

    // don't overwrite if it exists and had modifications like body
    if (!fs.existsSync(bruFilePath)) {
      fs.writeFileSync(bruFilePath, bruContent, 'utf-8');
    }
  });

});

console.log('Bruno collections generated successfully!');
