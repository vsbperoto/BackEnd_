import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../server/app.cjs";

let cachedApp: ReturnType<typeof createApp> | null = null;

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!cachedApp) {
      cachedApp = createApp();
    }
    const app = cachedApp as unknown as (
      req: VercelRequest,
      res: VercelResponse,
    ) => void;
    return app(req, res);
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    console.error("API handler error:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
}
