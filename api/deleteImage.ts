import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

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

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

const supabaseAuth =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

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

  if (
    !supabaseAdmin ||
    !supabaseAuth ||
    !CLOUDINARY_CLOUD_NAME ||
    !CLOUDINARY_API_KEY ||
    !CLOUDINARY_API_SECRET
  ) {
    console.error("Missing environment configuration for deleteImage");
    return res.status(500).json({ error: "Server configuration error" });
  }

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
      .update(
        `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`,
      )
      .digest("hex");

    const params = new URLSearchParams();
    params.append("public_id", publicId);
    params.append("timestamp", timestamp.toString());
    params.append("signature", signature);
    params.append("api_key", CLOUDINARY_API_KEY);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
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
