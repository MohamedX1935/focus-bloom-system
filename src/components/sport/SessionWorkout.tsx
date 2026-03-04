import { useState } from "react";
import { type WorkoutSession, type ExerciseTemplate } from "@/types/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Trophy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  session: WorkoutSession;
  exercises: ExerciseTemplate[];
  onUpdate: (s: WorkoutSession) => void;
  onFinish: (s: WorkoutSession) => void;
}

export function SessionWorkout({ session, exercises, onUpdate, onFinish }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [direction, setDirection] = useState(0);

  const ex = session.exercises[currentIdx];
  const template = exercises.find((e) => e.id === ex?.exerciseId);
  const totalExercises = session.exercises.length;

  const totalSets = session.exercises.reduce((s, e) => s + e.sets.length, 0);
  const doneSets = session.exercises.reduce((s, e) => s + e.sets.filter((st) => st.done).length, 0);
  const allDone = doneSets === totalSets && totalSets > 0;

  function navigate(dir: number) {
    const next = currentIdx + dir;
    if (next < 0 || next >= totalExercises) return;
    setDirection(dir);
    setCurrentIdx(next);
  }

  function toggleSet(setIdx: number) {
    const updated = {
      ...session,
      exercises: session.exercises.map((e, i) =>
        i === currentIdx
          ? { ...e, sets: e.sets.map((s, si) => (si === setIdx ? { ...s, done: !s.done } : s)) }
          : e
      ),
    };
    onUpdate(updated);
  }

  function updateSetWeight(setIdx: number, weight: number) {
    const updated = {
      ...session,
      exercises: session.exercises.map((e, i) =>
        i === currentIdx
          ? { ...e, sets: e.sets.map((s, si) => (si === setIdx ? { ...s, weight } : s)) }
          : e
      ),
    };
    onUpdate(updated);
  }

  function updateSetReps(setIdx: number, reps: number) {
    const updated = {
      ...session,
      exercises: session.exercises.map((e, i) =>
        i === currentIdx
          ? { ...e, sets: e.sets.map((s, si) => (si === setIdx ? { ...s, reps } : s)) }
          : e
      ),
    };
    onUpdate(updated);
  }

  function updateComment(comment: string) {
    const updated = {
      ...session,
      exercises: session.exercises.map((e, i) =>
        i === currentIdx ? { ...e, comment } : e
      ),
    };
    onUpdate(updated);
  }

  function finishSession() {
    const completed = { ...session, completed: true };
    onFinish(completed);
    toast({ title: "Séance terminée ! 💪", description: `${doneSets}/${totalSets} séries complétées` });
  }

  if (!ex) return null;

  const exDoneSets = ex.sets.filter((s) => s.done).length;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground">Progression globale</span>
          <span className="text-sm font-bold text-primary">{doneSets}/{totalSets}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${totalSets > 0 ? (doneSets / totalSets) * 100 : 0}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        {/* Exercise dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {session.exercises.map((e, i) => {
            const done = e.sets.every((s) => s.done);
            const partial = e.sets.some((s) => s.done);
            return (
              <button
                key={i}
                onClick={() => { setDirection(i > currentIdx ? 1 : -1); setCurrentIdx(i); }}
                className={`h-2 rounded-full transition-all ${
                  i === currentIdx ? "w-6 bg-primary" : done ? "w-2 bg-primary/60" : partial ? "w-2 bg-primary/30" : "w-2 bg-muted-foreground/20"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Exercise card */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIdx}
          custom={direction}
          initial={{ x: direction * 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -direction * 100, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="glass-card rounded-xl overflow-hidden"
        >
          {/* Image */}
          {template?.imageUrl && (
            <div className="w-full h-48 bg-muted flex items-center justify-center overflow-hidden">
              <img src={template.imageUrl} alt={ex.exerciseName} className="w-full h-full object-contain" />
            </div>
          )}

          <div className="p-5 space-y-4">
            {/* Header */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">
                Exercice {currentIdx + 1}/{totalExercises}
              </p>
              <h2 className="text-lg font-bold text-foreground">{ex.exerciseName}</h2>
              <p className="text-xs text-muted-foreground capitalize">{ex.muscleGroup}</p>
              {template?.notes && (
                <p className="text-xs text-muted-foreground/70 mt-1 italic">{template.notes}</p>
              )}
            </div>

            {/* Sets */}
            <div className="space-y-2">
              <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] gap-2 items-center text-[10px] text-muted-foreground font-medium px-1">
                <span></span>
                <span className="text-center">Reps</span>
                <span></span>
                <span className="text-center">Poids</span>
                <span></span>
              </div>
              {ex.sets.map((set, si) => (
                <motion.div
                  key={si}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: si * 0.05 }}
                  className={`grid grid-cols-[auto_1fr_auto_1fr_auto] gap-2 items-center p-2 rounded-lg transition-colors ${
                    set.done ? "bg-primary/10" : "bg-muted/50"
                  }`}
                >
                  <span className="text-xs text-muted-foreground w-6 text-center">S{set.setNumber}</span>
                  <Input
                    type="number"
                    value={set.reps}
                    onChange={(e) => updateSetReps(si, parseInt(e.target.value) || 0)}
                    className="h-8 text-xs text-center bg-background border-border"
                  />
                  <span className="text-xs text-muted-foreground">×</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={set.weight}
                      onChange={(e) => updateSetWeight(si, parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs text-center bg-background border-border"
                    />
                    <span className="text-[10px] text-muted-foreground">kg</span>
                  </div>
                  <Checkbox
                    checked={set.done}
                    onCheckedChange={() => toggleSet(si)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </motion.div>
              ))}
            </div>

            {/* Quick status */}
            <p className="text-center text-xs text-muted-foreground">
              {exDoneSets}/{ex.sets.length} séries complétées
            </p>

            {/* Comment */}
            <Textarea
              value={ex.comment || ""}
              onChange={(e) => updateComment(e.target.value)}
              placeholder="Commentaire rapide..."
              className="h-14 text-xs bg-muted border-border resize-none"
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          disabled={currentIdx === 0}
          className="flex-1"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
        </Button>

        {currentIdx < totalExercises - 1 ? (
          <Button onClick={() => navigate(1)} className="flex-1">
            Suivant <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={finishSession}
            className="flex-1 bg-primary"
          >
            <Trophy className="h-4 w-4 mr-1" /> Terminer
          </Button>
        )}
      </div>
    </div>
  );
}
