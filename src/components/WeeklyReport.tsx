import { motion } from "framer-motion";
import {
  Trophy, TrendingDown, Smartphone, Dumbbell, Wallet, BarChart3, Calendar, Utensils, TrendingUp, ArrowDown,
} from "lucide-react";
import type {
  DayHabits, DayPrayers, SleepEntry, ScreenEntry, ProductivityEntry, Expense, AppSettings,
} from "@/types/app";
import { useWorkoutSessions, useCalories } from "@/hooks/useSupabaseData";

interface WeeklyReportProps {
  habitsData: Record<string, DayHabits>;
  prayersData: Record<string, DayPrayers>;
  sleepData: Record<string, SleepEntry>;
  screenData: Record<string, ScreenEntry>;
  productivityData: Record<string, ProductivityEntry>;
  expenses: Expense[];
  settings: AppSettings;
  computeHabitScore: (day: DayHabits | undefined) => number;
  computePrayerScore: (day: DayPrayers | undefined) => number;
  computeSleepScore: (entry: SleepEntry | undefined, settings: AppSettings) => number;
  computeScreenScore: (entry: ScreenEntry | undefined, settings: AppSettings) => number;
  computeProductivityScore: (entry: ProductivityEntry | undefined) => number;
}

function getWeekDates(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

export function WeeklyReport({
  habitsData, prayersData, sleepData, screenData, productivityData, expenses, settings,
  computeHabitScore, computePrayerScore, computeSleepScore, computeScreenScore, computeProductivityScore,
}: WeeklyReportProps) {
  const { sessions } = useWorkoutSessions();
  const { caloriesData } = useCalories();
  const weekDates = getWeekDates();
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  // Daily scores
  const dailyScores = weekDates.map((date) => {
    const w = settings.weights;
    const totalW = w.priere + w.finances + w.habitudes + w.sport + w.productivite + w.sommeil + w.ecran;
    const hScore = computeHabitScore(habitsData[date]);
    const pScore = computePrayerScore(prayersData[date]);
    const slScore = computeSleepScore(sleepData[date], settings);
    const scScore = computeScreenScore(screenData[date], settings);
    const prScore = computeProductivityScore(productivityData[date]);
    const spScore = habitsData[date]?.habits.find((h) => h.id === "musculation")?.done ? 100 : 0;
    const global = Math.round(
      (pScore * w.priere + hScore * w.habitudes + spScore * w.sport + prScore * w.productivite + slScore * w.sommeil + scScore * w.ecran) / totalW
    );
    return { date, global, hScore, pScore, slScore, scScore, prScore, spScore };
  });

  const filledDays = dailyScores.filter((d) => d.global > 0);
  const avgScore = filledDays.length > 0
    ? Math.round(filledDays.reduce((s, d) => s + d.global, 0) / filledDays.length)
    : 0;

  // Best & weakest habit
  const habitMap: Record<string, { done: number; total: number; label: string }> = {};
  weekDates.forEach((date) => {
    const day = habitsData[date];
    if (!day) return;
    day.habits.forEach((h) => {
      if (!habitMap[h.id]) habitMap[h.id] = { done: 0, total: 0, label: h.label };
      habitMap[h.id].total++;
      if (h.done) habitMap[h.id].done++;
    });
  });
  const habitEntries = Object.values(habitMap).filter((h) => h.total >= 2);
  const bestHabit = habitEntries.length > 0
    ? habitEntries.reduce((a, b) => (a.done / a.total > b.done / b.total ? a : b))
    : null;
  const worstHabit = habitEntries.length > 0
    ? habitEntries.reduce((a, b) => (a.done / a.total < b.done / b.total ? a : b))
    : null;

  // Screen time
  const totalScreenMinutes = weekDates.reduce((s, date) => s + (screenData[date]?.tempsTotal || 0), 0);
  const avgScreenMinutes = filledDays.length > 0 ? Math.round(totalScreenMinutes / 7) : 0;
  const screenHours = Math.floor(avgScreenMinutes / 60);
  const screenMins = avgScreenMinutes % 60;

  // Workout sessions this week
  const weekSessions = sessions.filter((s) => s.date >= weekStart && s.date <= weekEnd && s.completed);

  // Finances this week
  const weekExpenses = expenses.filter((e) => e.date >= weekStart && e.date <= weekEnd);
  const totalSpent = weekExpenses.reduce((s, e) => s + e.amount, 0);

  // Calories this week
  const weekCalories = weekDates.map((date) => {
    const entries = caloriesData[date] || [];
    return { date, total: entries.reduce((s: number, e: any) => s + (e.calories || 0), 0) };
  });
  const daysWithCalories = weekCalories.filter((d) => d.total > 0);
  const totalCaloriesWeek = weekCalories.reduce((s, d) => s + d.total, 0);
  const avgCalories = daysWithCalories.length > 0
    ? Math.round(totalCaloriesWeek / daysWithCalories.length)
    : 0;
  const highestCalDay = daysWithCalories.length > 0
    ? daysWithCalories.reduce((a, b) => (a.total > b.total ? a : b))
    : null;
  const lowestCalDay = daysWithCalories.length > 0
    ? daysWithCalories.reduce((a, b) => (a.total < b.total ? a : b))
    : null;

  const isSunday = new Date().getDay() === 0;

  const formatDayShort = (date: string) =>
    new Date(date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });

  const statItems = [
    {
      icon: <BarChart3 className="h-4 w-4 text-primary" />,
      label: "Score moyen",
      value: `${avgScore}/100`,
      sub: `${filledDays.length} jours remplis`,
    },
    {
      icon: <Trophy className="h-4 w-4 text-warning" />,
      label: "Meilleure habitude",
      value: bestHabit ? bestHabit.label : "—",
      sub: bestHabit ? `${Math.round((bestHabit.done / bestHabit.total) * 100)}% de réussite` : "",
    },
    {
      icon: <TrendingDown className="h-4 w-4 text-destructive" />,
      label: "Habitude la plus faible",
      value: worstHabit ? worstHabit.label : "—",
      sub: worstHabit ? `${Math.round((worstHabit.done / worstHabit.total) * 100)}% de réussite` : "",
    },
    {
      icon: <Smartphone className="h-4 w-4 text-secondary" />,
      label: "Temps écran / jour",
      value: `${screenHours}h${screenMins.toString().padStart(2, "0")}`,
      sub: `${Math.round(totalScreenMinutes / 60)}h total semaine`,
    },
    {
      icon: <Dumbbell className="h-4 w-4 text-primary" />,
      label: "Séances sport",
      value: `${weekSessions.length}`,
      sub: `sur ${settings.joursSport?.length || 4} prévues`,
    },
    {
      icon: <Wallet className="h-4 w-4 text-warning" />,
      label: "Dépenses semaine",
      value: `${totalSpent.toLocaleString()} MAD`,
      sub: weekExpenses.length > 0
        ? `${weekExpenses.length} transactions`
        : "Aucune dépense",
    },
    {
      icon: <Utensils className="h-4 w-4 text-primary" />,
      label: "Moyenne calorique",
      value: avgCalories > 0 ? `${avgCalories} kcal` : "—",
      sub: avgCalories > 0 ? `${totalCaloriesWeek.toLocaleString()} kcal total` : "Aucune donnée",
    },
    {
      icon: <TrendingUp className="h-4 w-4 text-warning" />,
      label: "Jour + élevé (cal)",
      value: highestCalDay ? `${highestCalDay.total} kcal` : "—",
      sub: highestCalDay ? formatDayShort(highestCalDay.date) : "",
    },
    {
      icon: <ArrowDown className="h-4 w-4 text-secondary" />,
      label: "Jour + faible (cal)",
      value: lowestCalDay ? `${lowestCalDay.total} kcal` : "—",
      sub: lowestCalDay ? formatDayShort(lowestCalDay.date) : "",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card rounded-xl p-5 border border-primary/20"
    >
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Rapport Hebdomadaire
        </h3>
        {isSunday && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
            Nouveau
          </span>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground mb-4">
        Semaine du {new Date(weekStart).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} au{" "}
        {new Date(weekEnd).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {statItems.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55 + i * 0.05 }}
            className="rounded-lg bg-accent/50 p-3 space-y-1"
          >
            <div className="flex items-center gap-1.5">
              {item.icon}
              <span className="text-[10px] text-muted-foreground truncate">{item.label}</span>
            </div>
            <div className="text-sm font-bold text-foreground truncate">{item.value}</div>
            {item.sub && <div className="text-[10px] text-muted-foreground truncate">{item.sub}</div>}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
