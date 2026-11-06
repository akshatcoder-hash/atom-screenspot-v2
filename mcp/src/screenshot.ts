import { readFile } from "node:fs/promises";
import { isAbsolute } from "node:path";

function mimeFromSignature(bytes: Buffer): string | undefined {
  const header = bytes.toString("latin1", 0, 12);
  if (header.startsWith("\x89PNG\r\n\x1a\n")) return "image/png";
  if (header.startsWith("\xff\xd8\xff")) return "image/jpeg";
  if (header.startsWith("RIFF") && header.endsWith("WEBP")) return "image/webp";
}

export async function readScreenshot(image_path?: string, image_base64?: string): Promise<{ mime: string; base64: string }> {
  let field: string;
  let bytes: Buffer;
  if (image_path !== undefined && image_base64 === undefined) {
    if (!isAbsolute(image_path)) throw new Error("image_path must be an absolute path.");
    field = "image_path";
    bytes = await readFile(image_path).catch(() => {
      throw new Error(`Cannot read image_path: ${image_path}`);
    });
  } else if (image_base64 !== undefined && image_path === undefined) {
    field = "image_base64";
    bytes = Buffer.from(image_base64.replace(/^data:[^,]*,/, ""), "base64");
  } else {
    throw new Error("Provide exactly one of image_path or image_base64.");
  }
  const mime = mimeFromSignature(bytes);
  if (!mime) throw new Error(`${field} does not start with a PNG, JPEG, or WebP file signature.`);
  return { mime, base64: bytes.toString("base64") };
}
