#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
printf '\nNeural Avalanches Roast Room — Stripe live setup\n'
printf 'Paste your sk_live_ secret key below. It will be hidden while you type.\n'
IFS= read -r -s -p 'Stripe live secret key: ' stripe_test_key
printf '\n'
printf '%s' "$stripe_test_key" | node scripts/connect-stripe-live.mjs
unset stripe_test_key
printf '\nSetup finished. Tell Codex that the Stripe live webhook is connected.\n'
read -r -p 'Press Return to close this window.'
