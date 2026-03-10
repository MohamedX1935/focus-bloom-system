import { useState } from "react";
import { useProductivity } from "@/hooks/useSupabaseData";
import {
  type ProductivityEntry,
  type Task,
  type ProductivitySession,
  type TaskPriority,
  type SessionType,
} from "@/types/app";
import { ScoreRing } from "@/components/ScoreRing";
import { DateNavigator } from "@/components/DateNavigator";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Check, Plus, Trash2, Clock, BookOpen, GraduationCap, Brain,
  ChevronDown, ChevronUp, ListTodo, Timer,
} from "lucide-react";
import { computeProductivityScore } from "@/lib/productivityScoring";

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

const SESSION_TYPES: { value: SessionType; label: string; icon: React.ReactNode }[] = [
  { value: "deep-work", label: "Deep Work", icon: <Brain className="h-4 w-4" /> },
  { value: "formation", label: "Formation", icon: <BookOpen className="h-4 w-4" /> },
  { value: "academique", label: "Académique", icon: <GraduationCap className="h-4 w-4" /> },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  haute: "text-destructive",
  moyenne: "text-warning",
  basse: "text-muted-foreground",
};

export default function Productivite() {
  const [selectedDate, setSelectedDate] = useState(getTodayKey());
  const { productivityData, upsertDay } = useProductivity();
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("moyenne");
  const [sessionType, setSessionType] = useState<SessionType>("deep-work");
  const [sessionDuration, setSessionDuration] = useState(60);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const entry: ProductivityEntry = productivityData[selectedDate] || {
    date: selectedDate,
    tasks: [],
    sessions: [],
  };

  const updateEntry = (partial: Partial<ProductivityEntry>) => {
    const updated = { ...entry, ...partial };
    upsertDay(selectedDate, updated);
  };

  // ─── Tasks ───
  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      title: newTask.trim(),
      done: false,
      date: selectedDate,
      priority: newPriority,
    };
    updateEntry({ tasks: [...entry.tasks, task] });
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    updateEntry({ tasks: entry.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) });
  };

  const removeTask = (id: string) => {
    updateEntry({
      tasks: entry.tasks.filter((t) => t.id !== id),
      sessions: entry.sessions.map((s) => ({
        ...s,
        taskIds: s.taskIds.filter((tid) => tid !== id),
      })),
    });
  };

  // ─── Sessions ───
  const addSession = () => {
    const session: ProductivitySession = {
      id: crypto.randomUUID(),
      date: selectedDate,
      type: sessionType,
      durationMinutes: sessionDuration,
      completed: false,
      taskIds: [],
    };
    updateEntry({ sessions: [...entry.sessions, session] });
  };

  const toggleSession = (id: string) => {
    updateEntry({
      sessions: entry.sessions.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)),
    });
  };

  const removeSession = (id: string) => {
    updateEntry({
      sessions: entry.sessions.filter((s) => s.id !== id),
      tasks: entry.tasks.map((t) => (t.sessionId === id ? { ...t, sessionId: undefined } : t)),
    });
  };

  const assignTaskToSession = (taskId: string, sessionId: string) => {
    updateEntry({
      tasks: entry.tasks.map((t) => (t.id === taskId ? { ...t, sessionId } : t)),
      sessions: entry.sessions.map((s) =>
        s.id === sessionId && !s.taskIds.includes(taskId)
          ? { ...s, taskIds: [...s.taskIds, taskId] }
          : s
      ),
    });
  };

  const unassignTask = (taskId: string, sessionId: string) => {
    updateEntry({
      tasks: entry.tasks.map((t) => (t.id === taskId ? { ...t, sessionId: undefined } : t)),
      sessions: entry.sessions.map((s) =>
        s.id === sessionId ? { ...s, taskIds: s.taskIds.filter((id) => id !== taskId) } : s
      ),
    });
  };

  const score = computeProductivityScore(entry);
  const totalSessionMinutes = entry.sessions.filter((s) => s.completed).reduce((sum, s) => sum + s.durationMinutes, 0);
  const completedSessions = entry.sessions.filter((s) => s.completed).length;
  const tasksDone = entry.tasks.filter((t) => t.done).length;
  const unassignedTasks = entry.tasks.filter((t) => !t.sessionId);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Productivité</h1>
          <p className="text-sm text-muted-foreground">
            {completedSessions} session{completedSessions !== 1 ? "s" : ""} · {totalSessionMinutes}min · {tasksDone}/{entry.tasks.length} tâches
          </p>
        </div>
        <ScoreRing score={score} size={64} strokeWidth={5} />
      </div>

      <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />

      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="sessions" className="flex-1 gap-1.5">
            <Timer className="h-3.5 w-3.5" /> Sessions
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex-1 gap-1.5">
            <ListTodo className="h-3.5 w-3.5" /> Tâches
          </TabsTrigger>
        </TabsList>

        {/* ═══ SESSIONS TAB ═══ */}
        <TabsContent value="sessions" className="space-y-4 mt-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-medium text-foreground">Nouvelle session</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select value={sessionType} onValueChange={(v) => setSessionType(v as SessionType)}>
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_TYPES.map((st) => (
                      <SelectItem key={st.value} value={st.value}>
                        <span className="flex items-center gap-2">{st.icon} {st.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Durée (min)</Label>
                <Input
                  type="number"
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(parseInt(e.target.value) || 0)}
                  className="bg-muted border-border"
                />
              </div>
            </div>
            <Button onClick={addSession} className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Créer la session
            </Button>
          </motion.div>

          {entry.sessions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Aucune session ce jour</p>
          )}
          {entry.sessions.map((session, i) => {
            const st = SESSION_TYPES.find((s) => s.value === session.type);
            const sessionTasks = entry.tasks.filter((t) => session.taskIds.includes(t.id));
            const isExpanded = expandedSession === session.id;
            const sessionTasksDone = sessionTasks.filter((t) => t.done).length;

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card rounded-xl overflow-hidden border ${session.completed ? "border-primary/30" : "border-border"}`}
              >
                <div className="p-4 flex items-center gap-3">
                  <button
                    onClick={() => toggleSession(session.id)}
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors shrink-0 ${session.completed ? "bg-primary" : "bg-muted border border-border"}`}
                  >
                    {session.completed && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {st?.icon}
                      <span className={`text-sm font-medium ${session.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {st?.label}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {session.durationMinutes}min
                      </span>
                    </div>
                    {sessionTasks.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {sessionTasksDone}/{sessionTasks.length} tâches complétées
                      </p>
                    )}
                  </div>
                  <button onClick={() => setExpandedSession(isExpanded ? null : session.id)} className="text-muted-foreground hover:text-foreground">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <button onClick={() => removeSession(session.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 space-y-2 bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground">Tâches de la session</p>
                    {sessionTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${task.done ? "bg-primary" : "bg-background border border-border"}`}
                        >
                          {task.done && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                        </button>
                        <span className={`text-sm flex-1 ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {task.title}
                        </span>
                        <button onClick={() => unassignTask(task.id, session.id)} className="text-xs text-muted-foreground hover:text-destructive">
                          retirer
                        </button>
                      </div>
                    ))}
                    {unassignedTasks.length > 0 && (
                      <Select onValueChange={(taskId) => assignTaskToSession(taskId, session.id)}>
                        <SelectTrigger className="h-8 text-xs bg-background border-border mt-1">
                          <SelectValue placeholder="+ Assigner une tâche..." />
                        </SelectTrigger>
                        <SelectContent>
                          {unassignedTasks.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </TabsContent>

        {/* ═══ TASKS TAB ═══ */}
        <TabsContent value="tasks" className="space-y-4 mt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nouvelle tâche..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              className="bg-muted border-border flex-1"
            />
            <Select value={newPriority} onValueChange={(v) => setNewPriority(v as TaskPriority)}>
              <SelectTrigger className="w-28 bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="haute">Haute</SelectItem>
                <SelectItem value="moyenne">Moyenne</SelectItem>
                <SelectItem value="basse">Basse</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addTask} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {entry.tasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune tâche ce jour</p>
            )}
            {entry.tasks.map((task, i) => {
              const linkedSession = entry.sessions.find((s) => s.id === task.sessionId);
              const stInfo = linkedSession ? SESSION_TYPES.find((s) => s.value === linkedSession.type) : null;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-card rounded-lg p-3 flex items-center gap-3"
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${task.done ? "bg-primary" : "bg-muted border border-border"}`}
                  >
                    {task.done && <Check className="h-3 w-3 text-primary-foreground" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm ${task.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-medium uppercase ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                      {stInfo && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          {stInfo.icon} {stInfo.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => removeTask(task.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
