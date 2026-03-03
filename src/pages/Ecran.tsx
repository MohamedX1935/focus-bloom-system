import { useLocalStorage, getTodayKey } from "@/hooks/useLocalStorage";
import { DEFAULT_SETTINGS, type ScreenEntry, type AppSettings, type AppClassification, type ScreenAppEntry, type AppCategory } from "@/types/app";
import { ScoreRing } from "@/components/ScoreRing";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, RefreshCw } from "lucide-react";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function Ecran() {
  const today = getTodayKey();
  const [settings] = useLocalStorage<AppSettings>("discipline-settings", DEFAULT_SETTINGS);
  const [data, setData] = useLocalStorage<Record<string, ScreenEntry>>("discipline-screen", {});
  const [classifiedApps, setClassifiedApps] = useLocalStorage<Record<string, ScreenAppEntry[]>>("discipline-screen-apps", {});
  const [userClassifications, setUserClassifications] = useLocalStorage<Record<string, AppCategory>>("discipline-app-classifications", {});
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("saisie");
  const fileRef = useRef<HTMLInputElement>(null);

  const entry: ScreenEntry = data[today] || {
    date: today,
    tempsTotal: 0,
    tempsProductif: 0,
    tempsNeutre: 0,
    tempsDopamine: 0,
  };

  const todayApps = classifiedApps[today] || [];

  const update = (partial: Partial<ScreenEntry>) => {
    const updated = { ...entry, ...partial };
    setData((prev) => ({ ...prev, [today]: updated }));
  };

  // ─── Score calculation ───
  const { tempsTotal, tempsProductif, tempsDopamine, tempsNeutre } = entry;
  const limiteMinutes = settings.limiteEcran;
  let score = 100;

  if (tempsTotal > 0) {
    // Ratio quality score (0-50 points)
    const qualityRatio = tempsTotal > 0 ? (tempsProductif - tempsDopamine * 1.5) / tempsTotal : 0;
    const qualityScore = Math.max(0, Math.min(50, 25 + qualityRatio * 50));

    // Time limit score (0-50 points) - penalize exceeding 7h (420min)
    const overLimit = Math.max(0, tempsTotal - limiteMinutes);
    const timeScore = Math.max(0, 50 - overLimit * 0.5);

    // Dopamine penalty: heavy penalty if dopamine > 30% of total
    const dopamineRatio = tempsDopamine / tempsTotal;
    const dopaminePenalty = dopamineRatio > 0.3 ? (dopamineRatio - 0.3) * 100 : 0;

    score = Math.round(Math.max(0, Math.min(100, qualityScore + timeScore - dopaminePenalty)));
  }

  const formatMin = (m: number) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;

  // ─── XLS Upload ───
  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userClassifications", JSON.stringify(userClassifications));

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/parse-screen-xls`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erreur serveur");
      }

      const result = await response.json();

      // Save classified apps
      const apps: ScreenAppEntry[] = result.apps.map((a: { appName: string; minutes: number; category: AppCategory }) => ({
        appName: a.appName,
        minutes: a.minutes,
        category: a.category,
      }));

      setClassifiedApps((prev) => ({ ...prev, [today]: apps }));

      // Update screen entry totals
      update({
        tempsTotal: result.totalMinutes,
        tempsProductif: result.productifMinutes,
        tempsNeutre: result.neutreMinutes,
        tempsDopamine: result.dopamineMinutes,
      });

      toast({ title: "Fichier analysé", description: `${apps.length} applications classifiées` });
      setActiveTab("apps");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  // ─── Reclassify app ───
  function reclassifyApp(appName: string, newCategory: AppCategory) {
    // Save user correction
    setUserClassifications((prev) => ({ ...prev, [appName.toLowerCase().trim()]: newCategory }));

    // Update today's apps
    const updatedApps = todayApps.map((a) =>
      a.appName === appName ? { ...a, category: newCategory } : a
    );
    setClassifiedApps((prev) => ({ ...prev, [today]: updatedApps }));

    // Recalculate totals
    const productif = updatedApps.filter((a) => a.category === "productivite").reduce((s, a) => s + a.minutes, 0);
    const neutre = updatedApps.filter((a) => a.category === "neutre").reduce((s, a) => s + a.minutes, 0);
    const dopamine = updatedApps.filter((a) => a.category === "dopamine").reduce((s, a) => s + a.minutes, 0);
    const total = updatedApps.reduce((s, a) => s + a.minutes, 0);

    update({ tempsTotal: total, tempsProductif: productif, tempsNeutre: neutre, tempsDopamine: dopamine });
    toast({ title: "Classification mise à jour" });
  }

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

      {/* Distribution bar */}
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="saisie">Saisie</TabsTrigger>
          <TabsTrigger value="import">Import XLS</TabsTrigger>
          <TabsTrigger value="apps">Apps ({todayApps.length})</TabsTrigger>
        </TabsList>

        {/* ─── Manual input ─── */}
        <TabsContent value="saisie">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Saisie manuelle (minutes)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Total</Label>
                <Input type="number" value={entry.tempsTotal || ""} onChange={(e) => update({ tempsTotal: parseInt(e.target.value) || 0 })} className="bg-muted border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Productif</Label>
                <Input type="number" value={entry.tempsProductif || ""} onChange={(e) => update({ tempsProductif: parseInt(e.target.value) || 0 })} className="bg-muted border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Neutre</Label>
                <Input type="number" value={entry.tempsNeutre || ""} onChange={(e) => update({ tempsNeutre: parseInt(e.target.value) || 0 })} className="bg-muted border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Dopamine</Label>
                <Input type="number" value={entry.tempsDopamine || ""} onChange={(e) => update({ tempsDopamine: parseInt(e.target.value) || 0 })} className="bg-muted border-border" />
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* ─── XLS Import ─── */}
        <TabsContent value="import">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5 space-y-4">
            <div className="text-center space-y-3">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium text-foreground">Importer un fichier XLS</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Le fichier doit contenir les colonnes : Nom d'application et Temps d'utilisation
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".xls,.xlsx,.csv"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }}
              />
              <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full">
                {uploading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {uploading ? "Analyse en cours..." : "Choisir un fichier"}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>📌 Le système classifie automatiquement les applications</p>
              <p>📌 Vous pouvez corriger les classifications manuellement</p>
              <p>📌 Les corrections sont mémorisées pour les prochains imports</p>
            </div>
          </motion.div>
        </TabsContent>

        {/* ─── Classified Apps ─── */}
        <TabsContent value="apps">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            {todayApps.length === 0 ? (
              <div className="glass-card rounded-xl p-6 text-center text-muted-foreground text-sm">
                Importez un fichier XLS pour voir les applications
              </div>
            ) : (
              todayApps
                .sort((a, b) => b.minutes - a.minutes)
                .map((app) => (
                  <div key={app.appName} className="glass-card rounded-xl p-3 flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full ${categoryColors[app.category]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{app.appName}</p>
                      <p className="text-xs text-muted-foreground">{formatMin(app.minutes)}</p>
                    </div>
                    <Select value={app.category} onValueChange={(v) => reclassifyApp(app.appName, v as AppCategory)}>
                      <SelectTrigger className="w-28 h-7 text-xs bg-muted border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="productivite">✅ Productif</SelectItem>
                        <SelectItem value="neutre">⚪ Neutre</SelectItem>
                        <SelectItem value="dopamine">🔴 Dopamine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))
            )}
            {Object.keys(userClassifications).length > 0 && (
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                {Object.keys(userClassifications).length} correction(s) mémorisée(s)
              </p>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
