# Deploy the private online room

The illustrated site is deployed at <https://neural-avalanches-roast-room.vieclinic.workers.dev>. Its online answers require an OpenAI API key. Do not put the key in GitHub, in `dist/`, in a browser script, or in chat.

1. Run `npm run build:share` and `npm test`.
2. Sign in to Cloudflare with `npx --yes wrangler login` and check with `npx --yes wrangler whoami`. The owner has already signed in on the current machine.
3. Create an OpenAI API key at <https://platform.openai.com/api-keys>. Set `OPENAI_API_KEY` with `npx --yes wrangler secret put OPENAI_API_KEY` and paste the key at the terminal prompt. API billing is separate from ChatGPT billing.
4. `ROOM_ACCESS_CODE` has already been set in Cloudflare. The owner should send that code separately from the room link. Replace it if it is shared beyond the group.
5. The site has already been deployed. After adding the API key, test a short, nonconfidential question in both FULL and QUICK modes before sending the URL to collaborators. For later code changes, run `npm run deploy`.
6. Apply [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-apps/) to the Worker URL for the invited collaborators. The room code is a second gate. Review [OpenAI API usage limits and spending controls](https://platform.openai.com/settings/organization/limits) and set a budget you are comfortable with.

For local Worker development, create a **local only** `.dev.vars` file in this folder containing `OPENAI_API_KEY="..."` and `ROOM_ACCESS_CODE="..."`. `.dev.vars` is excluded from the release package. Then run `npm run build:share` and `npm run dev:online`; open <http://localhost:4732>. Never commit `.dev.vars`.

The Worker allows at most three council requests per minute per Cloudflare location using a shared room rate-limit key. This helps with accidental overuse; Cloudflare documents its rate limiter as eventually consistent and location scoped, so it is not a hard spending cap. Cloudflare Access and an OpenAI spending limit are recommended before giving out a link. `OPENAI_MODEL` may be configured in Wrangler for another supported model, but check that model's current price and behavior first.

The default `gpt-5.6-terra` price at the time of preparation was $2 per million input tokens and $12 per million output tokens. A hypothetical review using 7,000 input and 4,000 output tokens would cost about **$0.062** for the model call. FULL mode caps total output at 6,500 tokens; QUICK caps it at 4,500. Actual usage varies, and reasoning tokens count toward output. Static page views and playback do not call OpenAI. The response includes token usage for future monitoring, but the current interface does not display it.
