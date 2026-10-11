import type { ReactNode } from "react";
export const inputClass =
  "h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 disabled:bg-stone-50";
export function Field({
  name,
  label,
  error,
  hint,
  children,
}: {
  name: string;
  label: string;
  error?: string[];
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs leading-5 text-stone-500">{hint}</p>}
      {error && (
        <p id={`${name}-error`} className="text-xs text-red-700">
          {error.join(" ")}
        </p>
      )}
    </div>
  );
}
