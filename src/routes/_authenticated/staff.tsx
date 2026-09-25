import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/hospital/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { meQuery } from "@/lib/db";
import { createStaff } from "@/lib/staff.functions";

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({
    meta: [
      { title: "Персонал · МБАЛ Балчик" },
      { name: "description", content: "Управление на профилите на служителите." },
      { property: "og:title", content: "Персонал · МБАЛ Балчик" },
      { property: "og:description", content: "Управление на профилите на служителите." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StaffPage,
});

const ROLES = { admin: "Администратор", doctor: "Лекар", nurse: "Медицинска сестра", registrar: "Регистратор" } as const;
type Role = keyof typeof ROLES;

function StaffPage() {
  const { data: me } = useQuery(meQuery);
  const qc = useQueryClient();
  const create = useServerFn(createStaff);
  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at")).data ?? [],
  });
  const [f, setF] = useState({ fullName: "", position: "", email: "", password: "", role: "doctor" as Role });
  const [busy, setBusy] = useState(false);

  if (me && !me.isAdmin) return <AppShell title="персонал"><p className="p-6">Нямате достъп до тази страница.</p></AppShell>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await create({ data: f });
      toast.success("Профилът е създаден");
      setF({ fullName: "", position: "", email: "", password: "", role: "doctor" });
      qc.invalidateQueries({ queryKey: ["staff"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Грешка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="персонал">
      <Toaster position="top-center" />
      <div className="mx-auto max-w-5xl space-y-3 p-4">
        <div className="panel overflow-hidden">
          <table className="grid-table">
            <thead><tr><th>Име</th><th>Длъжност</th><th>Имейл</th></tr></thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}><td className="font-medium">{s.full_name}</td><td>{s.position}</td><td>{s.email}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <form onSubmit={submit}>
          <fieldset className="win-fieldset grid gap-3 sm:grid-cols-2">
            <legend>Нов служител</legend>
            <label className="win-label">Име и фамилия<input required value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} className="win-input" /></label>
            <label className="win-label">Длъжност<input required value={f.position} onChange={(e) => setF({ ...f, position: e.target.value })} className="win-input" placeholder="напр. Лекар, Хирургия" /></label>
            <label className="win-label">Имейл<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="win-input" /></label>
            <label className="win-label">Парола (мин. 8 символа)<input type="password" required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="win-input" /></label>
            <label className="win-label">Роля
              <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })} className="win-input">
                {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <div className="flex items-end justify-end">
              <button disabled={busy} className="win-btn-primary">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Създай профил
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </AppShell>
  );
}
