#!/bin/bash
export OBS_WEBSOCKET_URL="obsws://localhost:4455/b36IvaV1pBHX5eaP"

CURRENT=$(obs-cmd scene current | tr -d '"')
if [ "$CURRENT" = "Black" ]; then
  obs-cmd scene switch "Main"
  obs-cmd audio unmute "Mic/Aux"
  notify-send "📺 OBS Control" "Back to Main - Mic Unmuted"
else
  obs-cmd scene switch "Black"
  obs-cmd audio mute "Mic/Aux"
  notify-send "📺 OBS Control" "BRB - Mic Muted"
fi
