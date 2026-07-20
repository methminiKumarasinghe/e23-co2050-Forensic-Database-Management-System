const fs = require('fs');
const file = 'backend/repositories/police.repository.js';
let content = fs.readFileSync(file, 'utf8');

// The file contains literal `\`\` ` and `\$\` 
// because I passed them incorrectly to the file generator earlier.
// Replace `\` followed by `\`` with just `\``
content = content.replace(/\\`/g, '`');

// Replace `\` followed by `$` with just `$`
content = content.replace(/\\\$/g, '$');

fs.writeFileSync(file, content);
console.log('Fixed');
