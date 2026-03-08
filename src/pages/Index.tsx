import { useHabits, usePrayers, useSleep, useScreen, useProductivity, useExpenses, useSettings } from "@/hooks/useSupabaseData";
import { ScoreRing } from "@/components/ScoreRing";
import { ModuleCard } from "@/components/ModuleCard";
import {
  DEFAULT_HABITS,
  PRAYER_NAMES,
  getLevel,
  type DayHabits,
  type DayPrayers,
  type SleepEntry,
  type ScreenEntry,
  type ProductivityEntry,
  type Expense,
  type AppSettings,
} from "@/types/app";
import {
  CheckSquare, Moon, Dumbbell, Wallet, BedDouble, Smartphone, Brain, Flame, TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function computeHabitScore(day: DayHabits | undefined): number {
  if (!day) return 0;
  const totalWeight = day.habits.reduce((s, h) => s + h.weight, 0);
  const doneWeight = day.habits.filter((h) => h.done).reduce((s, h) => s + h.weight, 0);
  return totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0;
}

function computePrayerScore(day: DayPrayers | undefined): number {
  if (!day) return 0;
  const done = day.prayers.filter((p) => p.done).length;
  return Math.round((done / 5) * 100);
}

function computeSleepScore(entry: SleepEntry | undefined, settings: AppSettings): number {
  if (!entry || !entry.heureCoucher || !entry.heureReveil) return 0;
  const [hC, mC] = entry.heureCoucher.split(":").map(Number);
  const [hR, mR] = entry.heureReveil.split(":").map(Number);
  let coucher = hC * 60 + mC;
  let reveil = hR * 60 + mR;
  if (reveil < coucher) reveil += 24 * 60;
  let duration = (reveil - coucher) / 60;
  if (entry.reveilNocturne) duration -= 0.5;
  const [min, max] = settings.heuresSommeilOptimales;
  if (duration >= min && duration <= max) return 100;
  if (duration < min) return Math.max(0, Math.round((duration / min) * 100));
  return Math.max(0, Math.round(100 - (duration - max) * 20));
}

function computeScreenScore(entry: ScreenEntry | undefined, settings: AppSettings): number {
  if (!entry) return 0;
  const { tempsProductif, tempsDopamine, tempsTotal } = entry;
  if (tempsTotal === 0) return 100;
  const ratio = (tempsProductif - tempsDopamine) / tempsTotal;
  const timeScore = Math.max(0, 100 - Math.max(0, tempsTotal - settings.limiteEcran) * 0.5);
  return Math.round(Math.max(0, Math.min(100, 50 + ratio * 50 + (timeScore - 50) * 0.5)));
}

function computeProductivityScore(entry: ProductivityEntry | undefined): number {
  if (!entry) return 0;
  const tasksDone = entry.tasks.filter((t) => t.done).length;
  const tasksTotal = entry.tasks.length || 1;
  const taskScore = (tasksDone / tasksTotal) * 60;
  const deepScore = Math.min(40, (entry.deepWorkMinutes / 120) * 40);
  return Math.round(taskScore + deepScore);
}

function computeFinanceScore(expenses: Expense[], settings: AppSettings, monthKey: string): number {
  const totalSpent = expenses.filter(e => e.date.startsWith(monthKey)).reduce((s, e) => s + e.amount, 0);
  const budget = Object.values(settings.financeConfig.budgets).reduce((s, v) => s + v, 0);
  if (budget === 0) return 100;
  const ratio = totalSpent / budget;
  return Math.round(Math.max(0, Math.min(100, (1 - ratio) * 100 + 30)));
}

export default function Dashboard() {
  const today = getTodayKey();
  const { settings } = useSettings();
  const { habitsData } = useHabits();
  const { prayersData } = usePrayers();
  const { sleepData } = useSleep();
  const { screenData } = useScreen();
  const { productivityData } = useProductivity();
  const { expenses } = useExpenses();

  const habitScore = computeHabitScore(habitsData[today]);
  const prayerScore = computePrayerScore(prayersData[today]);
  const sleepScore = computeSleepScore(sleepData[today], settings);
  const screenScore = computeScreenScore(screenData[today], settings);
  const prodScore = computeProductivityScore(productivityData[today]);
  const financeScore = computeFinanceScore(expenses, settings, today.substring(0, 7));
  const sportScore = habitsData[today]?.habits.find((h) => h.id === "musculation")?.done ? 100 : 0;

  const w = settings.weights;
  const totalW = w.priere + w.finances + w.habitudes + w.sport + w.productivite + w.sommeil + w.ecran;
  const globalScore = Math.round(
    (prayerScore * w.priere + financeScore * w.finances + habitScore * w.habitudes + sportScore * w.sport + prodScore * w.productivite + sleepScore * w.sommeil + screenScore * w.ecran) / totalW
  );

  const level = getLevel(globalScore);

  const computeStreak = (data: Record<string, any>, checkFn: (entry: any) => boolean) => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().split("T")[0];
      if (data[key] && checkFn(data[key])) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return streak;
  };

  const streakGlobal = computeStreak(habitsData, (e: DayHabits) =>
    e.habits.filter((h) => h.done).length >= e.habits.length * 0.6
  );
  const streakPriere = computeStreak(prayersData, (e: DayPrayers) =>
    e.prayers.filter((p) => p.done).length === 5
  );

  const monthExpenses = expenses
    .filter((e) => e.date.startsWith(today.substring(0, 7)))
    .reduce((s, e) => s + e.amount, 0);
  const argentRestant = settings.financeConfig.revenuReel - monthExpenses;

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    const hScore = computeHabitScore(habitsData[key]);
    const pScore = computePrayerScore(prayersData[key]);
    return {
      day: d.toLocaleDateString("fr-FR", { weekday: "short" }),
      score: Math.round((hScore + pScore) / 2),
    };
  });

  const modules = [
    { title: "Prière", score: prayerScore, icon: <Moon className="h-4 w-4" /> },
    { title: "Habitudes", score: habitScore, icon: <CheckSquare className="h-4 w-4" /> },
    { title: "Sport", score: sportScore, icon: <Dumbbell className="h-4 w-4" /> },
    { title: "Finances", score: financeScore, icon: <Wallet className="h-4 w-4" /> },
    { title: "Sommeil", score: sleepScore, icon: <BedDouble className="h-4 w-4" /> },
    { title: "Écran", score: screenScore, icon: <Smartphone className="h-4 w-4" /> },
    { title: "Productivité", score: prodScore, icon: <Brain className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent border border-border/50">
          <span className="text-xs font-medium text-muted-foreground">Niveau</span>
          <span className={`text-sm font-bold ${level === "Elite" ? "text-success" : level === "Discipliné" ? "text-secondary" : level === "Stable" ? "text-warning" : "text-destructive"}`}>{level}</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="glass-card rounded-xl p-6 flex flex-col items-center justify-center md:col-span-1">
          <ScoreRing score={globalScore} size={140} label="Score Global" />
        </motion.div>
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ModuleCard title="Streak" value={`${streakGlobal}j`} icon={<Flame className="h-4 w-4" />} delay={0.1} />
          <ModuleCard title="Streak Prière" value={`${streakPriere}j`} icon={<Moon className="h-4 w-4" />} delay={0.15} />
          <ModuleCard title="Restant" value={`${argentRestant.toLocaleString()} MAD`} icon={<Wallet className="h-4 w-4" />} delay={0.2} />
          <ModuleCard title="Tendance" value={weekData.length > 1 ? (weekData[6].score >= weekData[5].score ? "↑" : "↓") : "—"} icon={<TrendingUp className="h-4 w-4" />} delay={0.25} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {modules.map((m, i) => (
          <motion.div key={m.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="glass-card rounded-xl p-4 flex items-center gap-3">
            <ScoreRing score={m.score} size={48} strokeWidth={4} />
            <div>
              <div className="text-xs text-muted-foreground">{m.title}</div>
              <div className="text-lg font-bold text-foreground">{m.score}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Équilibre de vie</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={[
              { subject: "Prière", score: prayerScore },
              { subject: "Sport", score: sportScore },
              { subject: "Productivité", score: prodScore },
              { subject: "Sommeil", score: sleepScore },
              { subject: "Habitudes", score: habitScore },
              { subject: "Écran", score: screenScore },
            ]}>
              <PolarGrid stroke="hsl(220 15% 20%)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} />
              <Radar name="Score" dataKey="score" stroke="hsl(152 60% 42%)" fill="hsl(152 60% 42%)" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Tendance Semaine</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={weekData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152 60% 42%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(152 60% 42%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} />
              <YAxis domain={[0, 100]} hide />
              <Tooltip contentStyle={{ background: "hsl(220 15% 10%)", border: "1px solid hsl(220 15% 16%)", borderRadius: "8px", fontSize: 12, color: "hsl(220 10% 92%)" }} />
              <Area type="monotone" dataKey="score" stroke="hsl(152 60% 42%)" fill="url(#scoreGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
