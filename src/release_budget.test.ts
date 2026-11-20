import assert from "node:assert/strict";
import test from "node:test";
import { decideRelease, releaseRequestSchema } from "./release_budget.ts";

test("holds a media release when its estimate crosses the remaining monthly cap", () => {
  const request = releaseRequestSchema.parse({
    releaseName: "festival trailer export",
    estimatedUsd: 8.25,
    monthlyCapUsd: 30,
    currentMonthUsd: 24,
    audienceNote: "A cut for subscribers.",
  });

  assert.deepEqual(decideRelease(request), {
    allowed: false,
    reason: "Hold festival trailer export: this build needs 8.25 USD but only 6 USD remains.",
    remainingUsd: 6,
  });
});
