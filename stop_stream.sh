#!/bin/bash
export OBS_WEBSOCKET_URL="obsws://localhost:4455/b36IvaV1pBHX5eaP"

obs-cmd streaming stop
notify-send "📺 OBS Control" "Stream Stopped"
