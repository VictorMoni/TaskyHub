export type Recurrence = "none" | "daily" | "weekly" | "monthly";
export type FilterType = "all" | "pending" | "completed";

export type Task = {
  _id: string;
  title: string;
  done: boolean;
  createdAt?: string;
  dueDate?: string;
  recurrence: Recurrence;
};

export const filterOptions: { label: string; value: FilterType }[] = [
  { label: "Todas", value: "all" },
  { label: "Pendentes", value: "pending" },
  { label: "Concluídas", value: "completed" },
];

export const recurrenceOptions: { label: string; value: Recurrence }[] = [
  { label: "Sem recorrência", value: "none" },
  { label: "Diária", value: "daily" },
  { label: "Semanal", value: "weekly" },
  { label: "Mensal", value: "monthly" },
];

export function formatDateTimeLocal(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type SortOrder = "asc" | "desc";
export function selectTasks(
  tasks: Task[],
  searchTerm: string,
  filter: FilterType,
  sortOrder: SortOrder,
) {
  return tasks
    .filter((t) => t.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((t) =>
      filter === "all" ? true : filter === "pending" ? !t.done : t.done,
    )
    .sort((a, b) =>
      sortOrder === "asc"
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title),
    );
}
export function summarizeTasks(tasks: Task[], now = new Date()) {
  const completedCount = tasks.filter((t) => t.done).length;
  return {
    completedCount,
    pendingCount: tasks.length - completedCount,
    overdueCount: tasks.filter(
      (t) => !t.done && t.dueDate && new Date(t.dueDate) < now,
    ).length,
    progress: tasks.length
      ? Math.round((completedCount / tasks.length) * 100)
      : 0,
  };
}
export function toDateTimeInput(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
