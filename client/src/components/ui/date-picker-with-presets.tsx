import * as React from "react"
import { addDays, format, startOfToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useMemo } from "react"

interface DatePickerWithPresetsProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  className?: string
}

export function DatePickerWithPresets({
  date,
  setDate,
  className,
}: DatePickerWithPresetsProps) {
  const today = useMemo(() => startOfToday(), [])

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? (
              format(date, "PPP", { locale: ptBR })
            ) : (
              <span>Selecione uma data</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            locale={ptBR}
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
          />
          <div className="p-3 border-t border-border/50">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="justify-start font-normal"
                onClick={() => setDate(today)}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                className="justify-start font-normal"
                onClick={() => setDate(addDays(today, 1))}
              >
                Amanhã
              </Button>
              <Button
                variant="outline"
                className="justify-start font-normal"
                onClick={() => setDate(addDays(today, 2))}
              >
                Em 2 dias
              </Button>
              <Button
                variant="outline"
                className="justify-start font-normal"
                onClick={() => setDate(addDays(today, 7))}
              >
                Em 1 semana
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}