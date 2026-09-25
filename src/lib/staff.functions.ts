import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  fullName: z.string().trim().min(2).max(100),
  position: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  role: z.enum(["admin", "doctor", "nurse", "registrar"]),
});

export const createStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Само управителят може да създава профили.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message ?? "Грешка при създаване");
    const id = created.user.id;
    await supabaseAdmin.from("profiles").insert({ id, full_name: data.fullName, position: data.position, email: data.email });
    await supabaseAdmin.from("user_roles").insert({ user_id: id, role: data.role });
    return { ok: true };
  });
