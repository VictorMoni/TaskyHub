"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";
import Icon from "./Icon";
export function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brand-icon">
        <Icon name="check" size={23} />
      </span>
      <span>
        Tasky<span className="brand-light">Hub</span>
      </span>
    </Link>
  );
}
export default function AppShell({
  children,
  active = "tasks",
  name,
}: {
  children: ReactNode;
  active?: "tasks" | "profile";
  name?: string | null;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="nav-caption">SEU ESPAÇO</div>
        <nav aria-label="Navegação principal">
          <Link href="/" aria-current={active === "tasks" ? "page" : undefined}>
            <Icon name="grid" />
            Minhas tarefas
          </Link>
          <Link
            href="/profile"
            aria-current={active === "profile" ? "page" : undefined}
          >
            <Icon name="user" />
            Meu perfil
          </Link>
          <button
            className="mobile-signout icon-button"
            onClick={() => signOut({ callbackUrl: "/" })}
            aria-label="Sair da conta"
          >
            <Icon name="logout" />
          </button>
        </nav>
        <div className="sidebar-note">
          <span className="note-mark">✦</span>
          <strong>Um passo de cada vez.</strong>
          <p>Abra espaço para o que realmente importa.</p>
        </div>
        <div className="sidebar-bottom">
          <span className="eyebrow">APARÊNCIA</span>
          <ThemeToggle />
          <div className="account">
            <span className="avatar">{name?.trim().charAt(0) || "T"}</span>
            <span>
              <strong>{name || "Minha conta"}</strong>
              <small>Espaço pessoal</small>
            </span>
            <button
              className="icon-button"
              onClick={() => signOut({ callbackUrl: "/" })}
              aria-label="Sair da conta"
              title="Sair da conta"
            >
              <Icon name="logout" />
            </button>
          </div>
        </div>
      </aside>
      <main className="workspace">{children}</main>
    </div>
  );
}
