"use client"

import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { ChevronDownIcon } from "lucide-react"
import { useState } from "react"
import { zhCN as zhCNDayPicker } from "react-day-picker/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatLocalDateTime, parseLocalDateTime } from "@/lib/date-time"
import { cn } from "@/lib/utils"

type TimePickerProps = {
  "aria-invalid"?: boolean | "false" | "true"
  className?: string
  disabled?: boolean
  id?: string
  onValueChange: (value: string) => void
  value: string
}

function getSelectedDate(value: string) {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? undefined : date
}

function getTimeValue(date: Date | undefined) {
  return date ? formatLocalDateTime(date).split(" ")[1] : "00:00:00"
}

function combineDateAndTime(date: Date, time: string) {
  const [hour = "00", minute = "00", second = "00"] = time.split(":")

  return parseLocalDateTime(
    `${format(date, "yyyy-MM-dd")} ${hour.padStart(2, "0")}:${minute.padStart(
      2,
      "0"
    )}:${second.padStart(2, "0")}`
  )
}

function TimePicker({
  "aria-invalid": ariaInvalid,
  className,
  disabled,
  id,
  onValueChange,
  value,
}: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = getSelectedDate(value)
  const timeValue = getTimeValue(selectedDate)
  const isInvalid = ariaInvalid === true || ariaInvalid === "true"
  const timeId = id ? `${id}-time` : undefined

  return (
    <FieldGroup className={cn("flex-row gap-2", className)} data-time-picker="">
      <Field className="min-w-0" data-disabled={disabled} data-invalid={isInvalid}>
        <FieldLabel htmlFor={id}>日期</FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                id={id}
                disabled={disabled}
                aria-invalid={isInvalid}
                data-empty={!selectedDate}
                className="w-full min-w-0 justify-between font-normal data-[empty=true]:text-muted-foreground"
              />
            }
          >
            <span className="truncate">
              {selectedDate ? format(selectedDate, "PPP", { locale: zhCN }) : "选择日期"}
            </span>
            <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              captionLayout="dropdown"
              defaultMonth={selectedDate}
              locale={zhCNDayPicker}
              onSelect={(nextDate) => {
                if (!nextDate) {
                  return
                }

                onValueChange(combineDateAndTime(nextDate, timeValue))
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </Field>
      <Field
        className="w-32 shrink-0"
        data-disabled={disabled || !selectedDate}
        data-invalid={isInvalid}
      >
        <FieldLabel htmlFor={timeId}>时间</FieldLabel>
        <Input
          type="time"
          id={timeId}
          step="1"
          value={timeValue}
          disabled={disabled || !selectedDate}
          aria-invalid={isInvalid}
          className="appearance-none bg-background font-mono tabular-nums [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          onChange={(event) => {
            if (selectedDate) {
              onValueChange(combineDateAndTime(selectedDate, event.target.value))
            }
          }}
        />
      </Field>
    </FieldGroup>
  )
}

export { TimePicker }
