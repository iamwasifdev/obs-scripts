#!/bin/bash
export OBS_WEBSOCKET_URL="obsws://localhost:4455/b36IvaV1pBHX5eaP"
export TEXT="$1"
export NAME="${2:-StreamTitle}"

if [ -z "$TEXT" ]; then
  echo "Usage: obs_set_text.sh <text> [source-name]"
  exit 1
fi

# Delete existing source (silent if it doesn't exist)
obs-cmd input remove "$NAME" 2>/dev/null

# Create a new text source with the text
obs-cmd input create "$NAME" "text_ft2_source" \
  --settings "$(echo "{\"text\": \"$TEXT\", \"font\": {\"face\": \"Arial\", \"size\": 72, \"flags\": 0}}")" \
  --scene "Main"

notify-send "OBS Control" "Stream title set to: $TEXT"
