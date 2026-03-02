import { useLocalStorage, getTodayKey } from "@/hooks/useLocalStorage";
import { DEFAULT_HABITS, type DayHabits, type HabitEntry } from "@/types/app";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

export default function Habitudes() {
  const today = getTodayKey();
  const [data, setData] = useLocalStorage<Record<string, DayHabits>>("discipline-habits", {});

  const dayHabits: DayHabits = data[today] || {
    date: today,
    habits: DEFAULT_HABITS.map((h) => ({ ...h, done: false })),
  };

  const toggleHabit = (id: string) => {
    const updated: DayHabits = {
      ...dayHabits,
      habits: dayHabits.habits.map((h) => (h.id === id ? { ...h, done: !h.done } : h)),
    };
    setData((prev) => ({ ...prev, [today]: updated }));
  };

  const doneCount = dayHabits.habits.filter((h) => h.done).length;
  const total = dayHabits.habits.length;
  const score = Math.round((dayHabits.habits.filter(h => h.done).reduce((s, h) => s + h.weight, 0) / dayHabits.habits.reduce((s, h) => s + h.weight, 0)) * 100);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Habitudes</h1>
          <p className="text-sm text-muted-foreground">{doneCount}/{total} complétées · Score {score}</p>
        </div>
        <div className="text-3xl font-bold text-foreground">{score}<span className="text-sm text-muted-foreground">/100</span></div>
      </div>

      {/* Progress bar */}
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
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
              habit.done
                ? "glass-card border-primary/30"
                : "glass-card hover:border-primary/20"
            }`}
          >
            <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
              habit.done ? "bg-primary" : "bg-muted"
            }`}>
              {habit.done ? <Check className="h-3.5 w-3.5 text-primary-foreground" /> : null}
            </div>
            <span className={`text-sm flex-1 text-left ${habit.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {habit.label}
            </span>
            <span className="text-xs text-muted-foreground">×{habit.weight}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
