#!/bin/bash
TEXT="$1"
NAME="${2:-StreamTitle}"

if [ -z "$TEXT" ]; then
  echo "Usage: obs_set_text.sh <text> [source-name]"
  exit 1
fi

echo "$TEXT" > "/tmp/obs_${NAME}.txt"
echo "Written to /tmp/obs_${NAME}.txt: $TEXT"
notify-send "OBS Control" "Stream title set to: $TEXT"
