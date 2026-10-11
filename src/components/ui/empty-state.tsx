import { CalendarDays } from "lucide-react";
import type { ReactNode } from "react";
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-stone-200 bg-white px-6 py-14 text-center">
      <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        <CalendarDays size={23} />
      </span>
      <h2 className="font-semibold text-stone-800">{title}</h2>
      <p className="mx-auto mt-2 mb-5 max-w-md text-sm leading-6 text-stone-500">{description}</p>
      {action}
    </div>
  );
}
