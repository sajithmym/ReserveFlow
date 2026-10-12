"use client";
import { useRef, useState } from "react";
import { addDays, addMonths, format, startOfMonth, startOfWeek, endOfWeek } from "date-fns";
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
  const [focused, setFocused] = useState(() =>
    calendarDate(value) ? value : formatDate(new Date(), DATE_FORMATS.dateInput),
  );
  const [month, setMonth] = useState(startOfMonth(calendarDate(focused)!));
  const grid = useRef<HTMLDivElement>(null);
  const days = calendarDays(month);
  function move(date: Date) {
    const next = format(date, DATE_FORMATS.dateInput);
    setFocused(next);
    setMonth(startOfMonth(date));
    requestAnimationFrame(() =>
      grid.current?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`)?.focus(),
    );
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          const current =
            calendarDate(value) ?? calendarDate(formatDate(new Date(), DATE_FORMATS.dateInput))!;
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
          className="rounded p-2 text-stone-500 hover:bg-stone-50"
        >
          <CalendarDays size={17} />
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-w-sm"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          grid.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus();
        }}
      >
        <DialogTitle className="pr-8 font-semibold">Choose {label}</DialogTitle>
        <DialogDescription className="mt-1 text-xs text-stone-500">
          Use arrow keys to move between days. Enter selects a date.
        </DialogDescription>
        <div className="mt-5 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Previous month"
            onClick={() => move(addMonths(calendarDate(focused)!, -1))}
          >
            <ChevronLeft size={18} />
          </Button>
          <span aria-live="polite" className="text-sm font-semibold">
            {format(month, DATE_FORMATS.month)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Next month"
            onClick={() => move(addMonths(calendarDate(focused)!, 1))}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
        <div role="grid" aria-label={format(month, DATE_FORMATS.month)} ref={grid} className="mt-3">
          <div role="row" className="grid grid-cols-7">
            {days.slice(0, 7).map((day) => (
              <span
                key={day.toISOString()}
                role="columnheader"
                className="py-2 text-center text-xs text-stone-400"
              >
                {format(day, DATE_FORMATS.weekdayInitial)}
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
                      aria-label={day.toLocaleDateString(UI_SETTINGS.locale, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      className={cn(
                        "my-0.5 flex h-9 w-full items-center justify-center rounded-md text-sm hover:bg-emerald-50",
                        day.getMonth() !== month.getMonth() && "text-stone-400",
                        unavailable && "opacity-30",
                        date === value && "bg-emerald-700 text-white hover:bg-emerald-800",
                      )}
                      onClick={() => {
                        if (!unavailable) {
                          onSelect(date);
                          setOpen(false);
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
                        if (event.key === "PageUp") next = addMonths(day, -1);
                        if (event.key === "PageDown") next = addMonths(day, 1);
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
