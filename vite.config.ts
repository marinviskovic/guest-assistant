import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Canonical and link-preview URLs: the Vercel production domain unless SITE_URL says otherwise.
process.env.VITE_SITE_URL =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:5173");

/** Runs api/chat.ts inside `npm run dev`, the same handler Vercel runs in production. */
function devApi(): Plugin {
  return {
    name: "dev-api",
    configureServer(server) {
      Object.assign(process.env, loadEnv("development", process.cwd(), ""));
      server.middlewares.use("/api/chat", async (req, res) => {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const { POST } = await server.ssrLoadModule("/api/chat.ts");
        const response: Response = await POST(
          new Request(`http://${req.headers.host}/api/chat`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: req.method === "POST" ? Buffer.concat(chunks) : undefined,
          }),
        );
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        const reader = response.body!.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
});
