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

const sourceName = process.argv[2];
const newText = process.argv[3];
if (!sourceName || !newText) {
  console.error('Usage: obs_set_text.js <source_name> <text>');
  process.exit(1);
}

let state = 'hello';
let targetScene = 'Main';

const ws = new WebSocket(`ws://${HOST}:${PORT}`);

ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString());
  const d = msg.d;

  if (msg.op === 0) {
    // Hello
    if (d.authentication) {
      const { challenge, salt } = d.authentication;
      const secret = base64(sha256(PASSWORD + salt));
      const auth = base64(sha256(secret + challenge));
      ws.send(JSON.stringify({ op: 1, d: { rpcVersion: 1, authentication: auth } }));
    } else {
      ws.send(JSON.stringify({ op: 1, d: { rpcVersion: 1 } }));
    }
  } else if (msg.op === 2) {
    // Identified - now get input list
    state = 'listing';
    ws.send(request('GetInputList'));
  } else if (msg.op === 7) {
    if (state === 'listing') {
      const inputs = d.responseData?.inputs || [];
      const exists = inputs.some(i => i.inputName === sourceName);
      if (exists) {
        state = 'setting';
        ws.send(request('SetInputSettings', {
          inputName: sourceName,
          inputSettings: { text: newText }
        }));
      } else {
        state = 'creating';
        ws.send(request('CreateInput', {
          inputName: sourceName,
          inputKind: 'text_ft2_source',
          inputSettings: { text: newText, font: { face: 'Arial', size: 72, flags: 0 } },
          sceneName: targetScene
        }));
      }
    } else if (state === 'creating') {
      if (d.requestStatus?.result === true) {
        console.log(`Created "${sourceName}" with text: ${newText}`);
      } else {
        // maybe scene-specific creation failed, try without scene
        state = 'setting';
        ws.send(request('SetInputSettings', {
          inputName: sourceName,
          inputSettings: { text: newText }
        }));
        return;
      }
      ws.close();
      process.exit(d.requestStatus?.result === true ? 0 : 1);
    } else if (state === 'setting') {
      if (d.requestStatus?.result === true) {
        console.log(`Set "${sourceName}" text to: ${newText}`);
      } else {
        console.error('Failed:', d.requestStatus?.comment || 'unknown error');
      }
      ws.close();
      process.exit(d.requestStatus?.result === true ? 0 : 1);
    }
  }
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err.message);
  process.exit(1);
});

ws.on('close', () => {
  if (reqId === 0) process.exit(1);
});
