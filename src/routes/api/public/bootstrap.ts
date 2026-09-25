import { createFileRoute } from "@tanstack/react-router";
import { bootstrapHospital } from "@/lib/bootstrap.server";

export const Route = createFileRoute("/api/public/bootstrap")({
  server: {
    handlers: {
      POST: async () => Response.json(await bootstrapHospital()),
    },
  },
});
