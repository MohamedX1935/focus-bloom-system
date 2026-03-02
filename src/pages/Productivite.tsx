import { useLocalStorage, getTodayKey } from "@/hooks/useLocalStorage";
import { type ProductivityEntry, type Task } from "@/types/app";
import { ScoreRing } from "@/components/ScoreRing";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export default function Productivite() {
  const today = getTodayKey();
  const [data, setData] = useLocalStorage<Record<string, ProductivityEntry>>("discipline-productivity", {});
  const [newTask, setNewTask] = useState("");

  const entry: ProductivityEntry = data[today] || {
    date: today,
    tasks: [],
    deepWorkMinutes: 0,
    formationMinutes: 0,
  };

  const updateEntry = (partial: Partial<ProductivityEntry>) => {
    setData((prev) => ({ ...prev, [today]: { ...entry, ...partial } }));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = { id: crypto.randomUUID(), title: newTask.trim(), done: false, date: today };
    updateEntry({ tasks: [...entry.tasks, task] });
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    updateEntry({ tasks: entry.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) });
  };

  const removeTask = (id: string) => {
    updateEntry({ tasks: entry.tasks.filter((t) => t.id !== id) });
  };

  const tasksDone = entry.tasks.filter((t) => t.done).length;
  const tasksTotal = entry.tasks.length || 1;
  const taskScore = (tasksDone / tasksTotal) * 60;
  const deepScore = Math.min(40, (entry.deepWorkMinutes / 120) * 40);
  const score = Math.round(taskScore + deepScore);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Productivité</h1>
          <p className="text-sm text-muted-foreground">{tasksDone}/{entry.tasks.length} tâches · {entry.deepWorkMinutes}min deep work</p>
        </div>
        <ScoreRing score={score} size={64} strokeWidth={5} />
      </div>

      {/* Add task */}
      <div className="flex gap-2">
        <Input
          placeholder="Nouvelle tâche..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          className="bg-muted border-border flex-1"
        />
        <Button onClick={addTask} size="icon"><Plus className="h-4 w-4" /></Button>
      </div>

      {/* Tasks */}
      <div className="space-y-2">
        {entry.tasks.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-card rounded-lg p-3 flex items-center gap-3"
          >
            <button
              onClick={() => toggleTask(task.id)}
              className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                task.done ? "bg-primary" : "bg-muted border border-border"
              }`}
            >
              {task.done && <Check className="h-3 w-3 text-primary-foreground" />}
            </button>
            <span className={`flex-1 text-sm ${task.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{task.title}</span>
            <button onClick={() => removeTask(task.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
          </motion.div>
        ))}
      </div>

      {/* Deep work & Formation */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Deep work (min)</Label>
            <Input
              type="number"
              value={entry.deepWorkMinutes || ""}
              onChange={(e) => updateEntry({ deepWorkMinutes: parseInt(e.target.value) || 0 })}
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Formation (min)</Label>
            <Input
              type="number"
              value={entry.formationMinutes || ""}
              onChange={(e) => updateEntry({ formationMinutes: parseInt(e.target.value) || 0 })}
              className="bg-muted border-border"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
