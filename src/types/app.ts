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

export interface Task {
  id: string;
  title: string;
  done: boolean;
  date: string;
}

export interface ProductivityEntry {
  date: string;
  tasks: Task[];
  deepWorkMinutes: number;
  formationMinutes: number;
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
}

export type Level = "Elite" | "Discipliné" | "Stable" | "Faible";

export function getLevel(score: number): Level {
  if (score >= 90) return "Elite";
  if (score >= 75) return "Discipliné";
  if (score >= 60) return "Stable";
  return "Faible";
}

export const DEFAULT_HABITS: Omit<HabitEntry, "done">[] = [
  { id: "no-screen-lunch", label: "Pas écran déjeuner", weight: 1 },
  { id: "no-screen-transport", label: "Pas écran transport", weight: 1 },
  { id: "first-hour-focus", label: "Première heure concentration", weight: 1.5 },
  { id: "focus-1", label: "Focus 1", weight: 1 },
  { id: "focus-2", label: "Focus 2", weight: 1 },
  { id: "focus-3", label: "Focus 3", weight: 1 },
  { id: "walk-20", label: "20 minutes marche", weight: 1 },
  { id: "podcast", label: "Podcast", weight: 0.5 },
  { id: "article", label: "Lire article", weight: 0.5 },
  { id: "musculation", label: "Musculation", weight: 1.5 },
  { id: "calories", label: "Calories respectées", weight: 1 },
  { id: "no-phone-excess", label: "Pas téléphone excessif", weight: 1 },
  { id: "no-late-sleep", label: "Pas dormir tard", weight: 1 },
  { id: "no-lie", label: "Pas mentir", weight: 0.5 },
  { id: "no-screen-before-sleep", label: "Pas écran 45 min avant sommeil", weight: 1 },
];

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
};
