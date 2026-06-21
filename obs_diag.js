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

const mode = process.argv[2]; // 'list', 'get', or 'set'
const sourceName = process.argv[3];
const newText = process.argv[4];

const ws = new WebSocket(`ws://${HOST}:${PORT}`);

ws.on('open', () => {});

ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString());
  const op = msg.op;
  const d = msg.d;

  if (op === 0) {
    // Hello
    if (d.authentication) {
      const { challenge, salt } = d.authentication;
      const secret = base64(sha256(PASSWORD + salt));
      const auth = base64(sha256(secret + challenge));
      ws.send(JSON.stringify({ op: 1, d: { rpcVersion: 1, authentication: auth } }));
    } else {
      ws.send(JSON.stringify({ op: 1, d: { rpcVersion: 1 } }));
    }
  } else if (op === 2) {
    // Identified
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
    } else {
      console.error('Usage: obs_diag.js <list|get|set> [sourceName] [text]');
      ws.close();
      process.exit(1);
    }
  } else if (op === 7) {
    // RequestResponse
    console.log(JSON.stringify(d, null, 2));
    ws.close();
    process.exit(d.requestStatus?.result === true ? 0 : 1);
  }
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err.message);
  process.exit(1);
});

ws.on('close', () => {
  if (reqId === 0) process.exit(1);
});
