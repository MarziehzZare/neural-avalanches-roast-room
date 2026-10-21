# Neural Avalanches Roast Room

An illustrated web room for pressure-testing neuronal-avalanche claims. The sample exchange shows how the seven simulated research lenses address one another; it is scripted and does not answer a visitor's question. The online question form uses one AI model to generate a separate research review.

## Open the local preview

With Node.js 20 or newer, run `npm start` and open <http://localhost:4731>. The local server shows the room and the scripted debate. For a local question review, use `npm run dev:online` at <http://localhost:4732> after setting the development secrets described in [DEPLOY.md](DEPLOY.md). The **Copy a request for Codex instead** button works without the online service.

## Share with collaborators

The [paid online room](https://neural-avalanches-roast-room-paid.vieclinic.workers.dev/#question) is open to anyone with its link. Visitors can buy 10 reviews for US$5 or use a private complimentary invitation. There is no shared room code; see [PAID-COLLABORATOR-GUIDE.md](PAID-COLLABORATOR-GUIDE.md). The [original online room](https://neural-avalanches-roast-room.vieclinic.workers.dev) still uses a shared access code and [COLLABORATOR-GUIDE.md](COLLABORATOR-GUIDE.md). The [Stripe test room](https://neural-avalanches-roast-room-test.vieclinic.workers.dev) accepts only test payments. The private GitHub repository is for maintaining the code. The 11–12 second [demo video](videos/neural-avalanches-demo/neural-avalanches-demo.mp4) shows the actual interface and scripted interaction.

The Stripe test room also has a [paper-review pilot](PAPER-REVIEW-PILOT.md). It accepts a PDF of up to 20 pages and 5 MB, uses one test review credit, and reports token use. Paper review is not yet offered in the paid room while its costs are being measured.

Payment and complimentary credit setup is documented in [PAYMENTS.md](PAYMENTS.md).

## How the online review works

The browser sends the question to a Cloudflare Worker. The original room checks a shared access code; the paid room checks the visitor's credit balance. Both apply a rate limit before calling the OpenAI Responses API with a server-side key. The default model is `gpt-5.6-terra`. It applies all seven simulated research lenses in one call and discloses that it is **one model**, not seven independent reviewers or the named scientists. FULL requests ask for openings, debate, and ratification; QUICK requests ask for openings and debate with final positions. The prompt contains a fixed catalog of exact primary-source URLs, but no full papers or live literature search. The model is instructed to identify unknowns and limit claims to what the supplied information supports. The Worker sets `store: false`; users should still only submit research they are authorized to send to OpenAI.

The UI uses illustrated avatar sprite sheets generated from the supplied seat photos. Portraits blink at varied intervals. Only the active speaker in a **playing** sample debate moves their mouth; paused and idle portraits keep still mouths. The six tabs preview the room's workflow. The sample turns are illustrative text, not scientific conclusions about a visitor's question or real quotations.

## Assets and science protocol

`npm run build:share` assembles `dist/` with the web page, MZ brand assets, and illustrated sprite sheets. It excludes the source photos in `brains/` and older photo-based web assets. The deeper Codex council protocol is in [SKILL.md](SKILL.md) and [references/evidence-protocol.md](references/evidence-protocol.md). The online Worker is a compact one-model adaptation and must not be described as an identical independent seven-reviewer run.
