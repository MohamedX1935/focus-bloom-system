import { useLocalStorage, getTodayKey } from "@/hooks/useLocalStorage";
import { DEFAULT_HABITS, DEFAULT_SETTINGS, PRAYER_NAMES, type DayHabits, type DayPrayers, type AppSettings } from "@/types/app";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from "recharts";

export default function Statistiques() {
  const [habitsData] = useLocalStorage<Record<string, DayHabits>>("discipline-habits", {});
  const [prayersData] = useLocalStorage<Record<string, DayPrayers>>("discipline-prayers", {});

  // Last 30 days
  const days30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().split("T")[0];
    const habits = habitsData[key];
    const prayers = prayersData[key];

    const habitScore = habits
      ? Math.round((habits.habits.filter(h => h.done).reduce((s, h) => s + h.weight, 0) / habits.habits.reduce((s, h) => s + h.weight, 0)) * 100)
      : 0;
    const prayerScore = prayers ? Math.round((prayers.prayers.filter(p => p.done).length / 5) * 100) : 0;

    return {
      date: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      habitudes: habitScore,
      priere: prayerScore,
      global: Math.round((habitScore + prayerScore) / 2),
    };
  });

  const avgScore = Math.round(days30.reduce((s, d) => s + d.global, 0) / 30);

  // Best streak
  let bestStreak = 0;
  let current = 0;
  for (const d of days30) {
    if (d.global >= 60) {
      current++;
      bestStreak = Math.max(bestStreak, current);
    } else {
      current = 0;
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground">Statistiques</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-foreground">{avgScore}</div>
          <div className="text-xs text-muted-foreground">Score moyen 30j</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-foreground">{bestStreak}j</div>
          <div className="text-xs text-muted-foreground">Meilleur streak</div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Score global – 30 jours</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={days30}>
            <defs>
              <linearGradient id="globalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(152 60% 42%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(152 60% 42%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "hsl(220 10% 55%)" }} interval={4} />
            <YAxis domain={[0, 100]} hide />
            <Tooltip contentStyle={{ background: "hsl(220 15% 10%)", border: "1px solid hsl(220 15% 16%)", borderRadius: "8px", fontSize: 12, color: "hsl(220 10% 92%)" }} />
            <Area type="monotone" dataKey="global" stroke="hsl(152 60% 42%)" fill="url(#globalGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Habitudes vs Prière</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={days30.slice(-14)}>
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "hsl(220 10% 55%)" }} />
            <YAxis domain={[0, 100]} hide />
            <Tooltip contentStyle={{ background: "hsl(220 15% 10%)", border: "1px solid hsl(220 15% 16%)", borderRadius: "8px", fontSize: 12, color: "hsl(220 10% 92%)" }} />
            <Bar dataKey="habitudes" fill="hsl(152 60% 42%)" radius={[3, 3, 0, 0]} name="Habitudes" />
            <Bar dataKey="priere" fill="hsl(215 70% 50%)" radius={[3, 3, 0, 0]} name="Prière" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
