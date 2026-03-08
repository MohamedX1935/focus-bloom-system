import { useHabits, useSettings } from "@/hooks/useSupabaseData";
import { type DayHabits, type HabitEntry, type DayType, getDayType, getHabitsForDate } from "@/types/app";
import { motion } from "framer-motion";
import { Check, Briefcase, Coffee } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

export default function Habitudes() {
  const today = getTodayKey();
  const { habitsData, upsertDay } = useHabits();
  const { settings, updateSettings } = useSettings();

  const dayType = getDayType(today, settings);
  const templateHabits = getHabitsForDate(today, settings);

  // Merge saved data with template: keep done state for matching ids
  const savedHabits = habitsData[today]?.habits || [];
  const savedMap = new Map(savedHabits.map((h) => [h.id, h]));

  const dayHabits: DayHabits = {
    date: today,
    habits: templateHabits.map((h) => ({
      ...h,
      done: savedMap.get(h.id)?.done ?? false,
    })),
  };

  const toggleHabit = (id: string) => {
    const updated = dayHabits.habits.map((h) => (h.id === id ? { ...h, done: !h.done } : h));
    upsertDay(today, updated);
  };

  const toggleDayType = () => {
    const newType: DayType = dayType === "travail" ? "repos" : "travail";
    updateSettings({
      ...settings,
      dayTypeOverrides: { ...settings.dayTypeOverrides, [today]: newType },
    });
  };

  const doneCount = dayHabits.habits.filter((h) => h.done).length;
  const total = dayHabits.habits.length;
  const totalWeight = dayHabits.habits.reduce((s, h) => s + h.weight, 0);
  const doneWeight = dayHabits.habits.filter((h) => h.done).reduce((s, h) => s + h.weight, 0);
  const score = totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Habitudes</h1>
          <p className="text-sm text-muted-foreground">
            {doneCount}/{total} complétées · Score {score}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDayType}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-card border transition-colors hover:border-primary/30"
          >
            {dayType === "travail" ? (
              <Briefcase className="h-4 w-4 text-primary" />
            ) : (
              <Coffee className="h-4 w-4 text-primary" />
            )}
            <span className="text-xs font-medium text-foreground capitalize">{dayType}</span>
          </button>
          <div className="text-3xl font-bold text-foreground">
            {score}
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
        </div>
      </div>

      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${(doneCount / total) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="space-y-2">
        {dayHabits.habits.map((habit, i) => (
          <motion.button
            key={habit.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => toggleHabit(habit.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${habit.done ? "glass-card border-primary/30" : "glass-card hover:border-primary/20"}`}
          >
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${habit.done ? "bg-primary" : "bg-muted"}`}
            >
              {habit.done ? <Check className="h-3.5 w-3.5 text-primary-foreground" /> : null}
            </div>
            <span
              className={`text-sm flex-1 text-left ${habit.done ? "text-muted-foreground line-through" : "text-foreground"}`}
            >
              {habit.label}
            </span>
            <span className="text-xs text-muted-foreground">×{habit.weight}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
