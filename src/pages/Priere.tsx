import { useLocalStorage, getTodayKey } from "@/hooks/useLocalStorage";
import { PRAYER_NAMES, type DayPrayers } from "@/types/app";
import { ScoreRing } from "@/components/ScoreRing";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function Priere() {
  const today = getTodayKey();
  const [data, setData] = useLocalStorage<Record<string, DayPrayers>>("discipline-prayers", {});

  const dayPrayers: DayPrayers = data[today] || {
    date: today,
    prayers: PRAYER_NAMES.map((name) => ({ name, done: false })),
  };

  const togglePrayer = (name: string) => {
    const updated: DayPrayers = {
      ...dayPrayers,
      prayers: dayPrayers.prayers.map((p) => (p.name === name ? { ...p, done: !p.done } : p)),
    };
    setData((prev) => ({ ...prev, [today]: updated }));
  };

  const doneCount = dayPrayers.prayers.filter((p) => p.done).length;
  const score = Math.round((doneCount / 5) * 100);

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Prière</h1>
        <p className="text-sm text-muted-foreground">{doneCount}/5 prières effectuées</p>
      </div>

      <div className="flex justify-center">
        <ScoreRing score={score} size={120} label="Aujourd'hui" />
      </div>

      <div className="space-y-3">
        {dayPrayers.prayers.map((prayer, i) => (
          <motion.button
            key={prayer.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => togglePrayer(prayer.name)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
              prayer.done ? "glass-card border-primary/40" : "glass-card hover:border-primary/20"
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              prayer.done ? "bg-primary" : "bg-muted"
            }`}>
              {prayer.done && <Check className="h-5 w-5 text-primary-foreground" />}
            </div>
            <span className={`text-base font-medium ${prayer.done ? "text-muted-foreground" : "text-foreground"}`}>
              {prayer.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
