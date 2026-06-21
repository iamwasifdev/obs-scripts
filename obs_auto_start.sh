#!/bin/bash

# 1. Set the OBS WebSocket URL with correct password
export OBS_WEBSOCKET_URL="obsws://localhost:4455/b36IvaV1pBHX5eaP"

# 2. Launch OBS only if not already running
if ! pgrep -x obs > /dev/null; then
  obs &
  sleep 5
fi

# 3. Define your default title here!
DEFAULT_TITLE="Coding and Fun"

# 4. Set the YouTube stream title
bash /home/superman/bashScripts/obs_set_text.sh "$DEFAULT_TITLE"

# 5. Switch to your Main scene
obs-cmd scene switch "Main"

# 6. Stop any existing stream first, then start fresh
obs-cmd streaming stop 2>/dev/null
sleep 1
obs-cmd streaming start
notify-send "🔴 OBS Control" "Stream has Started!"
