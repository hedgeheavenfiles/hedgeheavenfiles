const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ignored = ['index.html', 'files.json', 'files.js', 'README.md', 'new/_template', 'functions'];

function getGitMtime(filePath) {
  try {
    const result = execSync(`git log -1 --format=%cI -- "${filePath}"`, { encoding: 'utf8' }).trim();
    return result || null;
  } catch {
    return null;
  }
}

function generateIndex(dir, baseDir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries
    .filter(e => !ignored.includes(e.name) && !e.name.startsWith('.'))
    .map(e => {
      const fullPath = path.join(dir, e.name);
      const stat = fs.statSync(fullPath);
      return {
        name: e.name,
        isDir: e.isDirectory(),
        size: e.isFile() ? stat.size : null,
        mtime: getGitMtime(fullPath) || stat.mtime.toISOString(),
      };
    });
  fs.writeFileSync(path.join(dir, 'files.json'), JSON.stringify(files, null, 2));
  entries.filter(e => e.isDirectory()).forEach(e => {
    generateIndex(path.join(dir, e.name), baseDir);
  });
}

generateIndex('./', './');