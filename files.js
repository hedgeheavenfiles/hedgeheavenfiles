const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ignored = ['index.html', 'files.json', 'files.js', 'README.md', 'functions', '.git'];

function getGitMtime(filePath) {
  try {
    const result = execSync(`git log -1 --format=%cI -- "${filePath}"`, { encoding: 'utf8' }).trim();
    return result || null;
  } catch {
    return null;
  }
}

function generateIndexHTML() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Index of</title>
<style>
  body { font-family: monospace; padding: 20px; }
  h1 { font-size: 1rem; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 2px 16px 2px 0; border-bottom: 1px solid #000; }
  td { padding: 2px 16px 2px 0; }
  a { color: #00e; }
  a:visited { color: #551a8b; }
  .size { text-align: right; }
  hr { margin: 8px 0; }
</style>
</head>
<body>
<h1 id="title">Index of /</h1>
<hr>
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Last Modified</th>
      <th class="size">Size</th>
    </tr>
  </thead>
  <tbody id="listing">
    <tr><td colspan="3">Loading...</td></tr>
  </tbody>
</table>
<hr>
<address id="address">hedgeheavenfiles.pages.dev</address><address>An archive of the HedgeHeaven servers.</adress><adress>Not related to anything else.</adresses></address><address id="footer">&copy; HedgeHeaven 2026</address>
<script>
const title = document.getElementById('title');
const listing = document.getElementById('listing');
const path = window.location.pathname.replace(/\\/$/, '') || '/';
title.textContent = 'Index of ' + path;
document.title = 'Index of ' + path;
function formatSize(bytes) {
  if (bytes === null) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' K';
  return (bytes / 1024 / 1024).toFixed(1) + ' M';
}
function formatDate(iso) {
  const d = new Date(iso);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}
fetch('files.json')
  .then(r => r.json())
  .then(files => {
    files.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    let rows = '<tr><td><a href="../">../</a></td><td>-</td><td class="size">-</td></tr>';
    for (const f of files) {
      const name = f.isDir ? f.name + '/' : f.name;
      rows += \`<tr>
        <td><a href="\${name}">\${name}</a></td>
        <td>\${formatDate(f.mtime)}</td>
        <td class="size">\${formatSize(f.size)}</td>
      </tr>\`;
    }
    listing.innerHTML = rows;
  })
  .catch(() => {
    listing.innerHTML = '<tr><td colspan="3">Could not load directory listing.</td></tr>';
  });
</script>
</body>
</html>`;
}

function generateIndex(dir) {
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
  fs.writeFileSync(path.join(dir, 'index.html'), generateIndexHTML());

  entries.filter(e => e.isDirectory() && !ignored.includes(e.name) && !e.name.startsWith('.')).forEach(e => {
    generateIndex(path.join(dir, e.name));
  });
}

const rootEntries = fs.readdirSync('./', { withFileTypes: true });
const rootFiles = rootEntries
  .filter(e => !ignored.includes(e.name) && !e.name.startsWith('.'))
  .map(e => {
    const fullPath = path.join('./', e.name);
    const stat = fs.statSync(fullPath);
    return {
      name: e.name,
      isDir: e.isDirectory(),
      size: e.isFile() ? stat.size : null,
      mtime: getGitMtime(fullPath) || stat.mtime.toISOString(),
    };
  });

fs.writeFileSync('./files.json', JSON.stringify(rootFiles, null, 2));

rootEntries.filter(e => e.isDirectory() && !ignored.includes(e.name) && !e.name.startsWith('.')).forEach(e => {
  generateIndex(e.name);
});