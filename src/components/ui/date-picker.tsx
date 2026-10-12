"use client";
import { useId, useRef, useState } from "react";
import {
  addDays,
  addMonths,
  format,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  endOfMonth,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { DATE_FORMATS, UI_SETTINGS, BOOKING_DEFAULTS } from "@/config/settings";
import { formatDate } from "@/lib/time";
import { useHydrated } from "@/hooks/use-hydrated";
import { calendarDate, calendarDays } from "@/lib/time/calendar";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./dialog";
import { inputClass } from "./field";
import { Button } from "./button";

type Props = {
  id: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};
function CalendarPicker({
  value,
  onSelect,
  disabled,
  min,
  max,
  label,
}: {
  value: string;
  onSelect: (date: string) => void;
  disabled?: boolean;
  min?: string;
  max?: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const pickerId = useId();
  const today = formatDate(new Date(), DATE_FORMATS.dateInput);
  const lower = min ? calendarDate(min.slice(0, 10)) : null;
  const upper = max ? calendarDate(max.slice(0, 10)) : null;
  function bounded(date: Date) {
    return lower && date < lower ? lower : upper && date > upper ? upper : date;
  }
  const [focused, setFocused] = useState(() =>
    format(bounded(calendarDate(value) ?? calendarDate(today)!), DATE_FORMATS.dateInput),
  );
  const [month, setMonth] = useState(startOfMonth(calendarDate(focused)!));
  const grid = useRef<HTMLDivElement>(null);
  const days = calendarDays(month);
  const currentYear = calendarDate(today)!.getFullYear();
  const firstYear =
    lower?.getFullYear() ??
    Math.max(1, Math.min(currentYear, month.getFullYear()) - UI_SETTINGS.calendarYearsBefore);
  const lastYear =
    upper?.getFullYear() ??
    Math.min(9999, Math.max(currentYear, month.getFullYear()) + UI_SETTINGS.calendarYearsAfter);
  const years = Array.from(
    { length: Math.max(0, lastYear - firstYear + 1) },
    (_, index) => firstYear + index,
  );
  const todayAvailable = !(min && today < min.slice(0, 10)) && !(max && today > max.slice(0, 10));
  function select(date: string) {
    onSelect(date);
    setOpen(false);
  }
  function move(date: Date, focusGrid = true) {
    const target = bounded(date);
    const next = format(target, DATE_FORMATS.dateInput);
    setFocused(next);
    setMonth(startOfMonth(target));
    if (focusGrid)
      requestAnimationFrame(() =>
        grid.current?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`)?.focus(),
      );
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          const current = bounded(calendarDate(value) ?? calendarDate(today)!);
          setFocused(format(current, DATE_FORMATS.dateInput));
          setMonth(startOfMonth(current));
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Choose ${label} from calendar`}
          className="rounded-md p-2 text-stone-500 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-40"
        >
          <CalendarDays size={17} />
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] max-w-sm overflow-y-auto p-5 sm:p-6"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          grid.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus();
        }}
      >
        <DialogTitle className="pr-8 text-base font-semibold">Choose {label}</DialogTitle>
        <DialogDescription className="mt-1 text-xs text-stone-500">
          Use arrow keys to move between days. Enter selects a date.
        </DialogDescription>
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
          <p className="text-[10px] font-semibold tracking-widest text-emerald-700 uppercase">
            Selected date
          </p>
          <p className="mt-1 text-sm font-semibold text-emerald-950">
            {calendarDate(value)
              ? format(calendarDate(value)!, DATE_FORMATS.dateWithYear)
              : "Choose a day below"}
          </p>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Previous month"
            disabled={!!lower && startOfMonth(lower) >= month}
            onClick={() => move(addMonths(calendarDate(focused)!, -1))}
          >
            <ChevronLeft size={18} />
          </Button>
          <div className="grid min-w-0 flex-1 grid-cols-[1fr_5.5rem] gap-2">
            <label htmlFor={`${pickerId}-month`} className="sr-only">
              Month
            </label>
            <select
              id={`${pickerId}-month`}
              value={month.getMonth()}
              className={cn(inputClass, "h-10 px-2 text-xs font-medium")}
              onChange={(event) =>
                move(
                  addMonths(calendarDate(focused)!, Number(event.target.value) - month.getMonth()),
                  false,
                )
              }
            >
              {Array.from({ length: 12 }, (_, index) => {
                const candidate = addMonths(month, index - month.getMonth());
                const unavailable = !!(
                  (lower && endOfMonth(candidate) < lower) ||
                  (upper && candidate > upper)
                );
                return (
                  <option key={index} value={index} disabled={unavailable}>
                    {format(candidate, "MMMM")}
                  </option>
                );
              })}
            </select>
            <label htmlFor={`${pickerId}-year`} className="sr-only">
              Year
            </label>
            <select
              id={`${pickerId}-year`}
              value={month.getFullYear()}
              className={cn(inputClass, "h-10 px-2 text-xs font-medium")}
              onChange={(event) =>
                move(
                  addMonths(
                    calendarDate(focused)!,
                    (Number(event.target.value) - month.getFullYear()) * 12,
                  ),
                  false,
                )
              }
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Next month"
            disabled={!!upper && startOfMonth(upper) <= month}
            onClick={() => move(addMonths(calendarDate(focused)!, 1))}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
        <span aria-live="polite" className="sr-only">
          {format(month, DATE_FORMATS.month)}
        </span>
        <div role="grid" aria-label={format(month, DATE_FORMATS.month)} ref={grid} className="mt-3">
          <div role="row" className="grid grid-cols-7">
            {days.slice(0, 7).map((day) => (
              <span
                key={day.toISOString()}
                role="columnheader"
                className="py-2 text-center text-[11px] font-medium text-stone-500"
              >
                {format(day, "EEE")}
              </span>
            ))}
          </div>
          {Array.from({ length: UI_SETTINGS.calendarDays / 7 }, (_, row) => (
            <div role="row" key={row} className="grid grid-cols-7">
              {days.slice(row * 7, row * 7 + 7).map((day) => {
                const date = format(day, DATE_FORMATS.dateInput),
                  unavailable = !!(
                    (min && date < min.slice(0, 10)) ||
                    (max && date > max.slice(0, 10))
                  );
                return (
                  <div role="gridcell" key={date} aria-selected={date === value}>
                    <button
                      type="button"
                      data-date={date}
                      tabIndex={date === focused ? 0 : -1}
                      aria-disabled={unavailable}
                      aria-current={date === today ? "date" : undefined}
                      aria-label={day.toLocaleDateString(UI_SETTINGS.locale, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      className={cn(
                        "my-0.5 flex h-10 w-full items-center justify-center rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1",
                        !unavailable && "hover:bg-emerald-50 hover:text-emerald-800",
                        day.getMonth() !== month.getMonth() && "text-stone-400",
                        unavailable && "cursor-not-allowed opacity-30",
                        date === today &&
                          date !== value &&
                          "font-bold text-emerald-800 ring-1 ring-emerald-300 ring-inset",
                        date === value &&
                          "bg-emerald-700 text-white hover:bg-emerald-800 hover:text-white",
                      )}
                      onClick={() => {
                        if (!unavailable) {
                          select(date);
                        }
                      }}
                      onKeyDown={(event) => {
                        let next: Date | undefined;
                        if (event.key === "ArrowLeft") next = addDays(day, -1);
                        if (event.key === "ArrowRight") next = addDays(day, 1);
                        if (event.key === "ArrowUp") next = addDays(day, -7);
                        if (event.key === "ArrowDown") next = addDays(day, 7);
                        if (event.key === "Home")
                          next = startOfWeek(day, { weekStartsOn: UI_SETTINGS.weekStartsOn });
                        if (event.key === "End")
                          next = endOfWeek(day, { weekStartsOn: UI_SETTINGS.weekStartsOn });
                        if (event.key === "PageUp")
                          next = addMonths(day, event.shiftKey ? -12 : -1);
                        if (event.key === "PageDown")
                          next = addMonths(day, event.shiftKey ? 12 : 1);
                        if (next) {
                          event.preventDefault();
                          move(next);
                        }
                      }}
                    >
                      {day.getDate()}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
          <p className="text-xs text-stone-500">
            Today: {format(calendarDate(today)!, DATE_FORMATS.shortDateWithYear)}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!todayAvailable}
            onClick={() => select(today)}
          >
            Today
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function DateControl({
  kind,
  id,
  name,
  value: controlled,
  defaultValue = "",
  onValueChange,
  required,
  disabled,
  min,
  max,
  className,
  ...aria
}: Props & { kind: "date" | "datetime-local" }) {
  const hydrated = useHydrated();
  const [internal, setInternal] = useState(defaultValue);
  const value = controlled ?? internal;
  function change(next: string) {
    setInternal(next);
    onValueChange?.(next);
  }
  const label = aria["aria-label"] ?? name ?? id;
  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <input
        {...aria}
        id={id}
        name={name}
        type={kind}
        value={value}
        onChange={(event) => change(event.target.value)}
        required={required}
        readOnly={!hydrated}
        disabled={disabled}
        min={min}
        max={max}
        className={cn(
          inputClass,
          "min-w-0 pr-16 [color-scheme:light] [&::-webkit-calendar-picker-indicator]:hidden",
        )}
      />
      <div className="absolute top-0 right-1 flex h-11 items-center">
        {!required && value && (
          <button
            type="button"
            disabled={disabled || !hydrated}
            aria-label={`Clear ${label}`}
            className="rounded p-1 text-stone-400"
            onClick={() => change("")}
          >
            <X size={14} />
          </button>
        )}
        <CalendarPicker
          label={label}
          value={value.slice(0, 10)}
          disabled={disabled || !hydrated}
          min={min}
          max={max}
          onSelect={(date) =>
            change(
              kind === "date" ? date : `${date}T${value.slice(11) || BOOKING_DEFAULTS.startTime}`,
            )
          }
        />
      </div>
    </div>
  );
}
export function DatePicker(props: Props) {
  return <DateControl {...props} kind="date" />;
}
export function DateTimePicker(props: Props) {
  return <DateControl {...props} kind="datetime-local" />;
}
