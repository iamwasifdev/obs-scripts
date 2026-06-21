#!/bin/bash
export OBS_WEBSOCKET_URL="obsws://localhost:4455/b36IvaV1pBHX5eaP"

if [ "$1" = "rearm" ]; then
  obs-cmd input settings "Mic/Aux" --set '{"device_id": "default"}'
  notify-send "🎙️ OBS Control" "Mic Re-armed to Default Device"
else
  obs-cmd audio toggle-mute "Mic/Aux"
  notify-send "🎙️ OBS Control" "Microphone Muted/Unmuted"
fi
