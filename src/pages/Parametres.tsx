import { useLocalStorage } from "@/hooks/useLocalStorage";
import { DEFAULT_SETTINGS, EXPENSE_CATEGORIES, type AppSettings } from "@/types/app";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function Parametres() {
  const [settings, setSettings] = useLocalStorage<AppSettings>("discipline-settings", DEFAULT_SETTINGS);

  const updateWeight = (key: keyof typeof settings.weights, value: number) => {
    setSettings((prev) => ({ ...prev, weights: { ...prev.weights, [key]: value } }));
  };

  const updateFinance = (key: string, value: number) => {
    setSettings((prev) => ({
      ...prev,
      financeConfig: { ...prev.financeConfig, [key]: value },
    }));
  };

  const updateBudget = (category: string, value: number) => {
    setSettings((prev) => ({
      ...prev,
      financeConfig: { ...prev.financeConfig, budgets: { ...prev.financeConfig.budgets, [category]: value } },
    }));
  };

  const totalWeight = Object.values(settings.weights).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>

      {/* Weights */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pondérations</h3>
          <span className="text-xs text-muted-foreground">Total : {totalWeight}%</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(settings.weights) as [keyof typeof settings.weights, number][]).map(([key, val]) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs text-muted-foreground capitalize">{key}</Label>
              <Input
                type="number"
                value={val}
                onChange={(e) => updateWeight(key, parseInt(e.target.value) || 0)}
                className="bg-muted border-border"
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Finance settings */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5 space-y-4">
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
              <Input
                type="number"
                value={settings.financeConfig.budgets[cat.value]}
                onChange={(e) => updateBudget(cat.value, parseInt(e.target.value) || 0)}
                className="bg-muted border-border"
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Other settings */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Autres</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Limite écran (min)</Label>
            <Input type="number" value={settings.limiteEcran} onChange={(e) => setSettings(p => ({ ...p, limiteEcran: parseInt(e.target.value) || 0 }))} className="bg-muted border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Sommeil optimal (h min)</Label>
            <Input type="number" value={settings.heuresSommeilOptimales[0]} onChange={(e) => setSettings(p => ({ ...p, heuresSommeilOptimales: [parseInt(e.target.value) || 7, p.heuresSommeilOptimales[1]] }))} className="bg-muted border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Sommeil optimal (h max)</Label>
            <Input type="number" value={settings.heuresSommeilOptimales[1]} onChange={(e) => setSettings(p => ({ ...p, heuresSommeilOptimales: [p.heuresSommeilOptimales[0], parseInt(e.target.value) || 8] }))} className="bg-muted border-border" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
