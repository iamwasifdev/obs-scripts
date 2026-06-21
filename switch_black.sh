#!/bin/bash
export OBS_WEBSOCKET_URL="obsws://localhost:4455/b36IvaV1pBHX5eaP"

STATE_FILE="/tmp/obs_brb_active"

if [ -f "$STATE_FILE" ]; then
  rm "$STATE_FILE"
  obs-cmd scene switch "Main"
  obs-cmd audio unmute "Mic/Aux"
  notify-send "📺 OBS Control" "Back to Main - Mic Unmuted"
else
  touch "$STATE_FILE"
  obs-cmd scene switch "Black"
  obs-cmd audio mute "Mic/Aux"
  notify-send "📺 OBS Control" "BRB - Mic Muted"
fi
