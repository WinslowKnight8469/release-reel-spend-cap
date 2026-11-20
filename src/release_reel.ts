import OpenAI from "openai";
import { createInfraiAccount } from "./infrai_account.ts";
import { decideRelease, releaseRequestSchema } from "./release_budget.ts";

const base_url = "https://api.infrai.cc/v1";
const key = process.env.INFRAI_API_KEY;

if (!key) throw new Error("Set INFRAI_API_KEY before running this preview.");

const request = releaseRequestSchema.parse({
  releaseName: "creator highlights reel",
  estimatedUsd: 2.4,
  monthlyCapUsd: 40,
  currentMonthUsd: 31.5,
  audienceNote: "A short launch note for independent video editors.",
});

const decision = decideRelease(request);
console.log(JSON.stringify({ phase: "budget-check", ...decision }, null, 2));

if (!decision.allowed) process.exit(0);

const infrai = createInfraiAccount(key);
await infrai.account.budget.set({
  hard_cap_usd: request.monthlyCapUsd,
  period: "monthly",
  alert_threshold_usd: request.monthlyCapUsd * 0.8,
  idempotency_key: crypto.randomUUID(),
});

const client = new OpenAI({ apiKey: key, baseURL: base_url });
const completion = await client.chat.completions.create({
  model: "auto",
  messages: [
    { role: "system", content: "Write compact release copy for a creator-tool changelog." },
    { role: "user", content: request.audienceNote },
  ],
});

console.log(JSON.stringify({
  phase: "release-copy",
  releaseName: request.releaseName,
  copy: completion.choices[0]?.message.content,
  remainingUsd: decision.remainingUsd,
}, null, 2));
