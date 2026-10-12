import "server-only";
import { SECURITY } from "@/config/security";

export class RequestBodyError extends Error {
  constructor(public status: 408 | 413 | 400) {
    super(
      status === 413
        ? "Request is too large."
        : status === 408
          ? "Request body timed out."
          : "Invalid request body.",
    );
  }
}

export async function boundedBody(request: Request) {
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > SECURITY.authBodyBytes))
    throw new RequestBodyError(413);
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new RequestBodyError(408));
      void reader.cancel().catch(() => {});
    }, SECURITY.authBodyTimeoutMs);
  });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await Promise.race([reader.read(), deadline]);
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > SECURITY.authBodyBytes) {
        void reader.cancel().catch(() => {});
        throw new RequestBodyError(413);
      }
      chunks.push(chunk.value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return body;
  } catch (error) {
    if (error instanceof RequestBodyError) throw error;
    throw new RequestBodyError(400);
  } finally {
    clearTimeout(timeout);
    reader.releaseLock();
  }
}
