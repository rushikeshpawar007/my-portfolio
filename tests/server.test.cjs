const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { createStaticServer } = require('../scripts/serve.cjs');

let server;
let port;
before(async () => {
    server = createStaticServer().listen(0, '127.0.0.1');
    await once(server, 'listening');
    port = server.address().port;
});
after(async () => {
    server.close();
    await once(server, 'close');
});

function request(path, method = 'GET') {
    return new Promise((resolve, reject) => {
        http.request({ host: '127.0.0.1', port, path, method }, response => {
            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => resolve({
                status: response.statusCode, headers: response.headers,
                body: Buffer.concat(chunks),
            }));
            response.on('error', reject);
        }).on('error', reject).end();
    });
}

test('serves the portfolio and legal routes as UTF-8 HTML', async () => {
    for (const page of ['/', '/index.html?preview=audit', '/privacy.html', '/impressum.html']) {
        const response = await request(page);
        assert.equal(response.status, 200, page);
        assert.equal(response.headers['content-type'], 'text/html; charset=utf-8');
        assert.match(response.body.toString(), /<!doctype html>/i);
        assert.equal(Number(response.headers['content-length']), response.body.length);
        assert.equal(response.headers['cache-control'], 'no-store');
    }
});

test('serves script, styles, fonts, images, documents and discovery files with correct MIME types', async () => {
    const assets = {
        '/src/main.js': 'text/javascript; charset=utf-8',
        '/styles/site.min.css': 'text/css; charset=utf-8',
        '/assets/fonts/switzer-400.woff2': 'font/woff2',
        '/assets/brand/favicon.svg': 'image/svg+xml',
        '/assets/brand/social-preview.html': 'text/html; charset=utf-8',
        '/assets/documents/Rushikesh_Pawar_CV.pdf': 'application/pdf',
        '/robots.txt': 'text/plain; charset=utf-8',
        '/sitemap.xml': 'application/xml; charset=utf-8',
    };
    for (const [path, type] of Object.entries(assets)) {
        const response = await request(path);
        assert.equal(response.status, 200, path);
        assert.equal(response.headers['content-type'], type);
        assert.equal(response.headers['x-content-type-options'], 'nosniff');
        assert.ok(response.body.length > 0);
    }
});

test('HEAD returns the GET metadata without a body', async () => {
    const get = await request('/assets/documents/Rushikesh_Pawar_CV.pdf');
    const head = await request('/assets/documents/Rushikesh_Pawar_CV.pdf', 'HEAD');
    assert.equal(head.status, 200);
    assert.equal(head.headers['content-length'], get.headers['content-length']);
    assert.equal(head.headers['content-type'], get.headers['content-type']);
    assert.equal(head.body.length, 0);
});

test('missing files and development-only folders are not served', async () => {
    for (const path of ['/missing.html', '/assets', '/package.json', '/.git/config',
        '/.claude/settings.local.json', '/node_modules/playwright/package.json',
        '/scripts/serve.cjs', '/tests/server.js', '/assets/../package.json']) {
        assert.equal((await request(path)).status, 404, path);
    }
});

test('malformed and escaped paths cannot crash the server or escape the public files', async () => {
    for (const path of ['/assets/%ZZ.svg', '/assets/%00.svg', '/assets/..%5c..%5cpackage.json']) {
        assert.equal((await request(path)).status, 400, path);
    }
    assert.equal((await request('/assets/%2e%2e%2fpackage.json')).status, 404);
    assert.equal((await request('/')).status, 200);
});

test('unsupported methods return an explicit method response', async () => {
    const response = await request('/', 'POST');
    assert.equal(response.status, 405);
    assert.equal(response.headers.allow, 'GET, HEAD');
    assert.equal(response.body.length, 0);
});
