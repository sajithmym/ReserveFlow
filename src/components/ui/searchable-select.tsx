"use client";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { UI_SETTINGS } from "@/config/settings";
import { useHydrated } from "@/hooks/use-hydrated";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputClass } from "./field";

export type SelectOption = { value: string; label: string; disabled?: boolean };
type Props = {
  id: string;
  name?: string;
  options: readonly SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};
export function SearchableSelect({
  id,
  name,
  options,
  value: controlled,
  defaultValue = "",
  onValueChange,
  placeholder = "Choose an option",
  required,
  disabled,
  clearable = true,
  className,
  ...aria
}: Props) {
  const hydrated = useHydrated();
  const unavailable = disabled || !hydrated;
  const listId = useId();
  const [internal, setInternal] = useState(defaultValue);
  const value = controlled ?? internal;
  const selected = options.find((option) => option.value === value);
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null),
    list = useRef<HTMLDivElement>(null);
  const filtered = options.filter((option) =>
    option.label
      .toLocaleLowerCase(UI_SETTINGS.locale)
      .includes(query.toLocaleLowerCase(UI_SETTINGS.locale)),
  );
  const enabled = filtered.filter((option) => !option.disabled);
  const activeValue = enabled[Math.min(active, enabled.length - 1)]?.value;
  useEffect(() => {
    input.current?.setCustomValidity(
      required && (!selected || selected.disabled) ? "Choose an option." : "",
    );
  }, [required, selected]);
  useEffect(() => {
    if (open)
      list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [activeValue, open]);
  function choose(next: string) {
    setInternal(next);
    onValueChange?.(next);
    setOpen(false);
    setQuery("");
    input.current?.focus();
  }
  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setQuery("");
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActive((previous) =>
        !open
          ? event.key === "ArrowUp"
            ? Math.max(0, enabled.length - 1)
            : Math.max(
                0,
                enabled.findIndex((option) => option.value === value),
              )
          : Math.max(
              0,
              Math.min(enabled.length - 1, previous + (event.key === "ArrowDown" ? 1 : -1)),
            ),
      );
    } else if (open && (event.key === "Home" || event.key === "End")) {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : Math.max(0, enabled.length - 1));
    } else if (open && event.key === "Enter") {
      event.preventDefault();
      if (activeValue !== undefined) choose(activeValue);
    } else if (event.key === "Tab") {
      setOpen(false);
      setQuery("");
    }
  }
  return (
    <div
      className={cn("relative w-full min-w-0", className)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setQuery("");
        }
      }}
    >
      <input type="hidden" name={name} value={value} disabled={disabled} />
      <input
        {...aria}
        ref={input}
        id={id}
        role="combobox"
        type="text"
        autoComplete="off"
        disabled={unavailable}
        aria-expanded={open}
        aria-required={required}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && activeValue !== undefined
            ? `${listId}-${filtered.findIndex((o) => o.value === activeValue)}`
            : undefined
        }
        className={cn(inputClass, "pr-16")}
        value={open ? query : (selected?.label ?? "")}
        placeholder={placeholder}
        onClick={() => {
          setOpen(true);
          setActive(0);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={keyDown}
      />
      <div className="absolute top-0 right-1 flex h-11 items-center">
        {clearable && value && (
          <button
            type="button"
            disabled={unavailable}
            aria-label={`Clear ${aria["aria-label"] ?? name ?? id}`}
            className="rounded p-1 text-stone-400 hover:text-stone-700"
            onClick={() => choose("")}
          >
            <X size={14} />
          </button>
        )}
        <button
          type="button"
          disabled={unavailable}
          aria-label={`Open ${aria["aria-label"] ?? name ?? id} options`}
          tabIndex={-1}
          className="rounded p-1 text-stone-400"
          onClick={() => {
            setOpen(!open);
            setQuery("");
            input.current?.focus();
          }}
        >
          <ChevronDown size={16} />
        </button>
      </div>
      {open && (
        <div
          ref={list}
          id={listId}
          role="listbox"
          aria-label={aria["aria-label"] ?? name ?? id}
          className="absolute top-full z-40 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-stone-200 bg-white p-1 shadow-lg"
        >
          {filtered.length ? (
            filtered.map((option, index) => (
              <div
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={value === option.value}
                aria-disabled={option.disabled || undefined}
                data-active={activeValue === option.value}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-md px-3 py-2.5 text-sm",
                  activeValue === option.value
                    ? "bg-emerald-50 text-emerald-900"
                    : "text-stone-700",
                  option.disabled && "cursor-default opacity-50",
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (!unavailable && !option.disabled && !input.current?.matches(":disabled"))
                    choose(option.value);
                }}
              >
                {option.label}
                {value === option.value && <Check size={14} />}
              </div>
            ))
          ) : (
            <div role="status" className="px-3 py-4 text-sm text-stone-500">
              No options found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
