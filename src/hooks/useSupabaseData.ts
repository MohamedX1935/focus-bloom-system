import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import {
  DEFAULT_HABITS,
  PRAYER_NAMES,
  DEFAULT_SETTINGS,
  type DayHabits,
  type DayPrayers,
  type HabitEntry,
  type PrayerEntry,
  type SleepEntry,
  type ScreenEntry,
  type ScreenAppEntry,
  type ProductivityEntry,
  type Task,
  type Expense,
  type Goal,
  type TrainingProgram,
  type WorkoutSession,
  type AppSettings,
  type AppCategory,
} from "@/types/app";

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

// ─── Realtime helper ───
function useRealtimeInvalidation(tableName: string, queryKey: string[]) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel(`${tableName}-changes`)
      .on("postgres_changes", { event: "*", schema: "public", table: tableName }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tableName, queryClient, queryKey]);
}

// ─── HABITS ───
export function useHabits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["daily_habits"];

  useRealtimeInvalidation("daily_habits", queryKey);

  const { data: habitsData = {}, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return {};
      const { data, error } = await supabase.from("daily_habits").select("*").eq("user_id", user.id);
      if (error) throw error;
      const map: Record<string, DayHabits> = {};
      for (const row of data || []) {
        map[row.date] = { date: row.date, habits: row.habits as unknown as HabitEntry[] };
      }
      return map;
    },
    enabled: !!user,
  });

  const upsertDay = useCallback(async (date: string, habits: HabitEntry[]) => {
    if (!user) return;
    await supabase.from("daily_habits").upsert(
      { user_id: user.id, date, habits: habits as any },
      { onConflict: "user_id,date" }
    );
    queryClient.invalidateQueries({ queryKey });
  }, [user, queryClient]);

  return { habitsData, isLoading, upsertDay };
}

// ─── PRAYERS ───
export function usePrayers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["daily_prayers"];

  useRealtimeInvalidation("daily_prayers", queryKey);

  const { data: prayersData = {}, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return {};
      const { data, error } = await supabase.from("daily_prayers").select("*").eq("user_id", user.id);
      if (error) throw error;
      const map: Record<string, DayPrayers> = {};
      for (const row of data || []) {
        map[row.date] = { date: row.date, prayers: row.prayers as unknown as PrayerEntry[] };
      }
      return map;
    },
    enabled: !!user,
  });

  const upsertDay = useCallback(async (date: string, prayers: PrayerEntry[]) => {
    if (!user) return;
    await supabase.from("daily_prayers").upsert(
      { user_id: user.id, date, prayers: prayers as any },
      { onConflict: "user_id,date" }
    );
    queryClient.invalidateQueries({ queryKey });
  }, [user, queryClient]);

  return { prayersData, isLoading, upsertDay };
}

// ─── SLEEP ───
export function useSleep() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["sleep_logs"];

  useRealtimeInvalidation("sleep_logs", queryKey);

  const { data: sleepData = {}, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return {};
      const { data, error } = await supabase.from("sleep_logs").select("*").eq("user_id", user.id);
      if (error) throw error;
      const map: Record<string, SleepEntry> = {};
      for (const row of data || []) {
        map[row.date] = {
          date: row.date,
          heureCoucher: row.heure_coucher,
          heureReveil: row.heure_reveil,
          reveilNocturne: row.reveil_nocturne,
        };
      }
      return map;
    },
    enabled: !!user,
  });

  const upsertDay = useCallback(async (date: string, entry: SleepEntry) => {
    if (!user) return;
    await supabase.from("sleep_logs").upsert(
      { user_id: user.id, date, heure_coucher: entry.heureCoucher, heure_reveil: entry.heureReveil, reveil_nocturne: entry.reveilNocturne },
      { onConflict: "user_id,date" }
    );
    queryClient.invalidateQueries({ queryKey });
  }, [user, queryClient]);

  return { sleepData, isLoading, upsertDay };
}

// ─── SCREEN ───
export function useScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["screen_usage"];

  useRealtimeInvalidation("screen_usage", queryKey);

  const { data: screenData = {}, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return {};
      const { data, error } = await supabase.from("screen_usage").select("*").eq("user_id", user.id);
      if (error) throw error;
      const map: Record<string, ScreenEntry & { apps: ScreenAppEntry[] }> = {};
      for (const row of data || []) {
        map[row.date] = {
          date: row.date,
          tempsTotal: row.temps_total,
          tempsProductif: row.temps_productif,
          tempsNeutre: row.temps_neutre,
          tempsDopamine: row.temps_dopamine,
          apps: row.apps as unknown as ScreenAppEntry[],
        };
      }
      return map;
    },
    enabled: !!user,
  });

  const upsertDay = useCallback(async (date: string, entry: ScreenEntry, apps: ScreenAppEntry[]) => {
    if (!user) return;
    await supabase.from("screen_usage").upsert(
      {
        user_id: user.id, date,
        apps: apps as any,
        temps_total: entry.tempsTotal,
        temps_productif: entry.tempsProductif,
        temps_neutre: entry.tempsNeutre,
        temps_dopamine: entry.tempsDopamine,
      },
      { onConflict: "user_id,date" }
    );
    queryClient.invalidateQueries({ queryKey });
  }, [user, queryClient]);

  return { screenData, isLoading, upsertDay };
}

// ─── PRODUCTIVITY ───
export function useProductivity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["daily_productivity"];

  useRealtimeInvalidation("daily_productivity", queryKey);

  const { data: productivityData = {}, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return {};
      const { data, error } = await supabase.from("daily_productivity").select("*").eq("user_id", user.id);
      if (error) throw error;
      const map: Record<string, ProductivityEntry> = {};
      for (const row of data || []) {
        const raw = row.tasks as any;
        // New format: { tasks: [...], sessions: [...] } stored in the tasks JSONB column
        if (raw && !Array.isArray(raw) && raw.tasks) {
          map[row.date] = { date: row.date, tasks: raw.tasks || [], sessions: raw.sessions || [] };
        } else {
          // Legacy format: tasks was a plain array, no sessions
          const legacyTasks = Array.isArray(raw) ? raw : [];
          map[row.date] = { date: row.date, tasks: legacyTasks.map((t: any) => ({ ...t, priority: t.priority || "moyenne" })), sessions: [] };
        }
      }
      return map;
    },
    enabled: !!user,
  });

  const upsertDay = useCallback(async (date: string, entry: ProductivityEntry) => {
    if (!user) return;
    // Store as structured object in the tasks JSONB column
    const payload = { tasks: entry.tasks, sessions: entry.sessions || [] };
    await supabase.from("daily_productivity").upsert(
      { user_id: user.id, date, tasks: payload as any, deep_work_minutes: 0, formation_minutes: 0 },
      { onConflict: "user_id,date" }
    );
    queryClient.invalidateQueries({ queryKey });
  }, [user, queryClient]);

  return { productivityData, isLoading, upsertDay };
}

// ─── EXPENSES ───
export function useExpenses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["expenses"];

  useRealtimeInvalidation("expenses", queryKey);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("expenses").select("*").eq("user_id", user.id).order("date", { ascending: false });
      if (error) throw error;
      return (data || []).map((row) => ({
        id: row.id,
        date: row.date,
        category: row.category,
        amount: Number(row.amount),
        description: row.description,
      })) as Expense[];
    },
    enabled: !!user,
  });

  const addExpense = useCallback(async (expense: Omit<Expense, "id">) => {
    if (!user) return;
    await supabase.from("expenses").insert({ user_id: user.id, ...expense });
    queryClient.invalidateQueries({ queryKey });
  }, [user, queryClient]);

  const removeExpense = useCallback(async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient]);

  return { expenses, isLoading, addExpense, removeExpense };
}

// ─── GOALS ───
export function useGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["goals"];

  useRealtimeInvalidation("goals", queryKey);

  const { data: goals = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("goals").select("*").eq("user_id", user.id);
      if (error) throw error;
      return (data || []).map((row) => ({
        id: row.id,
        title: row.title,
        trimester: row.trimester as 1 | 2 | 3 | 4,
        progress: row.progress,
      })) as Goal[];
    },
    enabled: !!user,
  });

  const addGoal = useCallback(async (goal: Omit<Goal, "id">) => {
    if (!user) return;
    await supabase.from("goals").insert({ user_id: user.id, title: goal.title, trimester: goal.trimester, progress: goal.progress });
    queryClient.invalidateQueries({ queryKey });
  }, [user, queryClient]);

  const updateGoal = useCallback(async (id: string, partial: Partial<Goal>) => {
    await supabase.from("goals").update(partial).eq("id", id);
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient]);

  const removeGoal = useCallback(async (id: string) => {
    await supabase.from("goals").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient]);

  return { goals, isLoading, addGoal, updateGoal, removeGoal };
}

// ─── TRAINING PROGRAMS ───
export function useTrainingPrograms() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["training_programs"];

  useRealtimeInvalidation("training_programs", queryKey);

  const { data: programs = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("training_programs").select("*").eq("user_id", user.id);
      if (error) throw error;
      return (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        days: row.days as unknown as TrainingProgram["days"],
        createdAt: row.created_at,
        active: row.active,
      })) as TrainingProgram[];
    },
    enabled: !!user,
  });

  const addProgram = useCallback(async (prog: TrainingProgram) => {
    if (!user) return;
    // Deactivate others first
    await supabase.from("training_programs").update({ active: false }).eq("user_id", user.id);
    await supabase.from("training_programs").insert({
      id: prog.id, user_id: user.id, name: prog.name, days: prog.days as any, active: prog.active,
    });
    queryClient.invalidateQueries({ queryKey });
  }, [user, queryClient]);

  const updateProgram = useCallback(async (prog: TrainingProgram) => {
    await supabase.from("training_programs").update({
      name: prog.name, days: prog.days as any, active: prog.active,
    }).eq("id", prog.id);
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient]);

  const deleteProgram = useCallback(async (id: string) => {
    await supabase.from("training_programs").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient]);

  const activateProgram = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from("training_programs").update({ active: false }).eq("user_id", user.id);
    await supabase.from("training_programs").update({ active: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey });
  }, [user, queryClient]);

  return { programs, isLoading, addProgram, updateProgram, deleteProgram, activateProgram };
}

// ─── WORKOUT SESSIONS ───
export function useWorkoutSessions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["workout_sessions"];

  useRealtimeInvalidation("workout_sessions", queryKey);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("workout_sessions").select("*").eq("user_id", user.id).order("date", { ascending: false });
      if (error) throw error;
      return (data || []).map((row) => ({
        id: row.id,
        date: row.date,
        programId: row.program_id || "",
        dayId: row.day_id,
        exercises: row.exercises as unknown as WorkoutSession["exercises"],
        completed: row.completed,
      })) as WorkoutSession[];
    },
    enabled: !!user,
  });

  const addSession = useCallback(async (session: WorkoutSession) => {
    if (!user) return;
    await supabase.from("workout_sessions").insert({
      id: session.id, user_id: user.id, date: session.date, program_id: session.programId,
      day_id: session.dayId, exercises: session.exercises as any, completed: session.completed,
    });
    queryClient.invalidateQueries({ queryKey });
  }, [user, queryClient]);

  const updateSession = useCallback(async (session: WorkoutSession) => {
    await supabase.from("workout_sessions").update({
      exercises: session.exercises as any, completed: session.completed,
    }).eq("id", session.id);
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient]);

  return { sessions, isLoading, addSession, updateSession };
}

// ─── SETTINGS ───
export function useSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["user_settings"];

  useRealtimeInvalidation("user_settings", queryKey);

  const { data: settings = DEFAULT_SETTINGS, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return DEFAULT_SETTINGS;
      const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...(data.settings as any) } as AppSettings;
    },
    enabled: !!user,
  });

  const updateSettings = useCallback(async (newSettings: AppSettings) => {
    if (!user) return;
    await supabase.from("user_settings").upsert(
      { user_id: user.id, settings: newSettings as any, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    queryClient.invalidateQueries({ queryKey });
  }, [user, queryClient]);

  return { settings, isLoading, updateSettings };
}

// ─── CALORIES ───
export function useCalories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["daily_calories"];

  useRealtimeInvalidation("daily_calories", queryKey);

  const { data: caloriesData = {}, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return {};
      const { data, error } = await supabase.from("daily_calories").select("*").eq("user_id", user.id);
      if (error) throw error;
      const map: Record<string, any[]> = {};
      for (const row of data || []) {
        map[row.date] = row.entries as any[];
      }
      return map;
    },
    enabled: !!user,
  });

  const upsertDay = useCallback(async (date: string, entries: any[]) => {
    if (!user) return;
    await supabase.from("daily_calories").upsert(
      { user_id: user.id, date, entries: entries as any },
      { onConflict: "user_id,date" }
    );
    queryClient.invalidateQueries({ queryKey });
  }, [user, queryClient]);

  return { caloriesData, isLoading, upsertDay };
}

// ─── APP CLASSIFICATIONS ───
export function useAppClassifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["app_classifications"];

  useRealtimeInvalidation("app_classifications", queryKey);

  const { data: classifications = {}, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return {};
      const { data, error } = await supabase.from("app_classifications").select("*").eq("user_id", user.id);
      if (error) throw error;
      const map: Record<string, AppCategory> = {};
      for (const row of data || []) {
        map[row.app_name] = row.category as AppCategory;
      }
      return map;
    },
    enabled: !!user,
  });

  const setClassification = useCallback(async (appName: string, category: AppCategory) => {
    if (!user) return;
    await supabase.from("app_classifications").upsert(
      { user_id: user.id, app_name: appName.toLowerCase().trim(), category },
      { onConflict: "user_id,app_name" }
    );
    queryClient.invalidateQueries({ queryKey });
  }, [user, queryClient]);

  return { classifications, isLoading, setClassification };
}
