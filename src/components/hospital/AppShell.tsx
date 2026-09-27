import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  Database, FilePlus2, Folder, FolderOpen, HelpCircle, Info, LogOut, RefreshCw, Stethoscope,
  UserCog, UserPlus, Users, CalendarDays, Clock, GraduationCap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { meQuery } from "@/lib/db";
import logo from "@/assets/logo-mbal.png";

function TreeLink({ to, icon: Icon, children }: { to: string; icon: typeof Users; children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = path === to;
  return (
    <Link to={to} className={`tree-item ${active ? "tree-item-active" : ""}`}>
      <Icon className="size-4 text-primary" /> {children}
    </Link>
  );
}

export function AppShell({ title, toolbar, children }: { title: string; toolbar?: ReactNode; children: ReactNode }) {
  const { data: me } = useQuery(meQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const today = new Date().toLocaleDateString("bg-BG");

  return (
    <div className="flex h-screen flex-col bg-[var(--word-canvas)] p-0 sm:p-3">
      <div className="win-window flex min-h-0 flex-1 flex-col">
        <div className="win-titlebar">
          <img src={logo} alt="" className="h-5 w-auto rounded-sm bg-card p-px" />
          <span className="truncate">МБАЛ – Балчик · Болнична информационна система — [{title}]</span>
        </div>
        <div className="win-menubar">
          {["Програма", "База данни", "Команди", "Прозорец", "Помощ"].map((m) => <span key={m}>{m}</span>)}
        </div>
        <div className="win-toolbar">
          <Link to="/registry" className="tool-btn" title="Регистър"><Users className="size-4" /></Link>
          <Link to="/patients/new" className="tool-btn" title="Нов пациент"><UserPlus className="size-4" /></Link>
          <button onClick={() => qc.invalidateQueries()} className="tool-btn" title="Обнови"><RefreshCw className="size-4" /></button>
          <span className="tool-sep" />
          {toolbar}
          <span className="ml-auto" />
          <button onClick={signOut} className="tool-btn gap-1 px-2 text-xs" title="Изход"><LogOut className="size-4" /> Изход</button>
          <HelpCircle className="size-4 text-muted-foreground" />
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card md:flex">
            <div className="border-b border-border bg-secondary px-2 py-1 text-xs font-semibold text-muted-foreground">
              Меню на потребителя
            </div>
            <nav className="flex-1 overflow-y-auto p-1 text-sm">
              <div className="tree-group"><FolderOpen className="size-4 text-warning" /> модули</div>
              <div className="pl-4">
                <div className="tree-group"><FolderOpen className="size-4 text-warning" /> пациенти</div>
                <div className="pl-4">
                  <TreeLink to="/registry" icon={Users}>регистър</TreeLink>
                  <TreeLink to="/patients/new" icon={FilePlus2}>нов пациент</TreeLink>
                  <TreeLink to="/school-notes" icon={GraduationCap}>ученически бележки</TreeLink>
                  <TreeLink to="/doctor" icon={Stethoscope}>лекарски кабинет</TreeLink>
                </div>
              </div>
              <div className="tree-group"><Folder className="size-4 text-warning" /> администрация</div>
              <div className="pl-4">
                {me?.isAdmin ? (
                  <TreeLink to="/staff" icon={UserCog}>персонал</TreeLink>
                ) : (
                  <span className="tree-item text-muted-foreground"><UserCog className="size-4" /> персонал</span>
                )}
              </div>
            </nav>
          </aside>
          <main className="min-w-0 flex-1 overflow-auto bg-background">{children}</main>
        </div>

        <div className="win-statusbar">
          <Info className="size-3.5 text-primary" /> <span>v2.4.1</span>
          <span className="tool-sep" />
          <Database className="size-3.5" /> <span>МБАЛ Балчик (cloud)</span>
          <span className="tool-sep" />
          <Stethoscope className="size-3.5 text-success" />
          <span className="truncate font-medium">{me ? `${me.full_name} — ${me.position}` : "…"}</span>
          <span className="tool-sep" />
          <CalendarDays className="size-3.5" /> <span>{today}</span>
          <span className="ml-auto hidden items-center gap-1 sm:flex"><Clock className="size-3.5" /> Смяна 08:00 – 20:00</span>
        </div>
      </div>
    </div>
  );
}
