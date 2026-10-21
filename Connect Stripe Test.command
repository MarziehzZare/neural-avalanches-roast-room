#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
printf '\nNeural Avalanches Roast Room — Stripe test setup\n'
printf 'Paste your sk_test_ secret key below. It will be hidden while you type.\n'
IFS= read -r -s -p 'Stripe test secret key: ' stripe_test_key
printf '\n'
printf '%s' "$stripe_test_key" | node scripts/connect-stripe-test.mjs
unset stripe_test_key
printf '\nSetup finished. Tell Codex that the Stripe test webhook is connected.\n'
read -r -p 'Press Return to close this window.'
