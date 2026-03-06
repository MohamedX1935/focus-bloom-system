import { useGoals } from "@/hooks/useSupabaseData";
import { type Goal } from "@/types/app";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export default function Objectifs() {
  const { goals, addGoal, updateGoal, removeGoal } = useGoals();
  const [newTitle, setNewTitle] = useState("");
  const [newTrimester, setNewTrimester] = useState<string>("1");

  const handleAddGoal = () => {
    if (!newTitle.trim()) return;
    addGoal({
      title: newTitle.trim(),
      trimester: parseInt(newTrimester) as 1 | 2 | 3 | 4,
      progress: 0,
    });
    setNewTitle("");
  };

  const handleUpdateProgress = (id: string, progress: number) => {
    updateGoal(id, { progress: Math.min(100, Math.max(0, progress)) });
  };

  const avgProgress = goals.length > 0 ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Objectifs</h1>
          <p className="text-sm text-muted-foreground">{goals.length} objectifs · {avgProgress}% moyen</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input placeholder="Nouvel objectif..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddGoal()} className="bg-muted border-border flex-1" />
        <Select value={newTrimester} onValueChange={setNewTrimester}>
          <SelectTrigger className="bg-muted border-border w-20"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4].map((t) => <SelectItem key={t} value={String(t)}>T{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={handleAddGoal} size="icon"><Plus className="h-4 w-4" /></Button>
      </div>

      {[1, 2, 3, 4].map((t) => {
        const trimesterGoals = goals.filter((g) => g.trimester === t);
        if (trimesterGoals.length === 0) return null;
        return (
          <motion.div key={t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Trimestre {t}</h3>
            {trimesterGoals.map((goal, i) => (
              <motion.div key={goal.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{goal.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{goal.progress}%</span>
                    <button onClick={() => removeGoal(goal.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${goal.progress}%` }} transition={{ duration: 0.5 }} />
                </div>
                <input type="range" min={0} max={100} value={goal.progress} onChange={(e) => handleUpdateProgress(goal.id, parseInt(e.target.value))} className="w-full accent-primary h-1" />
              </motion.div>
            ))}
          </motion.div>
        );
      })}
    </div>
  );
}
