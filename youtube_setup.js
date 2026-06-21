#!/usr/bin/env node
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CREDENTIALS_PATH = path.join(process.env.HOME || '/home/superman', '.config', 'obs-scripts', 'youtube-auth.json');
const TOKEN_PATH = path.join(process.env.HOME || '/home/superman', '.config', 'obs-scripts', 'youtube-token.json');

const SCOPES = 'https://www.googleapis.com/auth/youtube.force-ssl';

function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

const creds = readJSON(CREDENTIALS_PATH);
if (!creds || !(creds.installed || creds.web)) {
  console.log('=== YouTube API Setup ===');
  console.log('');
  console.log('You need a Google Cloud Project with YouTube Data API v3 enabled.');
  console.log('');
  console.log('Steps:');
  console.log('1. Go to https://console.cloud.google.com/');
  console.log('2. Create a new project or select existing');
  console.log('3. Enable "YouTube Data API v3"');
  console.log('4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs');
  console.log('5. Application type: "Desktop app"');
  console.log('6. Download the JSON file');
  console.log('');
  console.log('Paste the FULL path to the downloaded JSON file:');
  process.stdout.write('> ');
  process.stdin.once('data', (buf) => {
    const p = buf.toString().trim();
    const data = readJSON(p);
    if (!data) {
      console.error('Could not read that file.');
      process.exit(1);
    }
    writeJSON(CREDENTIALS_PATH, data);
    console.log('Saved credentials. Starting auth flow...');
    startAuth(data);
  });
  process.exit(0);
} else {
  startAuth(creds);
}

function startAuth(creds) {
  const clientId = creds.installed?.client_id || creds.web?.client_id;
  const clientSecret = creds.installed?.client_secret || creds.web?.client_secret;
  const redirectUri = creds.installed?.redirect_uris?.[0] || 'http://localhost:8080';

  const state = crypto.randomBytes(16).toString('hex');
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    state: state,
    access_type: 'offline',
    prompt: 'consent',
  });

  // Start local server to receive redirect
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost:8080');
    const code = url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');

    if (!code || returnedState !== state) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h1>Auth failed</h1>');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Authorized! You can close this window.</h1>');

    server.close();

    // Exchange code for tokens
    const params = new URLSearchParams({
      code: code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const req2 = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }, (res2) => {
      let data = '';
      res2.on('data', (c) => data += c);
      res2.on('end', () => {
        const result = JSON.parse(data);
        if (result.error) {
          console.error('Error:', result.error_description || result.error);
          process.exit(1);
        }
        writeJSON(TOKEN_PATH, {
          access_token: result.access_token,
          refresh_token: result.refresh_token,
          expiry_date: Date.now() + (result.expires_in || 3600) * 1000,
        });
        console.log('✓ YouTube API authorized! Token saved.');
        process.exit(0);
      });
    });
    req2.write(params.toString());
    req2.end();
  });

  server.listen(8080, () => {
    console.log('');
    console.log('Open this link in your browser to authorize:');
    console.log(authUrl);
    console.log('');
    console.log('Waiting for authorization...');
  });
}
