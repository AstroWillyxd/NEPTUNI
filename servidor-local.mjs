import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';

// Solo sirve los archivos de dist en este equipo. No publica en Internet.
const root = fileURLToPath(new URL('./dist/', import.meta.url));
const identity = createHash('sha256').update(root).digest('hex').slice(0, 20);
const initialPort = Number(process.env.NEPTUNI_PORT || 8197);
const autoOpen = !process.argv.includes('--no-open');
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4', '.ico': 'image/x-icon',
};

function openChrome(url) {
  const candidates = [
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Google/Chrome/Application/chrome.exe'),
    process.env['ProgramFiles(x86)'] && path.join(process.env['ProgramFiles(x86)'], 'Google/Chrome/Application/chrome.exe'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
  ];
  const chrome = candidates.find(candidate => candidate && existsSync(candidate));
  if (!chrome) {
    console.log('Abre Google Chrome y copia la direccion indicada arriba.');
    return;
  }
  const child = spawn(chrome, ['--new-tab', url], { detached: true, stdio: 'ignore', windowsHide: true });
  child.on('error', () => console.log('Abre Google Chrome y copia la direccion indicada arriba.'));
  child.unref();
}

function alreadyRunning(port) {
  return new Promise(resolve => {
    const request = http.get({ host: '127.0.0.1', port, path: '/__neptuni_local__', timeout: 500 }, response => {
      let text = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { text += chunk; if (text.length > 1024) response.destroy(); });
      response.on('end', () => resolve(text === identity));
      response.on('error', () => resolve(false));
    });
    request.on('timeout', () => { request.destroy(); resolve(false); });
    request.on('error', () => resolve(false));
  });
}

function serve(request, response) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  try {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname === '/__neptuni_local__') {
      response.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
      response.end(request.method === 'HEAD' ? undefined : identity);
      return;
    }
    let name = decodeURIComponent(url.pathname);
    if (name.endsWith('/')) name += 'index.html';
    const file = path.resolve(root, '.' + name);
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const info = statSync(file);
    if (!info.isFile()) throw new Error('Not a file');
    response.writeHead(200, {
      'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': info.size, 'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    if (request.method === 'HEAD') response.end();
    else {
      const stream = createReadStream(file);
      stream.on('error', () => response.destroy());
      response.on('close', () => stream.destroy());
      stream.pipe(response);
    }
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
  }
}

async function start(port) {
  const url = `http://127.0.0.1:${port}/#inicio`;
  if (await alreadyRunning(port)) {
    console.log(`NEPTUNI ya esta abierto en: ${url}`);
    if (autoOpen) openChrome(url);
    return;
  }
  const server = http.createServer(serve);
  server.on('error', error => {
    if (error.code === 'EADDRINUSE' && port < initialPort + 20) start(port + 1);
    else { console.error('No se pudo iniciar NEPTUNI:', error.message); process.exitCode = 1; }
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`NEPTUNI: ${url}`);
    console.log('Deja esta ventana abierta mientras visitas el sitio.');
    console.log('Para detenerlo, cierra esta ventana o pulsa Ctrl+C.');
    console.log('Esta direccion es local: no es una publicacion en Internet.');
    if (autoOpen) openChrome(url);
  });
}

if (!existsSync(path.join(root, 'index.html'))) {
  console.error('Falta dist/index.html. Extrae el ZIP completo antes de abrir NEPTUNI.');
  process.exitCode = 1;
} else if (!Number.isInteger(initialPort) || initialPort < 1024 || initialPort > 65515) {
  console.error('El puerto indicado no es valido.');
  process.exitCode = 1;
} else await start(initialPort);
