import { useLocalStorage, getTodayKey } from "@/hooks/useLocalStorage";
import { DEFAULT_SETTINGS, type DayHabits, type AppSettings, DEFAULT_HABITS } from "@/types/app";
import { ScoreRing } from "@/components/ScoreRing";
import { ModuleCard } from "@/components/ModuleCard";
import { Dumbbell, Calendar, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function Sport() {
  const today = getTodayKey();
  const [settings] = useLocalStorage<AppSettings>("discipline-settings", DEFAULT_SETTINGS);
  const [habitsData] = useLocalStorage<Record<string, DayHabits>>("discipline-habits", {});
  const [sportMetrics, setSportMetrics] = useLocalStorage("discipline-sport-metrics", {
    poids: "",
    tourTaille: "",
    calories: "",
  });

  // Count monthly sessions
  const month = today.substring(0, 7);
  const monthDays = Object.entries(habitsData).filter(([key]) => key.startsWith(month));
  const seancesMois = monthDays.filter(([_, day]) =>
    day.habits.find((h) => h.id === "musculation")?.done
  ).length;

  // Sport streak (only on allowed days)
  let sportStreak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().split("T")[0];
    const dayOfWeek = d.getDay();
    if (settings.joursSport.includes(dayOfWeek)) {
      const entry = habitsData[key];
      if (entry?.habits.find((h) => h.id === "musculation")?.done) {
        sportStreak++;
        d.setDate(d.getDate() - 1);
      } else break;
    } else {
      d.setDate(d.getDate() - 1);
      // Don't break on non-sport days
      if (d < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) break;
    }
  }

  const todayDone = habitsData[today]?.habits.find((h) => h.id === "musculation")?.done || false;
  const score = todayDone ? 100 : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sport</h1>
        <p className="text-sm text-muted-foreground">
          Jours : Lun, Mar, Jeu, Ven
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5 flex flex-col items-center">
          <ScoreRing score={score} size={100} label="Aujourd'hui" />
        </motion.div>
        <ModuleCard title="Séances / mois" value={seancesMois} icon={<Calendar className="h-4 w-4" />} delay={0.1} />
        <ModuleCard title="Streak Sport" value={`${sportStreak}j`} icon={<Dumbbell className="h-4 w-4" />} delay={0.15} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl p-5 space-y-4"
      >
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Métriques</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Poids (kg)</Label>
            <Input
              value={sportMetrics.poids}
              onChange={(e) => setSportMetrics({ ...sportMetrics, poids: e.target.value })}
              className="bg-muted border-border"
              placeholder="75"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tour taille (cm)</Label>
            <Input
              value={sportMetrics.tourTaille}
              onChange={(e) => setSportMetrics({ ...sportMetrics, tourTaille: e.target.value })}
              className="bg-muted border-border"
              placeholder="82"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Calories</Label>
            <Input
              value={sportMetrics.calories}
              onChange={(e) => setSportMetrics({ ...sportMetrics, calories: e.target.value })}
              className="bg-muted border-border"
              placeholder="2200"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
