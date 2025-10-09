import type { VercelRequest, VercelResponse } from "@vercel/node";

const KEYS = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CLOUDINARY_API_KEY",
  "ADMIN_TOKEN",
  "RESEND_API_KEY",
];

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse,
) {
  const envReport = Object.fromEntries(
    KEYS.map((key) => [key, Boolean(process.env[key])]),
  );

  res.status(200).json({
    status: "ok",
    envReport,
    ts: new Date().toISOString(),
  });
}
