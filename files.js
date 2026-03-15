const fs = require('fs');
const path = require('path');

const ignored = ['index.html', 'files.json', 'files.js', 'README.md', 'new/_template'];

function generateIndex(dir, baseDir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries
    .filter(e => !ignored.includes(e.name) && !e.name.startsWith('.'))
    .map(e => ({
      name: e.name,
      isDir: e.isDirectory(),
      size: e.isFile() ? fs.statSync(path.join(dir, e.name)).size : null,
      mtime: fs.statSync(path.join(dir, e.name)).mtime.toISOString(),
    }));
  fs.writeFileSync(path.join(dir, 'files.json'), JSON.stringify(files, null, 2));
  entries.filter(e => e.isDirectory()).forEach(e => {
    generateIndex(path.join(dir, e.name), baseDir);
  });
}

generateIndex('./', './');
