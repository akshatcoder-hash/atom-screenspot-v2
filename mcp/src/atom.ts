import { z } from "zod";

const ATOM_URL = (process.env.ATOM_URL ?? "http://127.0.0.1:8760").replace(/\/+$/, "");
// Generous because the first call loads the model.
const TIMEOUT_MS = z.coerce.number().int().positive().default(180_000).parse(process.env.ATOM_TIMEOUT_MS);

export const click = z.object({
  action: z.literal("click"),
  normalized: z.object({ x: z.number().min(0).max(1000), y: z.number().min(0).max(1000) }).describe("0-1000 space"),
  pixel: z.object({ x: z.number(), y: z.number() }),
  image: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }),
  duration_ms: z.number().nonnegative(),
});

// Inclusive bounds: a point on the right or bottom edge is still on the image.
const clickReply = click.refine(
  ({ pixel, image }) => pixel.x >= 0 && pixel.x <= image.width && pixel.y >= 0 && pixel.y <= image.height,
);

// Any action other than "click" is an abstain; only the click shape is relied on.
const abstain = z
  .object({ action: z.string().refine((action) => action !== "click"), reason: z.string().optional(), raw: z.unknown().optional() })
  .transform(({ reason, raw }) => ({ action: "abstain" as const, reason, raw }));

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

export async function ground(instruction: string, imageBase64: string): Promise<z.infer<typeof click>> {
  const result = await request("/ground", z.union([clickReply, abstain]), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ instruction, image_base64: imageBase64 }),
  });
  if (result.action === "abstain") {
    const raw = result.raw === undefined ? "" : ` (raw: ${JSON.stringify(result.raw)})`;
    throw new Error(`Atom abstained: ${result.reason ?? "no point returned"}${raw}. Try rephrasing the target.`);
  }
  return result;
}
