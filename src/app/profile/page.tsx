"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icon";
import { toast } from "sonner";
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (session)
      fetch("/api/tasks")
        .then((res) => res.json())
        .then((data) => setCount(Array.isArray(data) ? data.length : null))
        .catch(() => setCount(null));
  }, [session]);
  const handleDelete = async () => {
    if (!confirm("Excluir conta e todas as tarefas?")) return;
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Conta e tarefas excluídas!");
      signOut({ callbackUrl: "/" });
    } catch {
      toast.error("Erro ao excluir conta");
    }
  };
  if (status === "loading")
    return (
      <main className="loading-screen" role="status">
        <span className="loading-dot" />
        Preparando seu perfil…
      </main>
    );
  if (!session)
    return (
      <main className="loading-screen">
        <div>
          <p>Entre para acessar seu perfil.</p>
          <Link href="/" className="button primary">
            Voltar ao início
          </Link>
        </div>
      </main>
    );
  const user = session.user;
  return (
    <AppShell name={user?.name} active="profile">
      <header className="workspace-header">
        <div>
          <span className="eyebrow">SEU ESPAÇO PESSOAL</span>
          <h1>
            Meu perfil<span className="heading-dot">.</span>
          </h1>
          <p>As informações da sua conta, em um só lugar.</p>
        </div>
        <Link href="/" className="button">
          <Icon name="grid" size={17} />
          Minhas tarefas
        </Link>
      </header>
      <div className="profile-grid">
        <section className="panel profile-panel">
          <div className="profile-identity">
            <span className="avatar">
              {user?.name?.trim().charAt(0) || "T"}
            </span>
            <div>
              <strong>{user?.name}</strong>
              <p>Seu espaço, do seu jeito.</p>
            </div>
          </div>
          <dl className="profile-details">
            <div>
              <dt>Nome</dt>
              <dd>{user?.name}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>Acesso à conta</dt>
              <dd>Conectada com Google</dd>
            </div>
          </dl>
        </section>
        <div>
          <section className="panel profile-panel">
            <span className="section-icon">
              <Icon name="grid" />
            </span>
            <h2 style={{ marginTop: 16 }}>Seu planejamento</h2>
            <strong style={{ fontSize: 40, letterSpacing: -2 }}>
              {count === null ? "—" : count.toString().padStart(2, "0")}
            </strong>
            <p className="profile-info">
              Tarefas no seu espaço. Continue de onde parou e dê o próximo
              passo.
            </p>
            <Link href="/" className="button primary">
              Ver minhas tarefas
              <Icon name="arrow" size={17} />
            </Link>
          </section>
          <section className="panel danger-panel">
            <h2>Gerenciar conta</h2>
            <p>
              A exclusão remove sua conta e todas as tarefas associadas. Esta
              ação não pode ser desfeita.
            </p>
            <button className="button danger-quiet" onClick={handleDelete}>
              <Icon name="trash" size={17} />
              Excluir conta e tarefas
            </button>
          </section>
        </div>
      </div>
      <footer className="workspace-footer">
        Organize seu dia. Respeite seu ritmo.<span>TaskyHub</span>
      </footer>
    </AppShell>
  );
}
