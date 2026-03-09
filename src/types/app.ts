export interface HabitEntry {
  id: string;
  label: string;
  done: boolean;
  weight: number;
}

export interface DayHabits {
  date: string; // YYYY-MM-DD
  habits: HabitEntry[];
}

export interface PrayerEntry {
  name: string;
  done: boolean;
}

export interface DayPrayers {
  date: string;
  prayers: PrayerEntry[];
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
}

export type ExpenseCategory =
  | "transport"
  | "nourriture"
  | "internet"
  | "famille"
  | "sport"
  | "sante"
  | "formation"
  | "loisirs";

export interface FinanceConfig {
  revenuMoyen: number;
  revenuReel: number;
  objectifEpargne: number;
  budgets: Record<ExpenseCategory, number>;
}

export interface SleepEntry {
  date: string;
  heureCoucher: string; // HH:MM
  heureReveil: string;
  reveilNocturne: boolean;
}

export interface ScreenEntry {
  date: string;
  tempsTotal: number; // minutes
  tempsProductif: number;
  tempsNeutre: number;
  tempsDopamine: number;
}

export type TaskPriority = "basse" | "moyenne" | "haute";
export type SessionType = "formation" | "academique" | "deep-work";

export interface Task {
  id: string;
  title: string;
  done: boolean;
  date: string;
  priority: TaskPriority;
  sessionId?: string; // linked to a session
}

export interface ProductivitySession {
  id: string;
  date: string;
  type: SessionType;
  durationMinutes: number;
  completed: boolean;
  taskIds: string[]; // tasks assigned to this session
}

export interface ProductivityEntry {
  date: string;
  tasks: Task[];
  sessions: ProductivitySession[];
}

export interface Goal {
  id: string;
  title: string;
  trimester: 1 | 2 | 3 | 4;
  progress: number; // 0-100
}

// ─── Training Program Types ───
export interface ExerciseTemplate {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  notes: string;
  imageUrl?: string;
  muscleGroup: MuscleGroup;
}

export type MuscleGroup =
  | "poitrine"
  | "dos"
  | "epaules"
  | "biceps"
  | "triceps"
  | "jambes"
  | "abdos"
  | "mollets"
  | "avant-bras"
  | "fessiers";

export interface TrainingDay {
  id: string;
  label: string; // ex: "Push A"
  dayOfWeek: number; // 0-6
  exercises: ExerciseTemplate[];
}

export interface TrainingProgram {
  id: string;
  name: string;
  days: TrainingDay[];
  createdAt: string;
  active: boolean;
}

export interface SessionSet {
  setNumber: number;
  reps: number;
  weight: number;
  done: boolean;
}

export interface SessionExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  sets: SessionSet[];
  comment?: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  programId: string;
  dayId: string;
  exercises: SessionExercise[];
  completed: boolean;
}

// ─── Screen Classification Types ───
export type AppCategory = "productivite" | "neutre" | "dopamine";

export interface AppClassification {
  appName: string;
  category: AppCategory;
  isManual: boolean; // user-corrected
}

export interface ScreenAppEntry {
  appName: string;
  minutes: number;
  category: AppCategory;
}

export interface DayScreenData {
  date: string;
  apps: ScreenAppEntry[];
  totalMinutes: number;
  productifMinutes: number;
  neutreMinutes: number;
  dopamineMinutes: number;
}

export const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
  { value: "poitrine", label: "Poitrine" },
  { value: "dos", label: "Dos" },
  { value: "epaules", label: "Épaules" },
  { value: "biceps", label: "Biceps" },
  { value: "triceps", label: "Triceps" },
  { value: "jambes", label: "Jambes" },
  { value: "abdos", label: "Abdos" },
  { value: "mollets", label: "Mollets" },
  { value: "avant-bras", label: "Avant-bras" },
  { value: "fessiers", label: "Fessiers" },
];

export type DayType = "travail" | "repos";

export interface ScoreWeights {
  priere: number;
  finances: number;
  habitudes: number;
  sport: number;
  productivite: number;
  sommeil: number;
  ecran: number;
}

export interface AppSettings {
  weights: ScoreWeights;
  financeConfig: FinanceConfig;
  limiteEcran: number; // minutes
  joursSport: number[]; // 0=dim, 1=lun...
  heuresSommeilOptimales: [number, number]; // [min, max]
  /** Default day type per weekday (0=dim..6=sam) */
  defaultDayTypes: Record<number, DayType>;
  /** Override day type for specific dates (YYYY-MM-DD -> type) */
  dayTypeOverrides: Record<string, DayType>;
  /** Objectif calorique journalier (kcal) */
  objectifCalories: number;
}

export type Level = "Elite" | "Discipliné" | "Stable" | "Faible";

export function getLevel(score: number): Level {
  if (score >= 90) return "Elite";
  if (score >= 75) return "Discipliné";
  if (score >= 60) return "Stable";
  return "Faible";
}

/** Habitudes pour les jours de TRAVAIL (musculation gérée dynamiquement) */
export const WORK_HABITS: Omit<HabitEntry, "done">[] = [
  { id: "no-screen-lunch", label: "Pas écran déjeuner", weight: 1 },
  { id: "no-screen-transport", label: "Pas écran transport", weight: 1 },
  { id: "first-hour-focus", label: "Première heure concentration", weight: 1.5 },
  { id: "focus-1", label: "Focus 1", weight: 1 },
  { id: "focus-2", label: "Focus 2", weight: 1 },
  { id: "focus-3", label: "Focus 3", weight: 1 },
  { id: "walk-20", label: "20 minutes marche", weight: 1 },
  { id: "podcast", label: "Podcast", weight: 0.5 },
  { id: "article", label: "Lire article", weight: 0.5 },
  { id: "calories", label: "Calories respectées", weight: 1 },
  { id: "no-phone-excess", label: "Pas téléphone excessif", weight: 1 },
  { id: "no-late-sleep", label: "Pas dormir tard", weight: 1 },
  { id: "no-lie", label: "Pas mentir", weight: 0.5 },
  { id: "no-screen-before-sleep", label: "Pas écran 45 min avant sommeil", weight: 1 },
];

/** Habitude musculation ajoutée dynamiquement */
export const MUSCULATION_HABIT: Omit<HabitEntry, "done"> = {
  id: "musculation", label: "Musculation", weight: 1.5,
};

/** Habitudes pour les jours de REPOS */
export const REST_HABITS: Omit<HabitEntry, "done">[] = [
  { id: "wake-before-9", label: "Se réveiller avant 9h", weight: 1.5 },
  { id: "no-phone-bed", label: "Pas de téléphone au lit", weight: 1 },
  { id: "breakfast-no-screen", label: "Petit-déjeuner riche (sans écrans)", weight: 1 },
  { id: "deep-work-1h", label: "1h travail profond (projets perso)", weight: 1.5 },
  { id: "review-lessons", label: "Révision des leçons", weight: 1 },
  { id: "change-env", label: "Changer d'environnement (sortie)", weight: 1 },
  { id: "limit-social-45", label: "Limiter réseaux sociaux à 45 min", weight: 1 },
  { id: "meal-prep", label: "Préparer les repas de la semaine", weight: 0.5 },
  { id: "no-screen-before-sleep", label: "Pas d'écran 45 min avant coucher", weight: 1 },
  { id: "games-after-16", label: "Jeux et divertissements après 16h", weight: 0.5 },
];

/** Backward compat alias */
export const DEFAULT_HABITS = WORK_HABITS;

/** Get the day type for a given date based on settings */
export function getDayType(date: string, settings: AppSettings): DayType {
  // Check overrides first
  if (settings.dayTypeOverrides?.[date]) return settings.dayTypeOverrides[date];
  // Then check default per weekday
  const dayOfWeek = new Date(date + "T12:00:00").getDay(); // 0=dim
  return settings.defaultDayTypes?.[dayOfWeek] ?? (dayOfWeek === 0 || dayOfWeek === 6 ? "repos" : "travail");
}

/** Get habits for a specific date based on day type and musculation schedule */
export function getHabitsForDate(date: string, settings: AppSettings): Omit<HabitEntry, "done">[] {
  const dayType = getDayType(date, settings);
  if (dayType === "repos") return REST_HABITS;
  // Travail: add musculation if it's a training day
  const dayOfWeek = new Date(date + "T12:00:00").getDay();
  const joursSport = settings.joursSport ?? [1, 2, 4, 5];
  const habits = [...WORK_HABITS];
  if (joursSport.includes(dayOfWeek)) {
    // Insert musculation after "article" (index 8) or at end
    const insertIdx = habits.findIndex(h => h.id === "calories");
    if (insertIdx >= 0) habits.splice(insertIdx, 0, MUSCULATION_HABIT);
    else habits.push(MUSCULATION_HABIT);
  }
  return habits;
}

export const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "transport", label: "Transport" },
  { value: "nourriture", label: "Nourriture" },
  { value: "internet", label: "Internet" },
  { value: "famille", label: "Famille" },
  { value: "sport", label: "Sport" },
  { value: "sante", label: "Santé" },
  { value: "formation", label: "Formation" },
  { value: "loisirs", label: "Loisirs" },
];

export const DEFAULT_SETTINGS: AppSettings = {
  weights: {
    priere: 25,
    finances: 20,
    habitudes: 18,
    sport: 12,
    productivite: 10,
    sommeil: 8,
    ecran: 7,
  },
  financeConfig: {
    revenuMoyen: 8000,
    revenuReel: 8000,
    objectifEpargne: 30,
    budgets: {
      transport: 800,
      nourriture: 2000,
      internet: 200,
      famille: 1500,
      sport: 300,
      sante: 300,
      formation: 500,
      loisirs: 400,
    },
  },
  limiteEcran: 420,
  joursSport: [1, 2, 4, 5], // lun, mar, jeu, ven
  heuresSommeilOptimales: [7, 8],
  defaultDayTypes: {
    0: "repos",   // Dimanche
    1: "travail", // Lundi
    2: "travail", // Mardi
    3: "travail", // Mercredi
    4: "travail", // Jeudi
    5: "travail", // Vendredi
    6: "repos",   // Samedi
  },
  dayTypeOverrides: {},
  objectifCalories: 2800,
};
