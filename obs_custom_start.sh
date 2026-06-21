#!/bin/bash

# 1. Set the OBS WebSocket URL with correct password
export OBS_WEBSOCKET_URL="obsws://localhost:4455/b36IvaV1pBHX5eaP"

# 2. Launch OBS only if not already running
if ! pgrep -x obs > /dev/null; then
  obs &
  sleep 5
fi

# 3. Prompt for a title
TITLE=$(zenity --entry --title="Custom OBS Start" --text="Enter Stream Title:")

# If you press Cancel, stop the script
if [ -z "$TITLE" ]; then
    exit 0
fi

# 4. Update the text on your screen to your new title
bash /home/superman/bashScripts/obs_set_text.sh "$TITLE" "StreamTitle"

# 5. Switch to your Main scene
obs-cmd scene switch "Main"

# 6. Stop any existing stream first, then start fresh
obs-cmd streaming stop 2>/dev/null
sleep 1
obs-cmd streaming start
