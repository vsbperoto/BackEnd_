import { createClient } from "@supabase/supabase-js";

const legacyPrefix = "VITE_";

const getEnvValue = (key) => {
  return process.env[key] ?? process.env[`${legacyPrefix}${key}`] ?? undefined;
};

const buildSupabaseHealth = async () => {
  const supabaseUrl = getEnvValue("SUPABASE_URL");
  const supabaseAnonKey = getEnvValue("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = getEnvValue("SUPABASE_SERVICE_ROLE_KEY");

  const envStatus = {
    SUPABASE_URL: Boolean(supabaseUrl),
    SUPABASE_ANON_KEY: Boolean(supabaseAnonKey),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(supabaseServiceRoleKey),
  };

  if (!envStatus.SUPABASE_URL) {
    return {
      envStatus,
      supabaseConnected: false,
      supabaseLatencyMs: null,
      supabaseError: "SUPABASE_URL is not configured",
    };
  }

  if (!envStatus.SUPABASE_ANON_KEY && !envStatus.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      envStatus,
      supabaseConnected: false,
      supabaseLatencyMs: null,
      supabaseError: "No Supabase access key configured",
    };
  }

  const client = createClient(
    supabaseUrl,
    supabaseServiceRoleKey ?? supabaseAnonKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );

  const start = Date.now();

  try {
    const { error } = await client
      .from("galleries")
      .select("id", { head: true, count: "exact" });

    const supabaseLatencyMs = Date.now() - start;

    if (error) {
      return {
        envStatus,
        supabaseConnected: false,
        supabaseLatencyMs,
        supabaseError: error.message ?? "Unknown Supabase error",
      };
    }

    return {
      envStatus,
      supabaseConnected: true,
      supabaseLatencyMs,
      supabaseError: null,
    };
  } catch (error) {
    return {
      envStatus,
      supabaseConnected: false,
      supabaseLatencyMs: Date.now() - start,
      supabaseError:
        error instanceof Error ? error.message : "Unexpected Supabase error",
    };
  }
};

export default async function handler(req, res) {
  if (req.method && req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ status: "error", message: "Method not allowed" });
    return;
  }

  try {
    const { envStatus, supabaseConnected, supabaseLatencyMs, supabaseError } =
      await buildSupabaseHealth();

    const status = supabaseConnected ? "ok" : "error";

    res.status(supabaseConnected ? 200 : 503).json({
      status,
      supabaseConnected,
      supabaseLatencyMs,
      supabaseError,
      env: envStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      supabaseConnected: false,
      supabaseLatencyMs: null,
      supabaseError:
        error instanceof Error ? error.message : "Unexpected health error",
      env: {
        SUPABASE_URL: Boolean(getEnvValue("SUPABASE_URL")),
        SUPABASE_ANON_KEY: Boolean(getEnvValue("SUPABASE_ANON_KEY")),
        SUPABASE_SERVICE_ROLE_KEY: Boolean(
          getEnvValue("SUPABASE_SERVICE_ROLE_KEY"),
        ),
      },
      timestamp: new Date().toISOString(),
    });
  }
}
