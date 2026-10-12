/**
 * SERVER.JS - Zero-Dependency Local Game Server & 9Router Proxy
 * 
 * 1. Serves static game files on port 8088 with proper MIME types.
 * 2. Acts as a transparent proxy for 9Router at /proxy/v1/* -> http://127.0.0.1:20128/v1/*
 *    Eliminating browser CORS preflight (OPTIONS) issues and socket aborts!
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8088;
const DEFAULT_ROUTER_TARGET = 'http://127.0.0.1:20128';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // 1. Enable full CORS for all routes (including preflight OPTIONS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 2. Transparent Proxy Route to 9Router: /proxy/v1/*
  if (pathname.startsWith('/proxy/')) {
    const targetPath = pathname.replace(/^\/proxy/, '');
    const routerUrl = url.parse(DEFAULT_ROUTER_TARGET);

    const proxyOptions = {
      hostname: routerUrl.hostname,
      port: routerUrl.port || 20128,
      path: targetPath + (parsedUrl.search || ''),
      method: req.method,
      headers: {
        ...req.headers,
        host: `${routerUrl.hostname}:${routerUrl.port || 20128}`
      }
    };

    // Remove origin to prevent upstream CORS issues
    delete proxyOptions.headers['origin'];
    delete proxyOptions.headers['referer'];

    const proxyReq = http.request(proxyOptions, (proxyRes) => {
      // Forward status and headers
      const resHeaders = { ...proxyRes.headers };
      resHeaders['access-control-allow-origin'] = '*';
      res.writeHead(proxyRes.statusCode, resHeaders);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('[Proxy Error to 9Router]:', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: {
          message: `Không thể kết nối đến 9Router tại ${DEFAULT_ROUTER_TARGET}. Hãy kiểm tra xem 9router đã được bật chưa!`,
          details: err.message
        }
      }));
    });

    req.pipe(proxyReq);
    return;
  }

  // 3. Serve Static Files
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback for directory
      if (stats && stats.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }
    }

    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🐉 CỬU CHÂU PHONG MA LỤC SERVER RUNNING:`);
  console.log(`👉 Web Game URL: http://localhost:${PORT}/`);
  console.log(`👉 9Router Proxy URL: http://localhost:${PORT}/proxy/v1/`);
  console.log(`   (Forwarding to ${DEFAULT_ROUTER_TARGET}/v1/)`);
  console.log(`====================================================`);
});
