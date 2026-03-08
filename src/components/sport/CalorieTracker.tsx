import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Utensils, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCalories } from "@/hooks/useSupabaseData";
import { useSettings } from "@/hooks/useSupabaseData";

export interface CalorieEntry {
  id: string;
  name: string;
  quantity?: string;
  calories: number;
}

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

export function CalorieTracker() {
  const today = getTodayKey();
  const { caloriesData, upsertDay } = useCalories();
  const { settings } = useSettings();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [calories, setCalories] = useState("");

  const todayEntries: CalorieEntry[] = caloriesData[today] || [];
  const totalCalories = todayEntries.reduce((s, e) => s + e.calories, 0);
  const objectif = settings.objectifCalories || 2800;
  const progress = Math.min(100, Math.round((totalCalories / objectif) * 100));
  const isOver = totalCalories > objectif;

  function addEntry() {
    if (!name.trim() || !calories) return;
    const entry: CalorieEntry = {
      id: crypto.randomUUID(),
      name: name.trim(),
      quantity: quantity.trim() || undefined,
      calories: parseInt(calories) || 0,
    };
    const updated = [...todayEntries, entry];
    upsertDay(today, updated);
    setName("");
    setQuantity("");
    setCalories("");
  }

  function removeEntry(id: string) {
    const updated = todayEntries.filter((e) => e.id !== id);
    upsertDay(today, updated);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Progress card */}
      <div className="glass-card rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Objectif calorique</span>
          </div>
          <span className={`text-sm font-bold ${isOver ? "text-destructive" : "text-primary"}`}>
            {totalCalories} / {objectif} kcal
          </span>
        </div>
        <Progress value={progress} className="h-3" />
        <p className="text-[11px] text-muted-foreground text-right">
          {isOver
            ? `+${totalCalories - objectif} kcal au-dessus`
            : `${objectif - totalCalories} kcal restantes`}
        </p>
      </div>

      {/* Add form */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ajouter un aliment</h4>
        <div className="grid grid-cols-3 gap-2">
          <Input
            placeholder="Aliment"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-muted border-border col-span-1"
          />
          <Input
            placeholder="Quantité (opt.)"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="bg-muted border-border col-span-1"
          />
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="kcal"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEntry()}
              className="bg-muted border-border flex-1"
            />
            <Button size="icon" onClick={addEntry} disabled={!name.trim() || !calories}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Entries list */}
      <div className="glass-card rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Utensils className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Repas du jour ({todayEntries.length})
          </h4>
        </div>
        {todayEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun aliment enregistré</p>
        ) : (
          <AnimatePresence>
            {todayEntries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-accent/50 hover:bg-accent/70 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground truncate block">{entry.name}</span>
                  {entry.quantity && (
                    <span className="text-[11px] text-muted-foreground">{entry.quantity}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">{entry.calories} kcal</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeEntry(entry.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
