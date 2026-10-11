export default function Loading() {
  return (
    <div role="status" aria-label="Loading your workspace" className="space-y-6">
      <div className="h-8 w-56 animate-pulse rounded bg-stone-200" />
      <div className="h-40 animate-pulse rounded-xl bg-stone-200/60" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-stone-200/50" />
        ))}
      </div>
      <span className="sr-only">Loading your workspace…</span>
    </div>
  );
}
