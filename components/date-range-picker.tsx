"use client"

import * as React from "react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import type { Locale } from "date-fns"

interface DateRangePickerProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (dateRange: DateRange | undefined) => void
  className?: string
  locale?: Locale
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
  locale
}: DateRangePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Calendar
        initialFocus
        mode="range"
        defaultMonth={dateRange?.from}
        selected={dateRange}
        onSelect={onDateRangeChange}
        numberOfMonths={2}
        locale={locale}
      />
    </div>
  )
}
