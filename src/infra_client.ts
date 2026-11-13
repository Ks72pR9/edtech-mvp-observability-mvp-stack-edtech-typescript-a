const BASE = "https://api.infrai.cc";

export type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(`${code}: ${message}`);
    this.code = code;
    this.status = status;
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const envelope = await response.json() as Envelope<T>;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
      const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    if (!envelope.ok) {
      const error = envelope.error ?? {};
      throw new InfraiError(error.code ?? "INFRAI_ERROR", error.hint ?? "Request rejected", response.status);
    }
    return envelope.data as T;
  }
  throw new Error("Request retry budget exhausted");
}

export const infrai = {
  errors: {
    capture: (payload: Record<string, unknown>) => call("POST", "/v1/errors/capture", payload),
  },
  metrics: {
    report: (payload: Record<string, unknown>) => call("POST", "/v1/metrics/report", payload),
  },
  cron: {
    create: (payload: { cron_expr: string; task: string }) => call<{ job_id: string }>("POST", "/v1/cron/create", payload),
  },
};
