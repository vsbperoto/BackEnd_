import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse,
) {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  const report: Record<string, unknown> = {
    SUPABASE_URL: Boolean(url),
    SUPABASE_ANON_KEY: Boolean(anonKey),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(serviceKey),
  };

  try {
    if (!url || !serviceKey) {
      return res
        .status(500)
        .json({ status: "error", report, error: "Missing Supabase env(s)" });
    }

    const supabase = createClient(url, serviceKey);
    const { data, error } = await supabase
      .from("galleries")
      .select("id")
      .limit(1);

    report.db = error
      ? { ok: false, message: error.message }
      : { ok: true, rows: data?.length ?? 0 };

    return res.status(200).json({
      status: "ok",
      report,
      ts: new Date().toISOString(),
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    console.error("diagnostics error", error);
    return res.status(500).json({
      status: "error",
      report,
      error: error.message,
    });
  }
}
