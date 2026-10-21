#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
printf '\nNeural Avalanches Roast Room — live OpenAI key\n'
printf 'Paste an active OpenAI API key below. It will be hidden while you type.\n'
IFS= read -r -s -p 'OpenAI API key: ' openai_live_key
printf '\n'
printf '%s' "$openai_live_key" | node scripts/connect-openai-live.mjs
unset openai_live_key
printf '\nSetup finished. Tell Codex the key was validated and uploaded.\n'
read -r -p 'Press Return to close this window.'
