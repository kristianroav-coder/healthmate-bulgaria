import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "МБАЛ Балчик · Болнична информационна система" },
      { name: "description", content: "Пациентски регистър, прегледи и медицински документи на МБАЛ Балчик." },
      { property: "og:title", content: "МБАЛ Балчик · Болнична информационна система" },
      { property: "og:description", content: "Пациентски регистър, прегледи и документи в Word." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    throw redirect({ to: data.session ? "/registry" : "/auth" });
  },
});
