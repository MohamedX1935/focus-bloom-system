import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addDays, subDays, isToday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface DateNavigatorProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  /** Don't allow navigating past today (default true) */
  maxToday?: boolean;
}

export function DateNavigator({ selectedDate, onDateChange, maxToday = true }: DateNavigatorProps) {
  const date = parseISO(selectedDate);
  const today = isToday(date);

  const goPrev = () => onDateChange(subDays(date, 1).toISOString().split("T")[0]);
  const goNext = () => {
    if (maxToday && today) return;
    onDateChange(addDays(date, 1).toISOString().split("T")[0]);
  };
  const goToday = () => onDateChange(new Date().toISOString().split("T")[0]);

  const label = today
    ? "Aujourd'hui"
    : format(date, "EEEE d MMMM", { locale: fr });

  return (
    <div className="flex items-center justify-center gap-2">
      <Button size="icon" variant="ghost" onClick={goPrev} className="h-8 w-8">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <button
        onClick={goToday}
        className="text-sm font-medium text-foreground capitalize min-w-[140px] text-center hover:text-primary transition-colors"
      >
        {label}
      </button>
      <Button
        size="icon"
        variant="ghost"
        onClick={goNext}
        disabled={maxToday && today}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
