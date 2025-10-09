import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: string | Record<string, unknown>;
}

interface ApiResponse {
  status: (statusCode: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

type GenericSupabaseClient = SupabaseClient<Record<string, unknown>>;

type SupabaseResolution =
  | { missing: string[] }
  | { admin: GenericSupabaseClient; auth: GenericSupabaseClient };

type CloudinaryResolution =
  | { missing: string[] }
  | { name: string; key: string; secret: string };

function readEnv(key: string): string | undefined {
  const value = process.env[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const supabaseOptions = {
  auth: { autoRefreshToken: false, persistSession: false },
} as const;

let cachedSupabaseAdmin: GenericSupabaseClient | null = null;
let cachedSupabaseAuth: GenericSupabaseClient | null = null;

function resolveSupabaseClients(): SupabaseResolution {
  const url = readEnv("SUPABASE_URL");
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = readEnv("SUPABASE_ANON_KEY");
  const missing: string[] = [];

  if (!url) missing.push("SUPABASE_URL");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!anonKey) missing.push("SUPABASE_ANON_KEY");

  if (missing.length) {
    return { missing } as const;
  }

  if (!cachedSupabaseAdmin) {
    cachedSupabaseAdmin = createClient(url, serviceRoleKey, supabaseOptions);
  }

  if (!cachedSupabaseAuth) {
    cachedSupabaseAuth = createClient(url, anonKey, supabaseOptions);
  }

  return {
    admin: cachedSupabaseAdmin!,
    auth: cachedSupabaseAuth!,
  };
}

function resolveCloudinaryConfig(): CloudinaryResolution {
  const name = readEnv("CLOUDINARY_CLOUD_NAME");
  const key = readEnv("CLOUDINARY_API_KEY");
  const secret = readEnv("CLOUDINARY_API_SECRET");
  const missing: string[] = [];

  if (!name) missing.push("CLOUDINARY_CLOUD_NAME");
  if (!key) missing.push("CLOUDINARY_API_KEY");
  if (!secret) missing.push("CLOUDINARY_API_SECRET");

  if (missing.length) {
    return { missing } as const;
  }

  return { name, key, secret } as const;
}

function parseRequestBody(body: ApiRequest["body"]): Record<string, unknown> {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return {};
    }
  }
  if (typeof body === "object") {
    return body;
  }
  return {};
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    res.setHeader("Allow", "POST, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseResult = resolveSupabaseClients();
  const cloudinaryResult = resolveCloudinaryConfig();

  if ("missing" in supabaseResult || "missing" in cloudinaryResult) {
    const missing = [
      ...("missing" in supabaseResult ? supabaseResult.missing : []),
      ...("missing" in cloudinaryResult ? cloudinaryResult.missing : []),
    ];
    console.error("Missing environment configuration for deleteImage", missing);
    return res.status(500).json({
      error: "Server configuration error",
      missing,
    });
  }

  const { admin: supabaseAdmin, auth: supabaseAuth } = supabaseResult;
  const {
    name: cloudName,
    key: cloudKey,
    secret: cloudSecret,
  } = cloudinaryResult;

  const authHeader = req.headers["authorization"];
  if (
    !authHeader ||
    Array.isArray(authHeader) ||
    !authHeader.startsWith("Bearer ")
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const accessToken = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } =
    await supabaseAuth.auth.getUser(accessToken);

  if (userError || !userData?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = parseRequestBody(req.body);
  const rawPublicId = body.publicId ?? body["public_id"];
  const rawImageId = body.imageId ?? body["image_id"];
  const publicId = typeof rawPublicId === "string" ? rawPublicId : undefined;
  const imageId = typeof rawImageId === "string" ? rawImageId : undefined;

  if (!publicId || !imageId) {
    return res.status(400).json({ error: "Missing imageId or publicId" });
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const signature = crypto
      .createHash("sha1")
      .update(`public_id=${publicId}&timestamp=${timestamp}${cloudSecret}`)
      .digest("hex");

    const params = new URLSearchParams();
    params.append("public_id", publicId);
    params.append("timestamp", timestamp.toString());
    params.append("signature", signature);
    params.append("api_key", cloudKey);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: "POST",
        body: params,
      },
    );

    const cloudinaryResult = await cloudinaryResponse.json();

    if (!cloudinaryResponse.ok || cloudinaryResult.result !== "ok") {
      console.error("Cloudinary deletion failed:", cloudinaryResult);
      return res
        .status(502)
        .json({ error: "Failed to delete image from Cloudinary" });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("client_images")
      .delete()
      .eq("id", imageId);

    if (deleteError) {
      console.error("Supabase deletion failed:", deleteError);
      return res
        .status(500)
        .json({ error: "Failed to delete image from database" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Unexpected error deleting image:", error);
    return res.status(500).json({ error: "Unexpected error deleting image" });
  }
}
