import { useHabits, useSettings, useTrainingPrograms, useWorkoutSessions } from "@/hooks/useSupabaseData";
import { DEFAULT_HABITS, type DayHabits, type AppSettings, type TrainingProgram, type WorkoutSession, type ExerciseTemplate, type TrainingDay, type MuscleGroup, MUSCLE_GROUPS } from "@/types/app";
import { SessionWorkout } from "@/components/sport/SessionWorkout";
import { CalorieTracker } from "@/components/sport/CalorieTracker";
import { ScoreRing } from "@/components/ScoreRing";
import { ModuleCard } from "@/components/ModuleCard";
import { Dumbbell, Calendar, Plus, Trash2, ChevronDown, ChevronUp, Edit2, Check, X, Image } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

export default function Sport() {
  const today = getTodayKey();
  const { settings } = useSettings();
  const { habitsData } = useHabits();
  const { programs, addProgram, updateProgram, deleteProgram, activateProgram } = useTrainingPrograms();
  const { sessions, addSession, updateSession } = useWorkoutSessions();
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);
  const [activeTab, setActiveTab] = useState("aujourdhui");

  const month = today.substring(0, 7);
  const monthDays = Object.entries(habitsData).filter(([key]) => key.startsWith(month));
  const seancesMois = monthDays.filter(([_, day]) =>
    day.habits.find((h) => h.id === "musculation")?.done
  ).length;

  let sportStreak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().split("T")[0];
    const dayOfWeek = d.getDay();
    if (settings.joursSport.includes(dayOfWeek)) {
      if (habitsData[key]?.habits.find((h) => h.id === "musculation")?.done) {
        sportStreak++;
        d.setDate(d.getDate() - 1);
      } else break;
    } else {
      d.setDate(d.getDate() - 1);
      if (d < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) break;
    }
  }

  const todayDone = habitsData[today]?.habits.find((h) => h.id === "musculation")?.done || false;
  const score = todayDone ? 100 : 0;

  const activeProgram = programs.find((p) => p.active);
  const todayDayOfWeek = new Date().getDay();
  const todayTraining = activeProgram?.days.find((d) => d.dayOfWeek === todayDayOfWeek);
  const todaySession = sessions.find((s) => s.date === today);

  function createNewProgram() {
    const newProg: TrainingProgram = {
      id: crypto.randomUUID(),
      name: "Nouveau programme",
      days: [],
      createdAt: today,
      active: true,
    };
    addProgram(newProg);
    setEditingProgram(newProg);
  }

  function saveProgram(prog: TrainingProgram) {
    updateProgram(prog);
    setEditingProgram(null);
    toast({ title: "Programme sauvegardé" });
  }

  function handleDeleteProgram(id: string) {
    deleteProgram(id);
    toast({ title: "Programme supprimé" });
  }

  function startSession() {
    if (!todayTraining || !activeProgram) return;
    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      date: today,
      programId: activeProgram.id,
      dayId: todayTraining.id,
      exercises: todayTraining.exercises.map((ex) => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: Array.from({ length: ex.sets }, (_, i) => ({
          setNumber: i + 1,
          reps: ex.reps,
          weight: ex.weight,
          done: false,
        })),
      })),
      completed: false,
    };
    addSession(session);
  }

  function handleUpdateSession(updated: WorkoutSession) {
    updateSession(updated);
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sport</h1>
        <p className="text-sm text-muted-foreground">
          {activeProgram ? activeProgram.name : "Aucun programme actif"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5 flex flex-col items-center">
          <ScoreRing score={score} size={100} label="Aujourd'hui" />
        </motion.div>
        <ModuleCard title="Séances / mois" value={seancesMois} icon={<Calendar className="h-4 w-4" />} delay={0.1} />
        <ModuleCard title="Streak Sport" value={`${sportStreak}j`} icon={<Dumbbell className="h-4 w-4" />} delay={0.15} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="aujourdhui">Séance</TabsTrigger>
          <TabsTrigger value="programme">Programme</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="aujourdhui">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {!todayTraining ? (
              <div className="glass-card rounded-xl p-6 text-center text-muted-foreground">
                {activeProgram ? "Pas d'entraînement prévu aujourd'hui" : "Créez un programme pour commencer"}
              </div>
            ) : !todaySession ? (
              <div className="glass-card rounded-xl p-6 text-center">
                <p className="text-muted-foreground mb-3">{todayTraining.label}</p>
                <p className="text-sm text-muted-foreground mb-4">{todayTraining.exercises.length} exercices</p>
                <Button onClick={startSession}>Démarrer la séance</Button>
              </div>
            ) : (
              <SessionWorkout
                session={todaySession}
                exercises={todayTraining?.exercises || []}
                onUpdate={handleUpdateSession}
                onFinish={handleUpdateSession}
              />
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="programme">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {editingProgram ? (
              <ProgramEditor program={editingProgram} onSave={saveProgram} onCancel={() => setEditingProgram(null)} />
            ) : (
              <>
                <Button onClick={createNewProgram} className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> Nouveau programme
                </Button>
                {programs.map((prog) => (
                  <div key={prog.id} className={`glass-card rounded-xl p-4 ${prog.active ? "ring-1 ring-primary" : ""}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-foreground">{prog.name}</h3>
                        <p className="text-xs text-muted-foreground">{prog.days.length} jours • {prog.days.reduce((s, d) => s + d.exercises.length, 0)} exercices</p>
                      </div>
                      <div className="flex gap-2">
                        {!prog.active && <Button size="sm" variant="outline" onClick={() => activateProgram(prog.id)}>Activer</Button>}
                        <Button size="sm" variant="ghost" onClick={() => setEditingProgram(prog)}><Edit2 className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteProgram(prog.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="historique">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {sessions.length === 0 ? (
              <div className="glass-card rounded-xl p-6 text-center text-muted-foreground">Aucune séance enregistrée</div>
            ) : (
              sessions.slice(0, 20).map((s) => (
                <div key={s.id} className="glass-card rounded-xl p-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-foreground">{s.date}</span>
                    <span className="text-xs text-muted-foreground">
                      {s.exercises.reduce((sum, e) => sum + e.sets.filter((st) => st.done).length, 0)} séries
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {s.exercises.map((e) => (
                      <p key={e.exerciseId} className="text-xs text-muted-foreground">
                        {e.exerciseName} — {e.sets.filter((st) => st.done).length}/{e.sets.length} séries • max {Math.max(...e.sets.map((st) => st.weight))}kg
                      </p>
                    ))}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="stats">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <ExerciseStats sessions={sessions} />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── SUB-COMPONENTS ───

function ProgramEditor({ program, onSave, onCancel }: {
  program: TrainingProgram;
  onSave: (p: TrainingProgram) => void;
  onCancel: () => void;
}) {
  const [prog, setProg] = useState<TrainingProgram>({ ...program, days: [...program.days] });
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const DAYS_OF_WEEK = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  function addDay() {
    const newDay: TrainingDay = { id: crypto.randomUUID(), label: "Jour " + (prog.days.length + 1), dayOfWeek: 1, exercises: [] };
    setProg({ ...prog, days: [...prog.days, newDay] });
    setExpandedDay(newDay.id);
  }

  function updateDay(dayId: string, partial: Partial<TrainingDay>) {
    setProg({ ...prog, days: prog.days.map((d) => (d.id === dayId ? { ...d, ...partial } : d)) });
  }

  function removeDay(dayId: string) {
    setProg({ ...prog, days: prog.days.filter((d) => d.id !== dayId) });
  }

  function addExercise(dayId: string) {
    const newEx: ExerciseTemplate = { id: crypto.randomUUID(), name: "", sets: 3, reps: 10, weight: 0, notes: "", muscleGroup: "poitrine" };
    setProg({ ...prog, days: prog.days.map((d) => d.id === dayId ? { ...d, exercises: [...d.exercises, newEx] } : d) });
  }

  function updateExercise(dayId: string, exId: string, partial: Partial<ExerciseTemplate>) {
    setProg({ ...prog, days: prog.days.map((d) => d.id === dayId ? { ...d, exercises: d.exercises.map((e) => (e.id === exId ? { ...e, ...partial } : e)) } : d) });
  }

  function removeExercise(dayId: string, exId: string) {
    setProg({ ...prog, days: prog.days.map((d) => d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.id !== exId) } : d) });
  }

  async function uploadExerciseImage(dayId: string, exId: string, file: File) {
    const ext = file.name.split(".").pop();
    const path = `exercises/${exId}.${ext}`;
    const { error } = await supabase.storage.from("exercise-media").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Erreur upload", description: error.message, variant: "destructive" }); return; }
    const { data } = supabase.storage.from("exercise-media").getPublicUrl(path);
    updateExercise(dayId, exId, { imageUrl: data.publicUrl });
    toast({ title: "Image uploadée" });
  }

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl p-4 space-y-3">
        <Label className="text-xs text-muted-foreground">Nom du programme</Label>
        <Input value={prog.name} onChange={(e) => setProg({ ...prog, name: e.target.value })} className="bg-muted border-border" />
      </div>

      {prog.days.map((day) => (
        <div key={day.id} className="glass-card rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}>
            <div className="flex items-center gap-2">
              {expandedDay === day.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span className="font-medium text-sm text-foreground">{day.label}</span>
              <span className="text-xs text-muted-foreground">({DAYS_OF_WEEK[day.dayOfWeek]})</span>
            </div>
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); removeDay(day.id); }}><Trash2 className="h-3 w-3" /></Button>
          </div>

          <AnimatePresence>
            {expandedDay === day.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Label</Label>
                    <Input value={day.label} onChange={(e) => updateDay(day.id, { label: e.target.value })} className="bg-muted border-border h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Jour</Label>
                    <Select value={String(day.dayOfWeek)} onValueChange={(v) => updateDay(day.id, { dayOfWeek: parseInt(v) })}>
                      <SelectTrigger className="bg-muted border-border h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{DAYS_OF_WEEK.map((name, i) => (<SelectItem key={i} value={String(i)}>{name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </div>

                {day.exercises.map((ex) => (
                  <ExerciseEditor key={ex.id} exercise={ex} onUpdate={(partial) => updateExercise(day.id, ex.id, partial)} onRemove={() => removeExercise(day.id, ex.id)} onUpload={(file) => uploadExerciseImage(day.id, ex.id, file)} />
                ))}

                <Button size="sm" variant="outline" onClick={() => addExercise(day.id)} className="w-full"><Plus className="h-3 w-3 mr-1" /> Exercice</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      <Button variant="outline" onClick={addDay} className="w-full"><Plus className="h-4 w-4 mr-2" /> Ajouter un jour</Button>

      <div className="flex gap-3">
        <Button onClick={() => onSave(prog)} className="flex-1"><Check className="h-4 w-4 mr-2" /> Sauvegarder</Button>
        <Button variant="outline" onClick={onCancel}><X className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function ExerciseEditor({ exercise, onUpdate, onRemove, onUpload }: {
  exercise: ExerciseTemplate;
  onUpdate: (partial: Partial<ExerciseTemplate>) => void;
  onRemove: () => void;
  onUpload: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-2 border border-border">
      <div className="flex justify-between items-start gap-2">
        <Input value={exercise.name} onChange={(e) => onUpdate({ name: e.target.value })} placeholder="Nom exercice" className="bg-muted border-border h-8 text-xs flex-1" />
        <Button size="sm" variant="ghost" onClick={onRemove} className="h-8 w-8 p-0"><Trash2 className="h-3 w-3" /></Button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Séries</Label>
          <Input type="number" value={exercise.sets} onChange={(e) => onUpdate({ sets: parseInt(e.target.value) || 1 })} className="bg-muted border-border h-7 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Reps</Label>
          <Input type="number" value={exercise.reps} onChange={(e) => onUpdate({ reps: parseInt(e.target.value) || 1 })} className="bg-muted border-border h-7 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Poids (kg)</Label>
          <Input type="number" value={exercise.weight} onChange={(e) => onUpdate({ weight: parseFloat(e.target.value) || 0 })} className="bg-muted border-border h-7 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Muscle</Label>
          <Select value={exercise.muscleGroup} onValueChange={(v) => onUpdate({ muscleGroup: v as MuscleGroup })}>
            <SelectTrigger className="bg-muted border-border h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{MUSCLE_GROUPS.map((mg) => (<SelectItem key={mg.value} value={mg.value}>{mg.label}</SelectItem>))}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <Input value={exercise.notes} onChange={(e) => onUpdate({ notes: e.target.value })} placeholder="Notes..." className="bg-muted border-border h-7 text-xs flex-1" />
        <input ref={fileRef} type="file" accept="image/*,.gif" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0]); }} />
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => fileRef.current?.click()}><Image className="h-3 w-3" /></Button>
      </div>

      {exercise.imageUrl && <img src={exercise.imageUrl} alt={exercise.name} className="h-20 w-auto rounded object-cover" />}
    </div>
  );
}

function ExerciseStats({ sessions }: { sessions: WorkoutSession[] }) {
  const muscleData: Record<string, { totalSets: number; exercises: Set<string> }> = {};
  const exerciseNames = new Set<string>();

  sessions.forEach((s) => {
    s.exercises.forEach((e) => {
      exerciseNames.add(e.exerciseName);
      if (!muscleData[e.muscleGroup]) muscleData[e.muscleGroup] = { totalSets: 0, exercises: new Set() };
      muscleData[e.muscleGroup].totalSets += e.sets.filter((st) => st.done).length;
      muscleData[e.muscleGroup].exercises.add(e.exerciseName);
    });
  });

  const chartData = Object.entries(muscleData).map(([group, data]) => ({
    name: MUSCLE_GROUPS.find((mg) => mg.value === group)?.label || group,
    series: data.totalSets,
  }));

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekKey = weekStart.toISOString().split("T")[0];
  const weeklySets = sessions.filter((s) => s.date >= weekKey).reduce((sum, s) => sum + s.exercises.reduce((ss, e) => ss + e.sets.filter((st) => st.done).length, 0), 0);

  if (sessions.length === 0) return <div className="glass-card rounded-xl p-6 text-center text-muted-foreground">Aucune donnée de séance</div>;

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Séries cette semaine</h3>
        <p className="text-3xl font-bold text-primary">{weeklySets}</p>
      </div>

      {chartData.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Séries par groupe musculaire</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="series" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {Array.from(exerciseNames).slice(0, 5).map((name) => {
        const data = sessions
          .flatMap((s) => s.exercises.filter((e) => e.exerciseName === name).map((e) => ({
            date: s.date.substring(5),
            maxWeight: Math.max(...e.sets.filter((st) => st.done).map((st) => st.weight), 0),
          })))
          .filter((d) => d.maxWeight > 0);
        if (data.length < 2) return null;
        return (
          <div key={name} className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">📈 {name}</h3>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={data}>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <Bar dataKey="maxWeight" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}
