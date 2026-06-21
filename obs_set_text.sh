#!/bin/bash
TEXT="$1"

if [ -z "$TEXT" ]; then
  echo "Usage: obs_set_text.sh <text>"
  exit 1
fi

echo "$TEXT" > /tmp/obs_StreamTitle.txt
echo "Title written to /tmp/obs_StreamTitle.txt: $TEXT"
notify-send "OBS Control" "Stream title set to: $TEXT"
