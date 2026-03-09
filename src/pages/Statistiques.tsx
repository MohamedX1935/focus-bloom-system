import { useState, useMemo } from "react";
import { useHabits, usePrayers, useSleep, useScreen, useProductivity, useExpenses, useSettings } from "@/hooks/useSupabaseData";
import { type DayHabits, type DayPrayers, type AppSettings, type SleepEntry, type ScreenEntry, type ProductivityEntry, type Expense, getLevel } from "@/types/app";
import { computeProductivityScore } from "@/lib/productivityScoring";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

function computeDayGlobalScore(
  key: string,
  habitsData: Record<string, DayHabits>,
  prayersData: Record<string, DayPrayers>,
  sleepData: Record<string, SleepEntry>,
  screenData: Record<string, ScreenEntry>,
  productivityData: Record<string, ProductivityEntry>,
  expenses: Expense[],
  settings: AppSettings
): number {
  const habits = habitsData[key];
  const prayers = prayersData[key];
  const sleep = sleepData[key];
  const screen = screenData[key];
  const prod = productivityData[key];

  const habitScore = habits
    ? Math.round((habits.habits.filter(h => h.done).reduce((s, h) => s + h.weight, 0) / habits.habits.reduce((s, h) => s + h.weight, 0)) * 100)
    : 0;
  const prayerScore = prayers ? Math.round((prayers.prayers.filter(p => p.done).length / 5) * 100) : 0;

  let sleepScore = 0;
  if (sleep && sleep.heureCoucher && sleep.heureReveil) {
    const [hC, mC] = sleep.heureCoucher.split(":").map(Number);
    const [hR, mR] = sleep.heureReveil.split(":").map(Number);
    let coucher = hC * 60 + mC;
    let reveil = hR * 60 + mR;
    if (reveil < coucher) reveil += 24 * 60;
    let duration = (reveil - coucher) / 60;
    if (sleep.reveilNocturne) duration -= 0.5;
    const [min, max] = settings.heuresSommeilOptimales;
    if (duration >= min && duration <= max) sleepScore = 100;
    else if (duration < min) sleepScore = Math.max(0, Math.round((duration / min) * 100));
    else sleepScore = Math.max(0, Math.round(100 - (duration - max) * 20));
  }

  let screenScore = 0;
  if (screen) {
    const { tempsProductif, tempsDopamine, tempsTotal } = screen;
    if (tempsTotal === 0) screenScore = 100;
    else {
      const ratio = (tempsProductif - tempsDopamine) / tempsTotal;
      const timeScore = Math.max(0, 100 - Math.max(0, tempsTotal - settings.limiteEcran) * 0.5);
      screenScore = Math.round(Math.max(0, Math.min(100, 50 + ratio * 50 + (timeScore - 50) * 0.5)));
    }
  }

  let prodScore = 0;
  if (prod) {
    const { computeProductivityScore } = await import("@/lib/productivityScoring");
    prodScore = computeProductivityScore(prod);
  }

  const monthKey = key.substring(0, 7);
  const totalSpent = expenses.filter(e => e.date.startsWith(monthKey)).reduce((s, e) => s + e.amount, 0);
  const budget = Object.values(settings.financeConfig.budgets).reduce((s, v) => s + v, 0);
  const financeScore = budget === 0 ? 100 : Math.round(Math.max(0, Math.min(100, (1 - totalSpent / budget) * 100 + 30)));

  const sportScore = habits?.habits.find(h => h.id === "musculation")?.done ? 100 : 0;

  const w = settings.weights;
  const totalW = w.priere + w.finances + w.habitudes + w.sport + w.productivite + w.sommeil + w.ecran;
  return Math.round(
    (prayerScore * w.priere + financeScore * w.finances + habitScore * w.habitudes + sportScore * w.sport + prodScore * w.productivite + sleepScore * w.sommeil + screenScore * w.ecran) / totalW
  );
}

export default function Statistiques() {
  const { settings } = useSettings();
  const { habitsData } = useHabits();
  const { prayersData } = usePrayers();
  const { sleepData } = useSleep();
  const { screenData } = useScreen();
  const { productivityData } = useProductivity();
  const { expenses } = useExpenses();
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const scoresMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 0; i < 90; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      map[key] = computeDayGlobalScore(key, habitsData, prayersData, sleepData, screenData, productivityData, expenses, settings);
    }
    return map;
  }, [habitsData, prayersData, sleepData, screenData, productivityData, expenses, settings]);

  const selectedScore = selectedDate ? scoresMap[selectedDate.toISOString().split("T")[0]] : undefined;

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
      global: scoresMap[key] || 0,
    };
  });

  const avgScore = Math.round(days30.reduce((s, d) => s + d.global, 0) / 30);

  let bestStreak = 0;
  let current = 0;
  for (const d of days30) {
    if (d.global >= 60) { current++; bestStreak = Math.max(bestStreak, current); } else { current = 0; }
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

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Calendrier des scores</h3>
        <div className="flex flex-col items-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            className="p-0 pointer-events-auto"
            disabled={(date) => date > new Date()}
            modifiers={{
              elite: (date) => { const k = date.toISOString().split("T")[0]; return (scoresMap[k] ?? 0) >= 90; },
              discipline: (date) => { const k = date.toISOString().split("T")[0]; const s = scoresMap[k] ?? 0; return s >= 75 && s < 90; },
              stable: (date) => { const k = date.toISOString().split("T")[0]; const s = scoresMap[k] ?? 0; return s >= 60 && s < 75; },
              faible: (date) => { const k = date.toISOString().split("T")[0]; const s = scoresMap[k] ?? 0; return s > 0 && s < 60; },
            }}
            modifiersClassNames={{
              elite: "!bg-success !text-success-foreground font-bold",
              discipline: "!bg-secondary !text-secondary-foreground font-semibold",
              stable: "!bg-warning !text-warning-foreground",
              faible: "!bg-destructive !text-destructive-foreground",
            }}
          />
          <div className="flex flex-wrap gap-3 mt-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-success" /> Elite (90+)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-secondary" /> Discipliné (75+)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-warning" /> Stable (60+)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-destructive" /> Faible (&lt;60)</span>
          </div>
          {selectedDate && selectedScore !== undefined && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-center">
              <span className="text-xs text-muted-foreground">{selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span>
              <div className={cn("text-2xl font-bold mt-1", selectedScore >= 75 ? "text-success" : selectedScore >= 60 ? "text-warning" : "text-destructive")}>{selectedScore}</div>
              <span className="text-[10px] text-muted-foreground">{getLevel(selectedScore)}</span>
            </motion.div>
          )}
        </div>
      </motion.div>

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
