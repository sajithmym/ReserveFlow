"use client";
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Arial, sans-serif", padding: "64px 24px", textAlign: "center" }}>
        <h1>ReserveFlow is temporarily unavailable</h1>
        <p>Please try again or contact your workspace administrator.</p>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  );
}
