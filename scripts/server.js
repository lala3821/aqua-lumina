/**
 * 静的ファイル配信 + お問い合わせ API（FormSubmit へサーバー側転送）
 * file:// で開いた場合でも、npm start 実行中なら送信できます。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const handler = require('serve-handler');

const PORT = Number(process.env.PORT) || 3456;
const ROOT = path.join(__dirname, '..');
const listenAll = process.argv.includes('--listen');

function getBaseUrl(req) {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/$/, '');
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host || `127.0.0.1:${PORT}`;
  const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https');
  return `${proto}://${host}`;
}

function injectOgBaseUrl(html, req) {
  return html.replaceAll('__OG_BASE_URL__', getBaseUrl(req));
}

function serveHtmlWithOg(req, res, filename) {
  const filePath = path.join(ROOT, filename);
  const html = injectOgBaseUrl(fs.readFileSync(filePath, 'utf8'), req);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function readSiteConfig() {
  const src = fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8');
  const emailMatch = src.match(/contactEmail:\s*['"]([^'"]+)['"]/);
  const endpointMatch = src.match(/contactFormEndpoint:\s*['"]([^'"]*)['"]/);
  return {
    contactEmail: emailMatch?.[1]?.trim() || '',
    contactFormEndpoint: endpointMatch?.[1]?.trim() || '',
  };
}

function getFormSubmitUrl(cfg) {
  if (cfg.contactFormEndpoint) {
    const endpoint = cfg.contactFormEndpoint.trim();
    if (endpoint.includes('/ajax/')) return endpoint;
    return endpoint.replace('https://formsubmit.co/', 'https://formsubmit.co/ajax/');
  }
  if (cfg.contactEmail) {
    return `https://formsubmit.co/ajax/${encodeURIComponent(cfg.contactEmail)}`;
  }
  return '';
}

function buildFormSubmitPayload(rawBody) {
  const input = new URLSearchParams(rawBody);

  const name = input.get('name')?.trim() || '';
  const email = input.get('email')?.trim() || '';
  const phone = input.get('phone')?.trim() || '';
  const category = input.get('category')?.trim() || '';
  const message = input.get('message')?.trim() || '';
  const consent = input.get('consent')?.trim() || '';

  const out = new URLSearchParams();
  out.set('お名前', name);
  out.set('メールアドレス', email);
  out.set('email', email);
  if (phone) out.set('電話番号', phone);
  out.set('お問い合わせ種別', category);
  out.set('お問い合わせ内容', message);
  if (consent) out.set('個人情報の同意', consent);

  out.set('_replyto', email);
  out.set('_subject', category
    ? `AQUA LUMINA お問い合わせ（${category}）`
    : 'AQUA LUMINA お問い合わせ');
  out.set('_template', 'table');
  out.set('_captcha', 'false');

  return out.toString();
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handleContact(req, res) {
  setCors(res);

  const cfg = readSiteConfig();
  const target = getFormSubmitUrl(cfg);
  if (!target) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: 'config_missing' }));
    return;
  }

  const body = buildFormSubmitPayload(await readBody(req));
  const origin = `http://127.0.0.1:${PORT}`;

  try {
    const upstream = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Accept: 'application/json',
        Referer: `${origin}/contact.html`,
        Origin: origin,
      },
      body,
    });

    const raw = await upstream.text();
    let data = {};
    try {
      data = JSON.parse(raw);
    } catch {
      data = {};
    }

    const ok = data.success === 'true' || data.success === true;
    res.writeHead(ok ? 200 : 502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      ok,
      message: data.message || (ok ? '' : '送信に失敗しました'),
    }));
  } catch {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: 'upstream_failed' }));
  }
}

const server = http.createServer(async (req, res) => {
  const url = req.url?.split('?')[0];

  if (req.method === 'OPTIONS' && url === '/api/contact') {
    setCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && url === '/api/contact') {
    await handleContact(req, res);
    return;
  }

  if ((req.method === 'GET' || req.method === 'HEAD') && url === '/index.html') {
    if (req.method === 'HEAD') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end();
      return;
    }
    serveHtmlWithOg(req, res, 'index.html');
    return;
  }

  if ((req.method === 'GET' || req.method === 'HEAD') && (url === '/' || url === '')) {
    res.writeHead(302, { Location: '/index.html' });
    res.end();
    return;
  }

  await handler(req, res, {
    public: ROOT,
    cleanUrls: false,
    directoryListing: false,
  });
});

const listenHost = listenAll || process.env.PORT ? '0.0.0.0' : undefined;

server.listen(PORT, listenHost, () => {
  const isProd = Boolean(process.env.PORT);
  const localUrl = isProd
    ? `port ${PORT}（本番）`
    : listenAll
      ? `http://localhost:${PORT}  （LAN: http://<このPCのIP>:${PORT}）`
      : `http://127.0.0.1:${PORT}`;
  console.log('');
  console.log('=== AQUA LUMINA ===');
  console.log('');
  console.log(`  ローカル:  ${localUrl}`);
  if (listenAll) {
    console.log(`  ※ 同じWi-Fiのスマホからもアクセス可能`);
  }
  console.log('');
  console.log('  お問い合わせフォームはこのサーバー起動中に送信できます。');
  console.log('  終了: Ctrl+C');
  console.log('');
});
