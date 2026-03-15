const fs = require('fs');
const path = require('path');

function generateIndex(dir, baseDir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries
    .filter(e => e.name !== 'index.html' && e.name !== 'files.json' && !e.name.startsWith('.'))
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

generateIndex('./files', './files');