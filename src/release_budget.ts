import { z } from "zod";

export const releaseRequestSchema = z.object({
  releaseName: z.string().min(1),
  estimatedUsd: z.number().nonnegative(),
  monthlyCapUsd: z.number().positive(),
  currentMonthUsd: z.number().nonnegative(),
  audienceNote: z.string().min(1),
});

export type ReleaseRequest = z.infer<typeof releaseRequestSchema>;

export type ReleaseDecision = {
  allowed: boolean;
  reason: string;
  remainingUsd: number;
};

export function decideRelease(request: ReleaseRequest): ReleaseDecision {
  const remainingUsd = Number((request.monthlyCapUsd - request.currentMonthUsd).toFixed(2));
  if (request.estimatedUsd > remainingUsd) {
    return {
      allowed: false,
      reason: `Hold ${request.releaseName}: this build needs ${request.estimatedUsd} USD but only ${remainingUsd} USD remains.`,
      remainingUsd,
    };
  }
  return {
    allowed: true,
    reason: `Publish ${request.releaseName}: the estimate fits inside this month's ceiling.`,
    remainingUsd,
  };
}
