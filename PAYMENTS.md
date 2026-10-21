# Paid review credits (test integration)

The Stripe integration is isolated in `wrangler.test.jsonc`. It sells **10 review credits for US$5** using Stripe-hosted Checkout in **test mode**. One completed FULL or QUICK answer consumes one credit. An AI error restores the credit. No live payment is configured, and the public room continues using its original shared-code flow.

## Owner setup

1. Use Stripe **test mode** and obtain a secret key beginning `sk_test_`. Keep it out of GitHub and chat.
2. Deploy the test Worker with `npm run deploy:test`. Its URL is `https://neural-avalanches-roast-room-test.vieclinic.workers.dev`.
3. Add secrets to that Worker using interactive terminal prompts:

   ```sh
   npx --yes wrangler secret put STRIPE_SECRET_KEY --config wrangler.test.jsonc
   npx --yes wrangler secret put ROOM_ACCESS_CODE --config wrangler.test.jsonc
   npx --yes wrangler secret put OPENAI_API_KEY --config wrangler.test.jsonc
   ```

4. In Stripe test mode, create a webhook endpoint for `https://neural-avalanches-roast-room-test.vieclinic.workers.dev/api/stripe-webhook`. Listen for `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Copy its signing secret beginning `whsec_` into the terminal prompt for `npx --yes wrangler secret put STRIPE_WEBHOOK_SECRET --config wrangler.test.jsonc`.
5. Open the test room, enter the room code, open the wallet, save its recovery code, and buy the test package with a Stripe test card. Confirm that the balance becomes 10 and that one successful review changes it to 9. A failed review must leave it at 10. A live OpenAI answer also requires API credit in the owner's OpenAI account.

The test D1 database is `neural-avalanches-credits-test` and its schema is in `migrations/0001_credits.sql`. Apply future migrations with `npx --yes wrangler d1 migrations apply neural-avalanches-credits-test --remote --config wrangler.test.jsonc`.

## Before accepting real payments

Use a separate live Stripe secret and live webhook, a separate production D1 database, and an explicit live-mode code review. Test refunds, chargebacks, credit recovery, and concurrent requests. Add billing receipts and a support contact. Review tax obligations and Stripe fees. Fund the owner's OpenAI API account and confirm both FULL and QUICK live answers before inviting paying users. Never switch `PAYMENTS_MODE` to live or set a live Stripe key in the test Worker.

Wallets use a secure, HTTP-only browser cookie. The visible recovery code restores credits on another device, so users must keep it private. There is no email login yet. The Stripe customer email is **not** used as proof of wallet ownership. A lost cookie and lost recovery code cannot be recovered through the app.

Stripe confirms payment to the signed webhook; the browser's return page does not grant credits. Each Checkout Session can grant credits once even if Stripe retries the webhook. Stripe payments enter the owner's Stripe account. The owner separately pays OpenAI for model usage; these balances are not linked automatically.
