import type { ProductivityEntry } from "@/types/app";

/**
 * Productivity score based on:
 * - Sessions (70%): completed session minutes vs 120min daily goal
 * - Session-linked tasks (20%): done tasks that are linked to a session
 * - Independent tasks (10%): done tasks not linked to any session
 */
export function computeProductivityScore(entry: ProductivityEntry | undefined): number {
  if (!entry) return 0;

  const sessions = entry.sessions || [];
  const tasks = entry.tasks || [];

  // ── Sessions score (70%) ──
  const completedMinutes = sessions
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
  const sessionGoal = 120; // daily goal in minutes
  const sessionScore = Math.min(100, (completedMinutes / sessionGoal) * 100);

  // ── Session-linked tasks score (20%) ──
  const linkedTasks = tasks.filter((t) => t.sessionId);
  const linkedDone = linkedTasks.filter((t) => t.done).length;
  const linkedTotal = linkedTasks.length || 1;
  const linkedScore = (linkedDone / linkedTotal) * 100;

  // ── Independent tasks score (10%) ──
  const indepTasks = tasks.filter((t) => !t.sessionId);
  const indepDone = indepTasks.filter((t) => t.done).length;
  const indepTotal = indepTasks.length || 1;
  const indepScore = (indepDone / indepTotal) * 100;

  return Math.round(sessionScore * 0.7 + linkedScore * 0.2 + indepScore * 0.1);
}
