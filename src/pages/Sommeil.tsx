import { useSleep, useSettings } from "@/hooks/useSupabaseData";
import { type SleepEntry } from "@/types/app";
import { ScoreRing } from "@/components/ScoreRing";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

export default function Sommeil() {
  const today = getTodayKey();
  const { settings } = useSettings();
  const { sleepData, upsertDay } = useSleep();

  const entry: SleepEntry = sleepData[today] || {
    date: today,
    heureCoucher: "",
    heureReveil: "",
    reveilNocturne: false,
  };

  const update = (partial: Partial<SleepEntry>) => {
    const updated = { ...entry, ...partial };
    upsertDay(today, updated);
  };

  let duration = 0;
  if (entry.heureCoucher && entry.heureReveil) {
    const [hC, mC] = entry.heureCoucher.split(":").map(Number);
    const [hR, mR] = entry.heureReveil.split(":").map(Number);
    let coucher = hC * 60 + mC;
    let reveil = hR * 60 + mR;
    if (reveil < coucher) reveil += 24 * 60;
    duration = (reveil - coucher) / 60;
    if (entry.reveilNocturne) duration -= 0.5;
  }

  const [min, max] = settings.heuresSommeilOptimales;
  let score = 0;
  if (duration > 0) {
    if (duration >= min && duration <= max) score = 100;
    else if (duration < min) score = Math.max(0, Math.round((duration / min) * 100));
    else score = Math.max(0, Math.round(100 - (duration - max) * 20));
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Sommeil</h1>
        <p className="text-sm text-muted-foreground">Objectif : {min}-{max}h</p>
      </div>
      <div className="flex justify-center">
        <ScoreRing score={score} size={120} label={duration > 0 ? `${duration.toFixed(1)}h` : "—"} />
      </div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Heure coucher</Label>
            <Input type="time" value={entry.heureCoucher} onChange={(e) => update({ heureCoucher: e.target.value })} className="bg-muted border-border" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Heure réveil</Label>
            <Input type="time" value={entry.heureReveil} onChange={(e) => update({ heureReveil: e.target.value })} className="bg-muted border-border" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm text-foreground">Réveil nocturne</Label>
          <Switch checked={entry.reveilNocturne} onCheckedChange={(checked) => update({ reveilNocturne: checked })} />
        </div>
      </motion.div>
    </div>
  );
}
