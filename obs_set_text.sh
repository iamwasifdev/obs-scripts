#!/bin/bash
TEXT="$1"

if [ -z "$TEXT" ]; then
  echo "Usage: obs_set_text.sh <text>"
  exit 1
fi

# Method 1: WebSocket direct (works with OBS 32)
node /home/superman/bashScripts/obs_set_text.js "StreamTitle" "$TEXT"
if [ $? -eq 0 ]; then
  exit 0
fi

# Method 2: File-based fallback (if WebSocket fails)
echo "$TEXT" > /tmp/obs_StreamTitle.txt
echo "Title written to /tmp/obs_StreamTitle.txt: $TEXT"
notify-send "OBS Control" "Stream title set to: $TEXT"
