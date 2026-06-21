#!/usr/bin/env node
const crypto = require('crypto');

const PASSWORD = 'b36IvaV1pBHX5eaP';
const HOST = 'localhost';
const PORT = 4455;

function base64(buf) { return buf.toString('base64'); }
function sha256(data) { return crypto.createHash('sha256').update(data).digest(); }

let reqId = 0;
function request(type, data) {
  return JSON.stringify({
    op: 6,
    d: { requestType: type, requestId: String(++reqId), requestData: data || {} }
  });
}

const mode = process.argv[2];
const sourceName = process.argv[3];
const newText = process.argv[4];
let serverRpcVersion = 1;

if (!mode || (mode !== 'list' && mode !== 'get' && mode !== 'set')) {
  console.error('Usage: obs_diag.js <list|get|set> [sourceName] [text]');
  process.exit(1);
}

let state = 'hello';
const ws = new WebSocket(`ws://${HOST}:${PORT}`);

ws.addEventListener('open', () => {});

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data.toString());
  const d = msg.d;

  if (msg.op === 0) {
    serverRpcVersion = d.rpcVersion || 1;
    if (d.authentication) {
      const { challenge, salt } = d.authentication;
      const secret = base64(sha256(PASSWORD + salt));
      const auth = base64(sha256(secret + challenge));
      ws.send(JSON.stringify({ op: 1, d: { rpcVersion: serverRpcVersion, authentication: auth } }));
    } else {
      ws.send(JSON.stringify({ op: 1, d: { rpcVersion: serverRpcVersion } }));
    }
  } else if (msg.op === 2) {
    if (mode === 'list') {
      ws.send(request('GetInputList'));
    } else if (mode === 'get') {
      if (!sourceName) { console.error('Need source name'); process.exit(1); }
      ws.send(request('GetInputSettings', { inputName: sourceName }));
    } else if (mode === 'set') {
      if (!sourceName || !newText) { console.error('Need source name and text'); process.exit(1); }
      ws.send(request('SetInputSettings', {
        inputName: sourceName,
        inputSettings: { text: newText }
      }));
    }
  } else if (msg.op === 7) {
    console.log(JSON.stringify(d, null, 2));
    ws.close();
    process.exit(d.requestStatus?.result === false ? 1 : 0);
  }
});

ws.addEventListener('error', (err) => {
  console.error('WebSocket error:', err.message || err);
  process.exit(1);
});

ws.addEventListener('close', () => {
  if (reqId === 0) process.exit(1);
});
