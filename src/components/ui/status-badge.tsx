import { cn } from "@/lib/utils";
export function StatusBadge({
  label,
  tone = "green",
}: {
  label: string;
  tone?: "green" | "amber" | "neutral";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        tone === "green"
          ? "bg-emerald-50 text-emerald-800"
          : tone === "amber"
            ? "bg-amber-50 text-amber-800"
            : "bg-stone-100 text-stone-600",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}
