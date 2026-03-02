import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ModuleCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  className?: string;
  delay?: number;
}

export function ModuleCard({ title, value, subtitle, icon, className, delay = 0 }: ModuleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "glass-card rounded-xl p-4 flex flex-col gap-2",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
    </motion.div>
  );
}
