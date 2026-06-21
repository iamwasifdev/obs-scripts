#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.env.HOME || '/home/superman', '.config', 'obs-scripts', 'youtube-auth.json');
const TOKEN_PATH = path.join(process.env.HOME || '/home/superman', '.config', 'obs-scripts', 'youtube-token.json');

const newTitle = process.argv[2];
if (!newTitle) {
  console.error('Usage: node youtube_set_title.js "My Stream Title"');
  process.exit(1);
}

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function writeJSON(file, data) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function fetch(url, options) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: options?.method || 'GET',
      headers: options?.headers || {},
    };
    if (options?.body) opts.headers['Content-Length'] = Buffer.byteLength(options.body);
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (options?.body) req.write(options.body);
    req.end();
  });
}

async function getAccessToken() {
  const token = readJSON(TOKEN_PATH);
  if (!token) throw new Error('No token found. Run youtube_setup.js first.');

  if (Date.now() < token.expiry_date) return token.access_token;

  // Refresh
  const auth = readJSON(CONFIG_PATH);
  if (!auth) throw new Error('No auth config found.');

  const params = new URLSearchParams({
    client_id: auth.installed?.client_id || auth.web?.client_id,
    client_secret: auth.installed?.client_secret || auth.web?.client_secret,
    refresh_token: token.refresh_token,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (res.status !== 200) throw new Error('Token refresh failed: ' + JSON.stringify(res.data));

  token.access_token = res.data.access_token;
  token.expiry_date = Date.now() + (res.data.expires_in || 3600) * 1000;
  if (res.data.refresh_token) token.refresh_token = res.data.refresh_token;
  writeJSON(TOKEN_PATH, token);

  return token.access_token;
}

async function getActiveBroadcast(accessToken) {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status&mine=true&maxResults=50`,
    { headers: { 'Authorization': 'Bearer ' + accessToken } }
  );

  if (res.status !== 200) throw new Error('Failed to get broadcasts: ' + JSON.stringify(res.data));

  const items = res.data.items || [];
  const active = items.find(b => b.status?.lifeCycleStatus === 'live' || b.status?.lifeCycleStatus === 'testing');
  return active || items[0];
}

async function updateTitle(accessToken, broadcastId, title) {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet`,
    {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: broadcastId,
        snippet: { title: title },
      }),
    }
  );

  if (res.status !== 200) throw new Error('Failed to update title: ' + JSON.stringify(res.data));
  return res.data;
}

(async () => {
  try {
    const accessToken = await getAccessToken();
    const broadcast = await getActiveBroadcast(accessToken);
    if (!broadcast) throw new Error('No live broadcasts found.');
    const result = await updateTitle(accessToken, broadcast.id, newTitle);
    console.log('YouTube title updated to: "' + newTitle + '"');
    console.log('Broadcast: ' + (result.snippet?.title || broadcast.id));
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
