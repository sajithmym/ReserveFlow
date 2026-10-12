import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { boundedBody, RequestBodyError } from "@/lib/security/request-body";

function privateResponse(response: Response) {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

const handler = toNextJsHandler(auth);
export async function GET(request: Request) {
  if (new URL(request.url).pathname !== "/api/auth/get-session")
    return Response.json({ message: "This identity operation is unavailable." }, { status: 403 });
  return privateResponse(await handler.GET(request));
}
export async function POST(request: Request) {
  // Only the closed-demo identity endpoints are exposed. No account-management back doors.
  const pathname = new URL(request.url).pathname;
  if (!["/api/auth/sign-in/email", "/api/auth/sign-out"].includes(pathname))
    return Response.json({ message: "This identity operation is unavailable." }, { status: 403 });
  try {
    const body = await boundedBody(request);
    // Hand the library the already bounded body; cloning an unbounded stream
    // would leave an unchecked copy buffered while the limit was being read.
    const bounded = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body,
      signal: request.signal,
    });
    return privateResponse(await handler.POST(bounded));
  } catch (error) {
    if (error instanceof RequestBodyError)
      return privateResponse(Response.json({ message: error.message }, { status: error.status }));
    console.error("Authentication request failed", {
      type: error instanceof Error ? error.name : "Unknown",
    });
    return privateResponse(
      Response.json(
        { message: "Could not complete authentication. Please try again." },
        { status: 503 },
      ),
    );
  }
}
