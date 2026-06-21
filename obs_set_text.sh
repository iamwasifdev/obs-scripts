#!/bin/bash
TITLE="$1"

if [ -z "$TITLE" ]; then
  echo "Usage: obs_set_text.sh <stream-title>"
  exit 1
fi

# Try YouTube API to set broadcast title
node /home/superman/bashScripts/youtube_set_title.js "$TITLE"
if [ $? -eq 0 ]; then
  notify-send "YouTube" "Stream title set to: $TITLE"
  exit 0
fi

echo "YouTube API not set up yet. Run: node /home/superman/bashScripts/youtube_setup.js"
exit 1
