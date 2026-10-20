"use client";

import { useSession, signIn } from "next-auth/react";
import AppShell, { Brand } from "@/components/AppShell";
import Icon from "@/components/Icon";
import { useEffect, useState, useRef, useId } from "react";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import { motion } from "framer-motion";

type Recurrence = "none" | "daily" | "weekly" | "monthly";
type FilterType = "all" | "pending" | "completed";

type Task = {
  _id: string;
  title: string;
  done: boolean;
  createdAt?: string;
  dueDate?: string;
  recurrence: Recurrence;
};

const filterOptions: { label: string; value: FilterType }[] = [
  { label: "Todas", value: "all" },
  { label: "Pendentes", value: "pending" },
  { label: "Concluídas", value: "completed" },
];

const recurrenceOptions: { label: string; value: Recurrence }[] = [
  { label: "Sem recorrência", value: "none" },
  { label: "Diária", value: "daily" },
  { label: "Semanal", value: "weekly" },
  { label: "Mensal", value: "monthly" },
];

function formatDateTimeLocal(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type ConfirmProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
    if (!isOpen && dialog?.open) dialog.close();
  }, [isOpen]);
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby={headingId}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <div className="dialog-symbol">
        <Icon name="trash" size={26} />
      </div>
      <h2 id={headingId}>{title}</h2>
      <p>{message}</p>
      <div className="dialog-actions">
        <button className="button" onClick={onCancel} autoFocus>
          Cancelar
        </button>
        <button className="button danger" onClick={onConfirm}>
          Confirmar
        </button>
      </div>
    </dialog>
  );
}

export default function Home() {
  const { data: session, status } = useSession();

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

  // Load tasks
  useEffect(() => {
    if (session) fetchTasks();
  }, [session]);

  // Fetch tasks from API
  const fetchTasks = async (notifyExpired = true) => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error();
      const data: Task[] = await res.json();
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
  };

  // Add new task
  const addTask = async () => {
    if (!title.trim()) return toast.error("Título não pode ficar vazio");
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, dueDate, recurrence }),
      });
      if (!res.ok) throw new Error();
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
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: task._id, done: !task.done }),
      });
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
      await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: task._id }),
      });
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
    const date = task.dueDate ? new Date(task.dueDate) : null;
    setEditingDueDate(
      date
        ? new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
        : "",
    );
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
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: editingTaskId,
          title: editingTitle.trim(),
          dueDate: editingDueDate,
          recurrence: editingRecurrence,
        }),
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
  const handleBatchMark = async () => {
    for (const id of selected) {
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: id, done: true }),
      });
    }
    toast.success("Tarefas marcadas como feitas");
    setSelected([]);
    setBatchMode(false);
    setShowConfirmMark(false);
    fetchTasks();
  };
  const handleBatchDelete = async () => {
    for (const id of selected) {
      await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: id }),
      });
    }
    toast.success("Tarefas deletadas");
    setSelected([]);
    setBatchMode(false);
    setShowConfirmDelete(false);
    fetchTasks();
  };

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
      const text = await file.text();
      const imported: Partial<Task>[] = JSON.parse(text);
      for (const t of imported) {
        if (!t.title) continue;
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: t.title,
            dueDate: t.dueDate,
            recurrence: t.recurrence,
          }),
        });
        if (res.ok && t.done) {
          const created = await res.json();
          await fetch("/api/tasks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ _id: created._id, done: true }),
          });
        }
      }
      toast.success("Tarefas importadas!");
      fetchTasks();
    } catch {
      toast.error("Erro ao importar tarefas");
    }
  };

  // Filter, search, sort
  const displayedTasks = tasks
    .filter((t) => t.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((t) =>
      filter === "all" ? true : filter === "pending" ? !t.done : t.done,
    )
    .sort((a, b) =>
      sortOrder === "asc"
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title),
    );

  const completedCount = tasks.filter((task) => task.done).length;
  const pendingCount = tasks.length - completedCount;
  const overdueCount = tasks.filter(
    (task) => !task.done && task.dueDate && new Date(task.dueDate) < new Date(),
  ).length;
  const progress = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;

  if (status === "loading")
    return (
      <main className="loading-screen" role="status">
        <span className="loading-dot" />
        Preparando seu espaço…
      </main>
    );
  if (!session) {
    return (
      <main className="login-page">
        <header className="login-header">
          <Brand />
          <ThemeToggle />
        </header>
        <div className="login-layout">
          <section className="login-intro">
            <span className="eyebrow">MENOS RUÍDO. MAIS FOCO.</span>
            <h1>
              Seu dia, com
              <br />
              <span>mais espaço.</span>
            </h1>
            <p>
              Reúna suas tarefas, organize seus próximos passos e acompanhe cada
              pequena conquista.
            </p>
            <div className="login-features">
              <span>
                <Icon name="check" />
                Tarefas no seu ritmo
              </span>
              <span>
                <Icon name="calendar" />
                Prazos e recorrência
              </span>
              <span>
                <Icon name="grid" />
                Tudo em um só lugar
              </span>
            </div>
          </section>
          <section className="login-card">
            <div className="login-card-icon">
              <Icon name="check" size={32} />
            </div>
            <h2>Bem-vindo ao TaskyHub</h2>
            <p>Um lugar para organizar o que vem a seguir.</p>
            <button
              className="button google-button"
              onClick={() => signIn("google")}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M22 12.2c0-.7-.1-1.4-.2-2.2H12v4.2h5.6a4.8 4.8 0 0 1-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.7Z"
                />
                <path
                  fill="#34A853"
                  d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2 .9-3.5.9a6 6 0 0 1-5.7-4.2H2.8v2.7A10.4 10.4 0 0 0 12 22Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.3 13.6a6 6 0 0 1 0-3.2V7.7H2.8a10 10 0 0 0 0 8.6Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 6.2c1.5 0 2.8.5 3.8 1.5L19 4.6A10 10 0 0 0 2.8 7.7l3.5 2.7A6 6 0 0 1 12 6.2Z"
                />
              </svg>
              Entrar com Google
              <Icon name="arrow" size={18} />
            </button>
            <small>Seu planejamento começa com um próximo passo.</small>
            <div className="login-card-bottom">
              <span className="status-dot" />
              Seu espaço pessoal de produtividade
            </div>
          </section>
        </div>
        <footer className="login-footer">
          TASKYHUB <span>Feito para simplificar o seu dia.</span>
        </footer>
      </main>
    );
  }

  return (
    <AppShell name={session.user?.name}>
      <header className="workspace-header">
        <div>
          <span className="eyebrow">SEU PLANEJAMENTO, NO SEU RITMO</span>
          <h1>
            Minhas tarefas<span className="heading-dot">.</span>
          </h1>
          <p>
            Olá, {session.user?.name?.split(" ")[0]}. Vamos dar o próximo passo?
          </p>
        </div>
        <div className="today-label">
          <Icon name="calendar" />
          {new Intl.DateTimeFormat("pt-BR", {
            day: "numeric",
            month: "long",
          }).format(new Date())}
        </div>
      </header>
      <section className="stats-grid" aria-label="Resumo das tarefas">
        <div className="stat-card">
          <span className="stat-label">
            <Icon name="grid" />
            Total de tarefas
          </span>
          <strong>{tasks.length.toString().padStart(2, "0")}</strong>
          <small>Tudo em um só lugar</small>
        </div>
        <div className="stat-card">
          <span className="stat-label">
            <Icon name="clock" />
            Pendentes
          </span>
          <strong>{pendingCount.toString().padStart(2, "0")}</strong>
          <small>
            {overdueCount
              ? overdueCount + " com prazo vencido"
              : "Um passo de cada vez"}
          </small>
        </div>
        <div className="stat-card">
          <span className="stat-label">
            <Icon name="check" />
            Concluídas
          </span>
          <strong>{completedCount.toString().padStart(2, "0")}</strong>
          <small>Cada conquista conta</small>
        </div>
        <div className="stat-card progress-card">
          <span className="stat-label">Seu progresso</span>
          <strong>
            {progress}
            <em>%</em>
          </strong>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Tarefas concluídas"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: progress + "%" }} />
          </div>
        </div>
      </section>
      <section className="composer panel" aria-labelledby="new-task-heading">
        <div className="section-heading">
          <span className="section-icon">
            <Icon name="plus" />
          </span>
          <div>
            <h2 id="new-task-heading">O que vem a seguir?</h2>
            <p>Transforme uma ideia em um próximo passo.</p>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTask();
          }}
        >
          <label className="field task-title-field">
            <span>Nova tarefa</span>
            <input
              placeholder="Ex.: preparar a apresentação de sexta"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={500}
            />
          </label>
          <div className="composer-options">
            <label className="field">
              <span>
                <Icon name="calendar" size={15} />
                Prazo <small>opcional</small>
              </span>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>
            <label className="field">
              <span>
                <Icon name="repeat" size={15} />
                Repetição
              </span>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as Recurrence)}
              >
                {recurrenceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="button primary">
              <Icon name="plus" size={18} />
              Adicionar tarefa
            </button>
          </div>
        </form>
      </section>
      <section className="task-section" aria-labelledby="task-list-heading">
        <div className="list-heading">
          <div>
            <h2 id="task-list-heading">
              Sua lista <span className="count-badge">{tasks.length}</span>
            </h2>
            <p>Mais clareza para cuidar do seu dia.</p>
          </div>
          <div className="list-actions">
            <button
              className="button compact"
              onClick={() => {
                setBatchMode(!batchMode);
                if (batchMode) setSelected([]);
              }}
              aria-pressed={batchMode}
            >
              <Icon name="check" size={16} />
              {batchMode ? "Cancelar seleção" : "Selecionar"}
            </button>
            <details className="data-menu">
              <summary className="button compact">Importar / exportar</summary>
              <div className="data-menu-items">
                <button onClick={handleImportClick}>
                  <Icon name="upload" size={17} />
                  Importar JSON
                </button>
                <button onClick={handleExport}>
                  <Icon name="download" size={17} />
                  Exportar JSON
                </button>
              </div>
            </details>
            <input
              type="file"
              accept="application/json"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              aria-label="Importar tarefas"
            />
          </div>
        </div>
        <div className="list-toolbar">
          <div className="filter-tabs" aria-label="Filtrar tarefas">
            {filterOptions.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                aria-pressed={filter === f.value}
              >
                {f.label}
                <span>
                  {f.value === "all"
                    ? tasks.length
                    : f.value === "pending"
                      ? pendingCount
                      : completedCount}
                </span>
              </button>
            ))}
          </div>
          <div className="search-tools">
            <label className="search-field">
              <Icon name="search" size={18} />
              <input
                type="search"
                aria-label="Buscar tarefas"
                placeholder="Buscar tarefa…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </label>
            <select
              aria-label="Ordenar tarefas"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            >
              <option value="asc">A → Z</option>
              <option value="desc">Z → A</option>
            </select>
          </div>
        </div>
        {batchMode && (
          <div className="batch-bar">
            <span>{selected.length} selecionada(s)</span>
            <button
              className="button compact"
              onClick={() => setShowConfirmMark(true)}
              disabled={!selected.length}
            >
              Concluir selecionadas
            </button>
            <button
              className="button compact danger-quiet"
              onClick={() => setShowConfirmDelete(true)}
              disabled={!selected.length}
            >
              Excluir selecionadas
            </button>
          </div>
        )}
        {tasksLoading ? (
          <div className="empty-state panel" role="status">
            <span className="loading-dot" />
            Carregando suas tarefas…
          </div>
        ) : tasksLoadFailed ? (
          <div className="empty-state panel" role="status">
            <h3>Suas tarefas estão indisponíveis no momento</h3>
            <p>Tente carregar a lista novamente em instantes.</p>
            <button className="button compact" style={{ marginTop: 16 }} onClick={() => { setTasksLoading(true); fetchTasks(false); }}>
              Tentar novamente
            </button>
          </div>
        ) : displayedTasks.length === 0 ? (
          <div className="empty-state panel">
            <div className="empty-icon">
              <Icon name={tasks.length ? "search" : "check"} size={30} />
            </div>
            <h3>
              {tasks.length
                ? "Nenhuma tarefa por aqui"
                : "Espaço livre para começar"}
            </h3>
            <p>
              {tasks.length
                ? "Tente outra busca ou escolha um filtro diferente."
                : "Adicione sua primeira tarefa. O resto vem um passo de cada vez."}
            </p>
          </div>
        ) : (
          <ul className="task-list">
            {displayedTasks.map((task) => (
              <motion.li
                key={task._id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={"task-row panel" + (task.done ? " is-complete" : "")}
              >
                <div className="task-main">
                  {batchMode && (
                    <input
                      type="checkbox"
                      aria-label={"Selecionar " + task.title}
                      checked={selected.includes(task._id)}
                      onChange={() => toggleSelect(task._id)}
                    />
                  )}
                  <input
                    className="task-checkbox"
                    type="checkbox"
                    aria-label={"Concluir " + task.title}
                    checked={task.done}
                    onChange={() => toggleDone(task)}
                  />
                  <div className="task-content">
                    {editingTaskId === task._id ? (
                      <form
                        className="edit-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          saveEdit();
                        }}
                      >
                        <label className="field">
                          <span>Título da tarefa</span>
                          <input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") cancelEditing();
                            }}
                            autoFocus
                            required
                          />
                        </label>
                        <div className="edit-options">
                          <label className="field">
                            <span>Prazo</span>
                            <input
                              type="datetime-local"
                              value={editingDueDate}
                              onChange={(e) =>
                                setEditingDueDate(e.target.value)
                              }
                            />
                          </label>
                          <label className="field">
                            <span>Repetição</span>
                            <select
                              value={editingRecurrence}
                              onChange={(e) =>
                                setEditingRecurrence(
                                  e.target.value as Recurrence,
                                )
                              }
                            >
                              {recurrenceOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div className="edit-actions">
                          <button
                            className="button compact primary"
                            type="submit"
                          >
                            Salvar alterações
                          </button>
                          <button
                            className="button compact"
                            type="button"
                            onClick={cancelEditing}
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <span className="task-name">{task.title}</span>
                        <div className="task-meta">
                          {task.dueDate && (
                            <span>
                              <Icon name="calendar" size={14} />
                              {formatDateTimeLocal(task.dueDate)}
                            </span>
                          )}
                          {task.recurrence !== "none" && (
                            <span>
                              <Icon name="repeat" size={14} />
                              {
                                recurrenceOptions.find(
                                  (opt) => opt.value === task.recurrence,
                                )?.label
                              }
                            </span>
                          )}
                          {task.createdAt && !task.dueDate && (
                            <span>
                              Criada em {formatDateTimeLocal(task.createdAt)}
                            </span>
                          )}
                          {task.dueDate &&
                            new Date(task.dueDate) < new Date() &&
                            !task.done && (
                              <span className="overdue-badge">Vencida</span>
                            )}
                        </div>
                      </>
                    )}
                  </div>
                  {editingTaskId !== task._id && (
                    <div className="task-actions">
                      <button
                        className="icon-button"
                        onClick={() => startEditing(task)}
                        aria-label={"Editar " + task.title}
                        title="Editar tarefa"
                      >
                        <Icon name="edit" size={18} />
                      </button>
                      <button
                        className="icon-button delete-action"
                        onClick={() => deleteOne(task)}
                        aria-label={"Excluir " + task.title}
                        title="Excluir tarefa"
                      >
                        <Icon name="trash" size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </section>
      <footer className="workspace-footer">
        Menos tarefas na cabeça. Mais espaço no seu dia.<span>TaskyHub</span>
      </footer>
      <ConfirmModal
        isOpen={showConfirmMark}
        title="Concluir tarefas?"
        message="As tarefas selecionadas serão marcadas como concluídas."
        onConfirm={handleBatchMark}
        onCancel={() => setShowConfirmMark(false)}
      />
      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Excluir tarefas?"
        message="As tarefas selecionadas serão excluídas. Esta ação não pode ser desfeita."
        onConfirm={handleBatchDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </AppShell>
  );
}
