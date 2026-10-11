import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

const handler = toNextJsHandler(auth);
export async function GET(request: Request) {
  if (new URL(request.url).pathname !== "/api/auth/get-session")
    return Response.json({ message: "This identity operation is unavailable." }, { status: 403 });
  return handler.GET(request);
}
export async function POST(request: Request) {
  // Only the closed-demo identity endpoints are exposed. No account-management back doors.
  const pathname = new URL(request.url).pathname;
  if (!["/api/auth/sign-in/email", "/api/auth/sign-out"].includes(pathname))
    return Response.json({ message: "This identity operation is unavailable." }, { status: 403 });
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 8192) return Response.json({ message: "Request is too large." }, { status: 413 });
  const reader = request.clone().body?.getReader();
  if (reader) {
    let bytes = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 8192) {
        void reader.cancel();
        return Response.json({ message: "Request is too large." }, { status: 413 });
      }
    }
  }
  return handler.POST(request);
}
