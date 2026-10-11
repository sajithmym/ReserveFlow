import type { ReactNode } from "react";
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-emerald-700 uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
