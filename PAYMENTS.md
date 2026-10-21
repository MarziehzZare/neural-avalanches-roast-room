# Paid review credits

The Stripe integration sells **10 review credits for US$5** using Stripe-hosted Checkout. One completed FULL or QUICK answer consumes one credit. An AI error restores the credit. The tested version uses `wrangler.test.jsonc`; `wrangler.live.jsonc` is a separate live configuration with its own database and Worker. The original public room continues using its shared-code flow.

## Owner setup

1. Use Stripe **test mode** and obtain a secret key beginning `sk_test_`. Keep it out of GitHub and chat.
2. Deploy the test Worker with `npm run deploy:test`. Its URL is `https://neural-avalanches-roast-room-test.vieclinic.workers.dev`.
3. On this Mac, open `Connect Stripe Test.command` and paste the test key at the hidden Terminal prompt. It uploads the key, creates a Stripe test webhook for `checkout.session.completed` and `checkout.session.async_payment_succeeded`, and uploads the webhook signing secret. If setting up elsewhere, do the same steps manually in Stripe test mode.
4. Add the room and OpenAI secrets to the test Worker using interactive terminal prompts:

   ```sh
   npx --yes wrangler secret put ROOM_ACCESS_CODE --config wrangler.test.jsonc
   npx --yes wrangler secret put OPENAI_API_KEY --config wrangler.test.jsonc
   ```

5. Open the test room, enter the room code, open the wallet, save its recovery code, and buy the test package with a [Stripe test card](https://docs.stripe.com/testing). Confirm that the balance becomes 10 and that one successful review changes it to 9. A failed review must leave it at 10. A live OpenAI answer also requires API credit in the owner's OpenAI account.

The test D1 database is `neural-avalanches-credits-test`; the live database is `neural-avalanches-credits-live`. Apply migrations to each database with `npx --yes wrangler d1 migrations apply DATABASE_NAME --remote --config CONFIG_FILE`. Migration `0002_reversals.sql` adds refund and dispute controls.

## Live setup, after owner review

1. Review the US$5 price, Stripe fees, tax treatment, and a support contact for collaborators. This app does not calculate or collect tax or issue its own receipt; configure receipts and any tax collection in Stripe.
2. Apply both migrations to `neural-avalanches-credits-live`, then deploy `npm run deploy:live`. Keep the URL private until it has been checked.
3. In Stripe **live mode**, obtain a secret key beginning `sk_live_`. Run `Connect Stripe Live.command` once on this Mac and paste the key only at its hidden Terminal prompt. This uploads it to the live Worker and creates a live webhook for paid Checkout, refunds, and disputes. The helper never writes the key to a file or GitHub.
4. Upload `ROOM_ACCESS_CODE` and `OPENAI_API_KEY` through separate hidden `wrangler secret put` prompts using `--config wrangler.live.jsonc`. Use a new room code for the paid room. The owner's OpenAI API account must have available credit; Stripe payments do not fund it.
5. Open the live URL, verify the package and recovery instructions, and make one small real purchase yourself. Confirm that Stripe recorded the payment, the wallet gained 10 credits, and one real Quick and one real Full answer each used one credit. Refund the purchase and confirm the wallet locks. Then give collaborators the paid-room link and room code.

Never set a live Stripe key in the test Worker or invite paying users before the live purchase and refund check.

Wallets use a secure, HTTP-only browser cookie. The visible recovery code restores credits on another device, so users must keep it private. There is no email login yet. The Stripe customer email is **not** used as proof of wallet ownership. A lost cookie and lost recovery code cannot be recovered through the app.

Stripe confirms payment to the signed webhook; the browser's return page does not grant credits. Each Checkout Session can grant credits once even if Stripe retries the webhook. Stripe payments enter the owner's Stripe account. The owner separately pays OpenAI for model usage; these balances are not linked automatically.

When Stripe reports a refund or dispute, the linked wallet loses up to ten unused credits and is put on hold for owner review. If the user already spent credits, this does not recover the owner's AI cost. A lost browser cookie **and** lost recovery code cannot be recovered through the app. If the answer completes on the server but the browser connection fails before displaying it, a credit may be consumed; handle that case manually as support.
