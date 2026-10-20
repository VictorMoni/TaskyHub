"use client";
import { signIn } from "next-auth/react";
import { Brand } from "./AppShell";
import ThemeToggle from "./ThemeToggle";
import Icon from "./Icon";

export default function LoginPage() {
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
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
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
