import { z } from "zod";

const ATOM_URL = (process.env.ATOM_URL ?? "http://127.0.0.1:8760").replace(/\/+$/, "");
// Generous because the first call loads the model.
const TIMEOUT_MS = z.coerce.number().int().positive().default(180_000).parse(process.env.ATOM_TIMEOUT_MS);

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

async function request<T>(path: string, result: z.ZodType<T>, init?: RequestInit): Promise<T> {
  let res: Response;
  let text: string;
  try {
    res = await fetch(`${ATOM_URL}${path}`, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
    text = await res.text();
  } catch (e) {
    const err = e as Error & { cause?: { code?: string } };
    if (err.name === "TimeoutError") throw new Error(`Atom at ${ATOM_URL} timed out after ${TIMEOUT_MS}ms`);
    throw new Error(`Atom is not reachable at ${ATOM_URL} (${err.cause?.code ?? err.message}). Start the Atom API or set ATOM_URL.`);
  }
  const reply = z
    .discriminatedUnion("ok", [z.object({ ok: z.literal(true), result }), z.object({ ok: z.literal(false), error: z.string() })])
    .safeParse(parseJson(text));
  if (res.ok && reply.success && reply.data.ok) return reply.data.result;
  throw new Error(`Atom ${res.status}: ${reply.success && !reply.data.ok ? reply.data.error : "unexpected response"}`);
}

export const health = () => request("/health", z.record(z.string(), z.unknown()));
