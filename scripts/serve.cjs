// Shared loopback-only server for previews, browser tests, and brand exports.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pages = new Set(['index.html', 'privacy.html', 'impressum.html', 'robots.txt', 'sitemap.xml']);
const publicFolders = new Set(['assets', 'src', 'styles']);
const types = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8', '.svg': 'image/svg+xml',
    '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.ico': 'image/x-icon',
    '.avif': 'image/avif', '.woff2': 'font/woff2', '.pdf': 'application/pdf',
};

function isOutsideRoot(file) {
    const relative = path.relative(root, file);
    return relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
}

function createStaticServer() {
    return http.createServer((req, res) => {
        if (!['GET', 'HEAD'].includes(req.method)) {
            res.writeHead(405, { Allow: 'GET, HEAD' }).end();
            return;
        }
        let pathname;
        try {
            pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
            if (/[\\\0]/.test(pathname)) throw new Error('Invalid path');
        } catch {
            res.writeHead(400).end();
            return;
        }
        const segments = pathname.split('/').filter(Boolean);
        if (segments.some(segment => segment.startsWith('.')) ||
            (segments.length && !pages.has(segments.join('/')) && !publicFolders.has(segments[0]))) {
            res.writeHead(404).end();
            return;
        }
        const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
        if (isOutsideRoot(file)) {
            res.writeHead(403).end();
            return;
        }
        fs.realpath(file, (resolveError, resolved) => {
            if (resolveError) { res.writeHead(404).end(); return; }
            if (isOutsideRoot(resolved)) { res.writeHead(403).end(); return; }
            fs.stat(resolved, (statError, stat) => {
                if (statError || !stat.isFile()) { res.writeHead(404).end(); return; }
                res.writeHead(200, {
                    'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
                    'Content-Length': stat.size,
                    'Cache-Control': 'no-store',
                    'X-Content-Type-Options': 'nosniff',
                });
                if (req.method === 'HEAD') { res.end(); return; }
                fs.createReadStream(resolved).on('error', () => res.destroy()).pipe(res);
            });
        });
    });
}

function startPreview() {
    return createStaticServer().listen(4173, '127.0.0.1', () => {
        console.log('Portfolio preview: http://127.0.0.1:4173');
    });
}

module.exports = { createStaticServer, startPreview };
if (require.main === module) startPreview();
