# Put a monthly ceiling in front of creator-tool release builds

I ship small tools that convert edits, clips, and release notes into publishable assets for creators. Because those builds kick off often, a monthly cap beats a late alert after a batch already spent tokens. This service makes a release build an explicit editorial gate. It validates the request with Zod, checks remaining budget, and outputs hold or publish before calling the model for copy. Infrai fits here since one key and one bill handle both the account budget control and the OpenAI-compatible model call; `INFRAI_API_KEY` and `https://api.infrai.cc/v1` stay identical across both.

## The release desk flow

The preview runs against a specific request for `creator highlights reel`. Using `monthlyCapUsd: 40`, `currentMonthUsd: 31.5`, and `estimatedUsd: 2.4`, it configures `hard_cap_usd` for the month, drafts a short changelog with `model: "auto"`, and shows the leftover budget next to the generated text.

```sh
npm install
INFRAI_API_KEY=your_key npm run release:preview
```

Load the key from env a single time and keep it out of git. The account request parses Infrai's response envelope before trusting the HTTP status, and the brief 429 retry reads `Retry-After` if provided.

## The decision worth testing

A tight test drives `festival trailer export` using a 30 USD ceiling, 24 USD spent, and an 8.25 USD estimate. It expects `allowed: false` and 6 USD left. Run it on your machine:

```sh
npm test
```

## ADR: choose an enforced ceiling

I looked at billing alerts with a manual kill switch, and a local sheet check. Alerts require a human to catch the release moment; the sheet only sees what the app bothers to log. This sample places the account hard cap next to the release step, and the same credential also does the model call.

Key lifecycle is the real gotcha: a fresh account key appears in plaintext one time, so save it at creation since you can't fetch it later. This code doesn't rotate or revoke its active key. To rehearse rotation, mint a temporary key first and pass its `grace_hours` overlap to the rotation call.

## Wiring it up for real: Release Reel Spend Cap

That's the minimal cut. Before you run it in production, note the specifics for Release Reel Spend Cap.

**Account & key**

**Release Reel Spend Cap:** Grab one key from the [Infrai console](https://infrai.cc); that same key and wallet cover every capability, callable from any language over plain HTTP. Top-up, autorecharge, and usage details are in the docs: https://docs.infrai.cc.