export default async function handler(req, res) {
  const base = process.env.MONERO_DAEMON_URL || 'http://node.monerodevs.org:18081';
  const incoming = req.url || '';
  const marker = '/api/daemon';
  const suffix = incoming.includes(marker) ? incoming.slice(incoming.indexOf(marker) + marker.length).split('?')[0] : '/';
  const target = `${base.replace(/\/$/, '')}${suffix || '/'}`;
  const headers = { 'content-type': req.headers['content-type'] || 'application/json' };
  try {
    const response = await fetch(target, { method: req.method, headers, body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body || {}) });
    const text = await response.text();
    res.status(response.status).setHeader('content-type', response.headers.get('content-type') || 'application/json').send(text);
  } catch (error) {
    res.status(502).json({ error: 'Monero daemon unavailable', detail: error.message });
  }
}
