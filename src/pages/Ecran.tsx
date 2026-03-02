import { useLocalStorage, getTodayKey } from "@/hooks/useLocalStorage";
import { DEFAULT_SETTINGS, type ScreenEntry, type AppSettings } from "@/types/app";
import { ScoreRing } from "@/components/ScoreRing";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Ecran() {
  const today = getTodayKey();
  const [settings] = useLocalStorage<AppSettings>("discipline-settings", DEFAULT_SETTINGS);
  const [data, setData] = useLocalStorage<Record<string, ScreenEntry>>("discipline-screen", {});

  const entry: ScreenEntry = data[today] || {
    date: today,
    tempsTotal: 0,
    tempsProductif: 0,
    tempsNeutre: 0,
    tempsDopamine: 0,
  };

  const update = (partial: Partial<ScreenEntry>) => {
    const updated = { ...entry, ...partial };
    setData((prev) => ({ ...prev, [today]: updated }));
  };

  const { tempsTotal, tempsProductif, tempsDopamine, tempsNeutre } = entry;
  let score = 0;
  if (tempsTotal > 0) {
    const ratio = (tempsProductif - tempsDopamine) / tempsTotal;
    const timeScore = Math.max(0, 100 - Math.max(0, tempsTotal - settings.limiteEcran) * 0.5);
    score = Math.round(Math.max(0, Math.min(100, 50 + ratio * 50 + (timeScore - 50) * 0.5)));
  } else {
    score = 100;
  }

  const formatMin = (m: number) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Écran</h1>
        <p className="text-sm text-muted-foreground">Limite : {formatMin(settings.limiteEcran)}</p>
      </div>

      <div className="flex justify-center">
        <ScoreRing score={score} size={120} label={tempsTotal > 0 ? formatMin(tempsTotal) : "—"} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-5 space-y-4"
      >
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Saisie manuelle (minutes)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Total</Label>
            <Input
              type="number"
              value={entry.tempsTotal || ""}
              onChange={(e) => update({ tempsTotal: parseInt(e.target.value) || 0 })}
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Productif</Label>
            <Input
              type="number"
              value={entry.tempsProductif || ""}
              onChange={(e) => update({ tempsProductif: parseInt(e.target.value) || 0 })}
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Neutre</Label>
            <Input
              type="number"
              value={entry.tempsNeutre || ""}
              onChange={(e) => update({ tempsNeutre: parseInt(e.target.value) || 0 })}
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Dopamine</Label>
            <Input
              type="number"
              value={entry.tempsDopamine || ""}
              onChange={(e) => update({ tempsDopamine: parseInt(e.target.value) || 0 })}
              className="bg-muted border-border"
            />
          </div>
        </div>

        {/* Distribution bar */}
        {tempsTotal > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Distribution</div>
            <div className="flex h-3 rounded-full overflow-hidden">
              <div className="bg-primary" style={{ width: `${(tempsProductif / tempsTotal) * 100}%` }} />
              <div className="bg-secondary" style={{ width: `${(tempsNeutre / tempsTotal) * 100}%` }} />
              <div className="bg-destructive" style={{ width: `${(tempsDopamine / tempsTotal) * 100}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Productif</span>
              <span>Neutre</span>
              <span>Dopamine</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
