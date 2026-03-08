import { useSettings } from "@/hooks/useSupabaseData";
import { EXPENSE_CATEGORIES, type AppSettings, type DayType } from "@/types/app";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Briefcase, Coffee } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default function Parametres() {
  const { settings, updateSettings } = useSettings();
  const { signOut, user } = useAuth();

  const updateWeight = (key: keyof typeof settings.weights, value: number) => {
    updateSettings({ ...settings, weights: { ...settings.weights, [key]: value } });
  };

  const updateFinance = (key: string, value: number) => {
    updateSettings({ ...settings, financeConfig: { ...settings.financeConfig, [key]: value } });
  };

  const updateBudget = (category: string, value: number) => {
    updateSettings({ ...settings, financeConfig: { ...settings.financeConfig, budgets: { ...settings.financeConfig.budgets, [category]: value } } });
  };

  const toggleSportDay = (day: number) => {
    const current = settings.joursSport || [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort();
    updateSettings({ ...settings, joursSport: next });
  };

  const toggleDefaultDayType = (dayOfWeek: number) => {
    const current: DayType = settings.defaultDayTypes?.[dayOfWeek] ?? (dayOfWeek === 0 || dayOfWeek === 6 ? "repos" : "travail");
    const next: DayType = current === "travail" ? "repos" : "travail";
    updateSettings({
      ...settings,
      defaultDayTypes: { ...settings.defaultDayTypes, [dayOfWeek]: next },
    });
  };

  const totalWeight = Object.values(settings.weights).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" /> Déconnexion
        </Button>
      </div>

      {user && (
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Connecté : {user.email}</p>
        </div>
      )}

      {/* Types de journée par défaut */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Type de journée par défaut</h3>
        <p className="text-xs text-muted-foreground">Cliquez pour basculer Travail ↔ Repos</p>
        <div className="grid grid-cols-7 gap-2">
          {JOURS.map((label, i) => {
            const type: DayType = settings.defaultDayTypes?.[i] ?? (i === 0 || i === 6 ? "repos" : "travail");
            return (
              <button
                key={i}
                onClick={() => toggleDefaultDayType(i)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                  type === "travail" ? "border-primary/40 bg-primary/10" : "border-accent/40 bg-accent/10"
                }`}
              >
                <span className="text-xs font-medium text-foreground">{label}</span>
                {type === "travail" ? (
                  <Briefcase className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Coffee className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Jours d'entraînement */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Jours d'entraînement</h3>
        <p className="text-xs text-muted-foreground">L'habitude Musculation n'apparaît que ces jours</p>
        <div className="grid grid-cols-7 gap-2">
          {JOURS.map((label, i) => {
            const active = (settings.joursSport || [1, 2, 4, 5]).includes(i);
            return (
              <button
                key={i}
                onClick={() => toggleSportDay(i)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                  active ? "border-primary/40 bg-primary/10" : "border-border bg-muted/30"
                }`}
              >
                <span className="text-xs font-medium text-foreground">{label}</span>
                <Checkbox checked={active} className="pointer-events-none" />
              </button>
            );
          })}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pondérations</h3>
          <span className="text-xs text-muted-foreground">Total : {totalWeight}%</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(settings.weights) as [keyof typeof settings.weights, number][]).map(([key, val]) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs text-muted-foreground capitalize">{key}</Label>
              <Input type="number" value={val} onChange={(e) => updateWeight(key, parseInt(e.target.value) || 0)} className="bg-muted border-border" />
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Finances</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Revenu moyen (MAD)</Label>
            <Input type="number" value={settings.financeConfig.revenuMoyen} onChange={(e) => updateFinance("revenuMoyen", parseInt(e.target.value) || 0)} className="bg-muted border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Revenu réel (MAD)</Label>
            <Input type="number" value={settings.financeConfig.revenuReel} onChange={(e) => updateFinance("revenuReel", parseInt(e.target.value) || 0)} className="bg-muted border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Objectif épargne (%)</Label>
            <Input type="number" value={settings.financeConfig.objectifEpargne} onChange={(e) => updateFinance("objectifEpargne", parseInt(e.target.value) || 0)} className="bg-muted border-border" />
          </div>
        </div>
        <Separator className="bg-border" />
        <h4 className="text-xs text-muted-foreground">Budgets par catégorie (MAD)</h4>
        <div className="grid grid-cols-2 gap-3">
          {EXPENSE_CATEGORIES.map((cat) => (
            <div key={cat.value} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{cat.label}</Label>
              <Input type="number" value={settings.financeConfig.budgets[cat.value]} onChange={(e) => updateBudget(cat.value, parseInt(e.target.value) || 0)} className="bg-muted border-border" />
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Autres</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Objectif calorique (kcal/jour)</Label>
            <Input type="number" value={settings.objectifCalories || 2800} onChange={(e) => updateSettings({ ...settings, objectifCalories: parseInt(e.target.value) || 2800 })} className="bg-muted border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Limite écran (min)</Label>
            <Input type="number" value={settings.limiteEcran} onChange={(e) => updateSettings({ ...settings, limiteEcran: parseInt(e.target.value) || 0 })} className="bg-muted border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Sommeil optimal (h min)</Label>
            <Input type="number" value={settings.heuresSommeilOptimales[0]} onChange={(e) => updateSettings({ ...settings, heuresSommeilOptimales: [parseInt(e.target.value) || 7, settings.heuresSommeilOptimales[1]] })} className="bg-muted border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Sommeil optimal (h max)</Label>
            <Input type="number" value={settings.heuresSommeilOptimales[1]} onChange={(e) => updateSettings({ ...settings, heuresSommeilOptimales: [settings.heuresSommeilOptimales[0], parseInt(e.target.value) || 8] })} className="bg-muted border-border" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
