// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const legacyPrefix = "VITE_";
  const supabaseUrl =
    env.SUPABASE_URL ?? env[`${legacyPrefix}SUPABASE_URL`] ?? "";
  const supabaseAnonKey =
    env.SUPABASE_ANON_KEY ?? env[`${legacyPrefix}SUPABASE_ANON_KEY`] ?? "";

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ["lucide-react"],
    },
    server: {
      port: 5173,
    },
    resolve: {
      alias: {
        "@lib": path.resolve(__dirname, "./src/lib"),
      },
    },
    define: {
      "import.meta.env.SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.SUPABASE_ANON_KEY": JSON.stringify(supabaseAnonKey),
    },
  };
});
