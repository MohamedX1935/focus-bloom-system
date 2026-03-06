import { useScreen, useSettings, useAppClassifications } from "@/hooks/useSupabaseData";
import { type ScreenEntry, type AppCategory, type ScreenAppEntry } from "@/types/app";
import { ScoreRing } from "@/components/ScoreRing";
import { classifyApp } from "@/lib/appClassifier";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

export default function Ecran() {
  const today = getTodayKey();
  const { settings } = useSettings();
  const { screenData, upsertDay } = useScreen();
  const { classifications, setClassification } = useAppClassifications();
  const [newAppName, setNewAppName] = useState("");
  const [newAppMinutes, setNewAppMinutes] = useState("");

  const todayData = screenData[today] as (ScreenEntry & { apps?: ScreenAppEntry[] }) | undefined;
  const todayApps: ScreenAppEntry[] = (todayData as any)?.apps || [];

  function recalcAndSave(apps: ScreenAppEntry[]) {
    const productif = apps.filter((a) => a.category === "productivite").reduce((s, a) => s + a.minutes, 0);
    const neutre = apps.filter((a) => a.category === "neutre").reduce((s, a) => s + a.minutes, 0);
    const dopamine = apps.filter((a) => a.category === "dopamine").reduce((s, a) => s + a.minutes, 0);
    const total = apps.reduce((s, a) => s + a.minutes, 0);
    const entry: ScreenEntry = { date: today, tempsTotal: total, tempsProductif: productif, tempsNeutre: neutre, tempsDopamine: dopamine };
    upsertDay(today, entry, apps);
  }

  function addApp() {
    const name = newAppName.trim();
    const minutes = parseInt(newAppMinutes) || 0;
    if (!name || minutes <= 0) return;
    const category = classifyApp(name, classifications);
    const newEntry: ScreenAppEntry = { appName: name, minutes, category };
    const updated = [...todayApps, newEntry];
    recalcAndSave(updated);
    setNewAppName("");
    setNewAppMinutes("");
    toast({ title: `${name} ajoutée`, description: `Classée: ${categoryLabels[category]}` });
  }

  function removeApp(idx: number) {
    const updated = todayApps.filter((_, i) => i !== idx);
    recalcAndSave(updated);
  }

  function reclassifyApp(idx: number, newCategory: AppCategory) {
    const app = todayApps[idx];
    setClassification(app.appName, newCategory);
    const updated = todayApps.map((a, i) => (i === idx ? { ...a, category: newCategory } : a));
    recalcAndSave(updated);
  }

  const entry: ScreenEntry = todayData || { date: today, tempsTotal: 0, tempsProductif: 0, tempsNeutre: 0, tempsDopamine: 0 };
  const { tempsTotal, tempsProductif, tempsDopamine, tempsNeutre } = entry;
  const limiteMinutes = settings.limiteEcran;
  let score = 100;
  if (tempsTotal > 0) {
    const qualityRatio = (tempsProductif - tempsDopamine * 1.5) / tempsTotal;
    const qualityScore = Math.max(0, Math.min(50, 25 + qualityRatio * 50));
    const overLimit = Math.max(0, tempsTotal - limiteMinutes);
    const timeScore = Math.max(0, 50 - overLimit * 0.5);
    const dopamineRatio = tempsDopamine / tempsTotal;
    const dopaminePenalty = dopamineRatio > 0.3 ? (dopamineRatio - 0.3) * 100 : 0;
    score = Math.round(Math.max(0, Math.min(100, qualityScore + timeScore - dopaminePenalty)));
  }

  const formatMin = (m: number) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;

  const categoryColors: Record<AppCategory, string> = {
    productivite: "bg-primary",
    neutre: "bg-secondary",
    dopamine: "bg-destructive",
  };

  const categoryLabels: Record<AppCategory, string> = {
    productivite: "Productif",
    neutre: "Neutre",
    dopamine: "Dopamine",
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Écran</h1>
        <p className="text-sm text-muted-foreground">Limite : {formatMin(limiteMinutes)}</p>
      </div>
      <div className="flex justify-center">
        <ScoreRing score={score} size={120} label={tempsTotal > 0 ? formatMin(tempsTotal) : "—"} />
      </div>

      {tempsTotal > 0 && (
        <div className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex h-3 rounded-full overflow-hidden">
            <div className="bg-primary" style={{ width: `${(tempsProductif / tempsTotal) * 100}%` }} />
            <div className="bg-secondary" style={{ width: `${(tempsNeutre / tempsTotal) * 100}%` }} />
            <div className="bg-destructive" style={{ width: `${(tempsDopamine / tempsTotal) * 100}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Productif {formatMin(tempsProductif)}</span>
            <span>Neutre {formatMin(tempsNeutre)}</span>
            <span>Dopamine {formatMin(tempsDopamine)}</span>
          </div>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ajouter une application</h3>
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Label className="text-[10px] text-muted-foreground">Application</Label>
            <Input value={newAppName} onChange={(e) => setNewAppName(e.target.value)} placeholder="Ex: Instagram, ChatGPT..." className="bg-muted border-border h-9 text-sm" onKeyDown={(e) => e.key === "Enter" && addApp()} />
          </div>
          <div className="w-24 space-y-1">
            <Label className="text-[10px] text-muted-foreground">Minutes</Label>
            <Input type="number" value={newAppMinutes} onChange={(e) => setNewAppMinutes(e.target.value)} placeholder="45" className="bg-muted border-border h-9 text-sm" onKeyDown={(e) => e.key === "Enter" && addApp()} />
          </div>
          <div className="flex items-end">
            <Button onClick={addApp} size="icon" className="h-9 w-9"><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">📌 La classification est automatique. Vous pouvez la corriger manuellement.</p>
      </motion.div>

      <div className="space-y-2">
        {todayApps.length === 0 ? (
          <div className="glass-card rounded-xl p-6 text-center text-muted-foreground text-sm">Ajoutez vos applications pour calculer le score</div>
        ) : (
          todayApps.sort((a, b) => b.minutes - a.minutes).map((app, idx) => {
            const originalIdx = todayApps.indexOf(app);
            return (
              <motion.div key={`${app.appName}-${originalIdx}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-xl p-3 flex items-center gap-3">
                <div className={`w-2 h-8 rounded-full ${categoryColors[app.category]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{app.appName}</p>
                  <p className="text-xs text-muted-foreground">{formatMin(app.minutes)}</p>
                </div>
                <Select value={app.category} onValueChange={(v) => reclassifyApp(originalIdx, v as AppCategory)}>
                  <SelectTrigger className="w-28 h-7 text-xs bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="productivite">✅ Productif</SelectItem>
                    <SelectItem value="neutre">⚪ Neutre</SelectItem>
                    <SelectItem value="dopamine">🔴 Dopamine</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeApp(originalIdx)}><Trash2 className="h-3 w-3" /></Button>
              </motion.div>
            );
          })
        )}
      </div>

      {Object.keys(classifications).length > 0 && (
        <p className="text-[10px] text-muted-foreground text-center">{Object.keys(classifications).length} correction(s) mémorisée(s)</p>
      )}
    </div>
  );
}
