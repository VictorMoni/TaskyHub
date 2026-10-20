"use client";
import { useSession } from "next-auth/react";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icon";
import ConfirmModal from "@/components/ConfirmModal";
import LoginPage from "@/components/LoginPage";
import { motion } from "framer-motion";
import { useTaskWorkspace } from "@/hooks/useTaskWorkspace";
import {
  selectTasks,
  summarizeTasks,
  filterOptions,
  recurrenceOptions,
  formatDateTimeLocal,
} from "@/lib/tasks";
import type { Recurrence } from "@/lib/tasks";

export default function Home() {
  const { data: session, status } = useSession();
  const {
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
  } = useTaskWorkspace(status === "authenticated");
  const displayedTasks = selectTasks(tasks, searchTerm, filter, sortOrder);
  const { completedCount, pendingCount, overdueCount, progress } =
    summarizeTasks(tasks);
  if (status === "loading")
    return (
      <main className="loading-screen" role="status">
        <span className="loading-dot" />
        Preparando seu espaço…
      </main>
    );
  if (!session) return <LoginPage />;

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
            <button
              className="button compact"
              style={{ marginTop: 16 }}
              onClick={retryTasks}
            >
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
