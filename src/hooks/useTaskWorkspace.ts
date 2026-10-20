"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { Task, Recurrence, FilterType } from "@/lib/tasks";
import { toDateTimeInput } from "@/lib/tasks";
import { requestTasks } from "@/lib/tasks-api";

export function useTaskWorkspace(enabled: boolean) {
  // Main state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksLoadFailed, setTasksLoadFailed] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");

  // Inline editing
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDueDate, setEditingDueDate] = useState("");
  const [editingRecurrence, setEditingRecurrence] =
    useState<Recurrence>("none");

  // Filter/search/sort
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Batch mode
  const [batchMode, setBatchMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [showConfirmMark, setShowConfirmMark] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch tasks from API
  const fetchTasks = useCallback(async (notifyExpired = true) => {
    try {
      const data = await requestTasks<Task[]>("GET");
      setTasks(data);
      setTasksLoadFailed(false);
      if (notifyExpired) {
        const now = new Date();
        const expired = data.filter(
          (t) => t.dueDate && new Date(t.dueDate) < now && !t.done,
        );
        if (expired.length > 0) {
          toast.error(`Você tem ${expired.length} tarefa(s) vencida(s)`);
        }
      }
    } catch {
      setTasksLoadFailed(true);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void fetchTasks();
  }, [enabled, fetchTasks]);

  const retryTasks = () => {
    setTasksLoading(true);
    void fetchTasks(false);
  };

  // Add new task
  const addTask = async () => {
    if (!title.trim()) return toast.error("Título não pode ficar vazio");
    try {
      await requestTasks("POST", { title, dueDate, recurrence });
      toast.success("Tarefa criada!");
      setTitle("");
      setDueDate("");
      setRecurrence("none");
      await fetchTasks(false);
    } catch {
      toast.error("Erro ao criar tarefa");
    }
  };

  // Toggle done status
  const toggleDone = async (task: Task) => {
    try {
      await requestTasks("PUT", { _id: task._id, done: !task.done });
      toast.success(
        task.done ? "Tarefa marcada como pendente" : "Tarefa concluída",
      );
      fetchTasks();
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  // Delete single task
  const deleteOne = async (task: Task) => {
    try {
      await requestTasks("DELETE", { _id: task._id });
      toast.success("Tarefa removida");
      await fetchTasks(false);
    } catch {
      toast.error("Erro ao deletar tarefa");
    }
  };

  // Start and cancel inline editing
  const startEditing = (task: Task) => {
    setEditingTaskId(task._id);
    setEditingTitle(task.title);
    setEditingDueDate(toDateTimeInput(task.dueDate));
    setEditingRecurrence(task.recurrence);
  };
  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingTitle("");
  };

  // Save inline edit
  const saveEdit = async () => {
    if (!editingTaskId) return;
    if (!editingTitle.trim()) {
      cancelEditing();
      return toast.error("Título não pode ficar vazio");
    }
    try {
      await requestTasks("PATCH", {
        _id: editingTaskId,
        title: editingTitle.trim(),
        dueDate: editingDueDate,
        recurrence: editingRecurrence,
      });
      toast.success("Tarefa atualizada!");
      cancelEditing();
      fetchTasks();
    } catch {
      toast.error("Erro ao salvar edição");
    }
  };

  // Batch selection handlers
  const toggleSelect = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  // Confirmed batch operations
  const updateSelectedTasks = async (method: "PUT" | "DELETE") => {
    try {
      for (const id of selected) {
        await requestTasks(
          method,
          method === "PUT" ? { _id: id, done: true } : { _id: id },
        );
      }
      toast.success(
        method === "PUT" ? "Tarefas marcadas como feitas" : "Tarefas deletadas",
      );
      setSelected([]);
      setBatchMode(false);
      setShowConfirmMark(false);
      setShowConfirmDelete(false);
    } catch {
      toast.error("Não foi possível atualizar todas as tarefas selecionadas");
    } finally {
      await fetchTasks(false);
    }
  };
  const handleBatchMark = () => updateSelectedTasks("PUT");
  const handleBatchDelete = () => updateSelectedTasks("DELETE");

  // Export / Import
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported: Partial<Task>[] = JSON.parse(await file.text());
      for (const task of imported) {
        if (!task.title) continue;
        const created = await requestTasks<Task>("POST", {
          title: task.title,
          dueDate: task.dueDate,
          recurrence: task.recurrence,
        });
        if (task.done)
          await requestTasks("PUT", { _id: created._id, done: true });
      }
      toast.success("Tarefas importadas!");
      await fetchTasks();
    } catch {
      toast.error("Erro ao importar tarefas");
    } finally {
      e.target.value = "";
    }
  };

  return {
    tasks,
    tasksLoading,
    tasksLoadFailed,
    title,
    setTitle,
    dueDate,
    setDueDate,
    recurrence,
    setRecurrence,
    editingTaskId,
    editingTitle,
    setEditingTitle,
    editingDueDate,
    setEditingDueDate,
    editingRecurrence,
    setEditingRecurrence,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    sortOrder,
    setSortOrder,
    batchMode,
    setBatchMode,
    selected,
    setSelected,
    showConfirmMark,
    setShowConfirmMark,
    showConfirmDelete,
    setShowConfirmDelete,
    fileInputRef,
    retryTasks,
    addTask,
    toggleDone,
    deleteOne,
    startEditing,
    cancelEditing,
    saveEdit,
    toggleSelect,
    handleBatchMark,
    handleBatchDelete,
    handleExport,
    handleImportClick,
    handleFileChange,
  };
}
