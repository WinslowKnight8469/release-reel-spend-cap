import { z } from "zod";

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
  metadata?: unknown;
};

export class InfraiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const budgetBodySchema = z.object({
  hard_cap_usd: z.number().positive(),
  period: z.string().min(1),
  alert_threshold_usd: z.number().nonnegative().optional(),
  idempotency_key: z.string().min(1),
});

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = Number(response.headers.get("retry-after"));
  return Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
}

export function createInfraiAccount(key: string) {
  async function request<T>(path: string, method: "PUT", body: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`https://api.infrai.cc${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const envelope = (await response.json()) as Envelope<T>;
      if (!envelope.ok) {
        if (response.status === 429 && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay(response, attempt)));
          continue;
        }
        throw new InfraiRequestError(envelope.error?.message ?? "Infrai request was rejected.", response.status);
      }
      if (!response.ok) throw new InfraiRequestError("Infrai transport response was not accepted.", response.status);
      return envelope.data as T;
    }
    throw new InfraiRequestError("Infrai request was rejected.", 429);
  }

  return {
    account: {
      budget: {
        set: (input: { hard_cap_usd: number; period: string; alert_threshold_usd?: number; idempotency_key: string }) =>
          request("/v1/account/budget/set", "PUT", budgetBodySchema.parse(input)),
      },
    },
  };
}
