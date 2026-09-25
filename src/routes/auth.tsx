import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-mbal.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вход · МБАЛ Балчик — Болнична информационна система" },
      { name: "description", content: "Вход за персонала на МБАЛ Балчик в болничната информационна система." },
      { property: "og:title", content: "Вход · МБАЛ Балчик" },
      { property: "og:description", content: "Вход за персонала в болничната информационна система." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setErr("Грешен имейл или парола.");
    navigate({ to: "/registry", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--word-canvas)] p-4">
      <div className="win-window w-full max-w-md">
        <div className="win-titlebar">
          <Lock className="size-4" /> МБАЛ Балчик — Вход в системата
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Лого" className="h-16 w-auto" />
            <div>
              <div className="text-lg font-bold leading-tight">МБАЛ – Балчик</div>
              <div className="text-xs text-muted-foreground">Болнична информационна система</div>
            </div>
          </div>
          <label className="block text-sm">
            Имейл
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="win-input mt-1" />
          </label>
          <label className="block text-sm">
            Парола
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="win-input mt-1" />
          </label>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button disabled={busy} className="win-btn-primary w-full justify-center">
            {busy && <Loader2 className="size-4 animate-spin" />} Вход
          </button>
          <p className="text-xs text-muted-foreground">Профилите се създават само от управителя.</p>
        </form>
      </div>
    </div>
  );
}
