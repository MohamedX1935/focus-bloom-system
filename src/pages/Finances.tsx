import { useExpenses, useSettings } from "@/hooks/useSupabaseData";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/types/app";
import { ModuleCard } from "@/components/ModuleCard";
import { motion } from "framer-motion";
import { Wallet, TrendingDown, PiggyBank, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

export default function Finances() {
  const today = getTodayKey();
  const month = today.substring(0, 7);
  const { settings } = useSettings();
  const { expenses, addExpense, removeExpense } = useExpenses();

  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState<ExpenseCategory>("nourriture");
  const [newDesc, setNewDesc] = useState("");

  const monthExpenses = expenses.filter((e) => e.date.startsWith(month));
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const restant = settings.financeConfig.revenuReel - totalSpent;
  const tauxEpargne = Math.round(((settings.financeConfig.revenuReel - totalSpent) / settings.financeConfig.revenuReel) * 100);

  const handleAddExpense = () => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) return;
    addExpense({
      date: today,
      category: newCategory,
      amount,
      description: newDesc || EXPENSE_CATEGORIES.find(c => c.value === newCategory)?.label || "",
    });
    setNewAmount("");
    setNewDesc("");
  };

  const byCategory = EXPENSE_CATEGORIES.map((cat) => {
    const spent = monthExpenses.filter((e) => e.category === cat.value).reduce((s, e) => s + e.amount, 0);
    const budget = settings.financeConfig.budgets[cat.value];
    return { ...cat, spent, budget, pct: budget > 0 ? Math.round((spent / budget) * 100) : 0 };
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground">Finances</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ModuleCard title="Revenu" value={`${settings.financeConfig.revenuReel.toLocaleString()}`} subtitle="MAD" icon={<Wallet className="h-4 w-4" />} />
        <ModuleCard title="Dépensé" value={`${totalSpent.toLocaleString()}`} subtitle="MAD" icon={<TrendingDown className="h-4 w-4" />} delay={0.05} />
        <ModuleCard title="Restant" value={`${restant.toLocaleString()}`} subtitle="MAD" icon={<Wallet className="h-4 w-4" />} delay={0.1} />
        <ModuleCard title="Épargne" value={`${tauxEpargne}%`} icon={<PiggyBank className="h-4 w-4" />} delay={0.15} />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ajouter une dépense</h3>
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="Montant" type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="bg-muted border-border w-24" />
          <Select value={newCategory} onValueChange={(v) => setNewCategory(v as ExpenseCategory)}>
            <SelectTrigger className="bg-muted border-border w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EXPENSE_CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
            </SelectContent>
          </Select>
          <Input placeholder="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="bg-muted border-border flex-1 min-w-[120px]" />
          <Button onClick={handleAddExpense} size="icon" className="shrink-0"><Plus className="h-4 w-4" /></Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Budget par catégorie</h3>
        <div className="space-y-2">
          {byCategory.map((cat) => (
            <div key={cat.value} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-foreground">{cat.label}</span>
                <span className="text-muted-foreground">{cat.spent} / {cat.budget} MAD</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full transition-all ${cat.pct > 100 ? "bg-destructive" : "bg-primary"}`} style={{ width: `${Math.min(cat.pct, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {monthExpenses.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="glass-card rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dépenses récentes</h3>
          <div className="space-y-1">
            {monthExpenses.slice(0, 10).map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-foreground">{e.description}</span>
                  <span className="text-xs text-muted-foreground">{EXPENSE_CATEGORIES.find(c => c.value === e.category)?.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{e.amount} MAD</span>
                  <button onClick={() => removeExpense(e.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
