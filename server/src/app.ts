import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { createClient, type PostgrestError } from "@supabase/supabase-js";

import emailRoutes from "./routes/email.js";

type NullableError = PostgrestError | null | undefined;

type SupabaseRow = Record<string, unknown>;

type SupabaseInsertPayload =
  | Record<string, unknown>
  | Record<string, unknown>[];

export interface CreateAppResult {
  app: Express;
}

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in environment",
  );
  throw new Error("Missing Supabase environment configuration");
}

if (!ADMIN_TOKEN) {
  console.warn("⚠️  Warning: ADMIN_TOKEN not set. Using default token.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function mapSupabaseError(res: Response, error: NullableError) {
  return res.status(500).json({
    error: error?.message || "Unexpected Supabase error",
    details: error?.details ?? null,
    hint: error?.hint ?? null,
    code: error?.code ?? null,
  });
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.header("x-admin-token");
  if (!ADMIN_TOKEN) {
    return res
      .status(403)
      .json({ error: "ADMIN_TOKEN not configured on server" });
  }
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}

async function fetchBlogPostWithTags(id: string) {
  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !post) {
    return { post: null as SupabaseRow | null, error };
  }

  const { data: tagLinks, error: tagError } = await supabase
    .from("blog_post_tags")
    .select("post_id, blog_tags ( id, name, slug )")
    .eq("post_id", id);

  if (tagError) {
    return { post: null as SupabaseRow | null, error: tagError };
  }

  const tags = (tagLinks || []).map((link) => link.blog_tags).filter(Boolean);

  return { post: { ...post, tags }, error: null };
}

async function fetchPricingPackageWithRelations(id: string) {
  const { data: pkg, error } = await supabase
    .from("pricing_packages")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !pkg) {
    return { pkg: null as SupabaseRow | null, error };
  }

  const [
    { data: featureData, error: featureError },
    { data: tierData, error: tierError },
  ] = await Promise.all([
    supabase
      .from("pricing_package_features")
      .select("*")
      .eq("package_id", id)
      .order("display_order", { ascending: true }),
    supabase
      .from("pricing_package_tiers")
      .select("*")
      .eq("package_id", id)
      .order("display_order", { ascending: true }),
  ]);

  if (featureError) {
    return { pkg: null as SupabaseRow | null, error: featureError };
  }

  if (tierError) {
    return { pkg: null as SupabaseRow | null, error: tierError };
  }

  return {
    pkg: {
      ...pkg,
      features: featureData || [],
      tiers: tierData || [],
    },
    error: null,
  };
}

export function createApp(): CreateAppResult {
  const app = express();
  const adminRouter = express.Router();

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, DELETE, OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-admin-token",
    );
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    return next();
  });

  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-admin-token"],
    }),
  );

  app.use(bodyParser.json());

  app.use("/api/email", emailRoutes);

  adminRouter.use(requireAdmin);

  app.get("/api/galleries", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from("galleries")
        .select("id, title, subtitle, event_date, cover_image, images")
        .order("created_at", { ascending: false });
      if (error) return res.status(500).json({ error });
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.get("/galleries", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from("galleries")
        .select(
          "id, title, subtitle, event_date, cover_image, images, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) return mapSupabaseError(res, error);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.post("/galleries", async (req: Request, res: Response) => {
    try {
      const payload = req.body as SupabaseInsertPayload;
      const { data, error } = await supabase
        .from("galleries")
        .insert([{ ...(payload as SupabaseRow) }])
        .select()
        .single();
      if (error) return mapSupabaseError(res, error);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.patch("/galleries/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body as SupabaseRow;
      const { data, error } = await supabase
        .from("galleries")
        .update({ ...updates })
        .eq("id", id)
        .select()
        .single();
      if (error) return mapSupabaseError(res, error);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.delete("/galleries/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from("galleries").delete().eq("id", id);
      if (error) return mapSupabaseError(res, error);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.get("/contacts", async (req: Request, res: Response) => {
    try {
      const archivedFilter = req.query.archived;
      const { data, error } = await supabase
        .from("contacts")
        .select("*, contact_message_archives(archived_at)")
        .order("created_at", { ascending: false });
      if (error) return mapSupabaseError(res, error);

      const contacts = (data || []).map((contact: any) => {
        const archivedEntry = Array.isArray(contact.contact_message_archives)
          ? contact.contact_message_archives[0]
          : null;
        const mapped = {
          ...contact,
          archived: Boolean(archivedEntry),
          archived_at: archivedEntry?.archived_at ?? null,
        };
        delete mapped.contact_message_archives;
        return mapped;
      });

      let filtered = contacts;
      if (archivedFilter === "true") {
        filtered = contacts.filter((contact: any) => contact.archived);
      } else if (archivedFilter === "false") {
        filtered = contacts.filter((contact: any) => !contact.archived);
      }

      return res.json(filtered);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.post(
    "/contacts/:id/archive",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { error } = await supabase
          .from("contact_message_archives")
          .upsert(
            { contact_id: id, archived_at: new Date().toISOString() },
            { onConflict: "contact_id" },
          );
        if (error) return mapSupabaseError(res, error);
        return res.json({ success: true });
      } catch (err) {
        return res.status(500).json({ error: String(err) });
      }
    },
  );

  adminRouter.delete(
    "/contacts/:id/archive",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { error } = await supabase
          .from("contact_message_archives")
          .delete()
          .eq("contact_id", id);
        if (error) return mapSupabaseError(res, error);
        return res.json({ success: true });
      } catch (err) {
        return res.status(500).json({ error: String(err) });
      }
    },
  );

  adminRouter.delete("/contacts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) return mapSupabaseError(res, error);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.post("/client_galleries", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from("client_galleries")
        .insert(req.body as SupabaseInsertPayload)
        .select()
        .single();
      if (error) return mapSupabaseError(res, error);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.patch(
    "/client_galleries/:id",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { data, error } = await supabase
          .from("client_galleries")
          .update(req.body as SupabaseRow)
          .eq("id", id)
          .select()
          .single();
        if (error) return mapSupabaseError(res, error);
        return res.json(data);
      } catch (err) {
        return res.status(500).json({ error: String(err) });
      }
    },
  );

  adminRouter.delete(
    "/client_galleries/:id",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { error } = await supabase
          .from("client_galleries")
          .delete()
          .eq("id", id);
        if (error) return mapSupabaseError(res, error);
        return res.json({ success: true });
      } catch (err) {
        return res.status(500).json({ error: String(err) });
      }
    },
  );

  adminRouter.post("/client_images", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from("client_images")
        .insert(req.body as SupabaseInsertPayload)
        .select();
      if (error) return mapSupabaseError(res, error);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.post(
    "/client_images/reorder",
    async (req: Request, res: Response) => {
      try {
        const { order } = req.body as {
          order?: Array<{ id: string; order_index: number }>;
        };
        if (!Array.isArray(order)) {
          return res.status(400).json({ error: "order must be an array" });
        }

        for (const item of order) {
          const { id, order_index } = item;
          const result = await supabase
            .from("client_images")
            .update({ order_index })
            .eq("id", id);
          if (result.error) {
            return mapSupabaseError(res, result.error);
          }
        }
        return res.json({ success: true });
      } catch (err) {
        return res.status(500).json({ error: String(err) });
      }
    },
  );

  adminRouter.patch(
    "/client_images/:id",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { data, error } = await supabase
          .from("client_images")
          .update(req.body as SupabaseRow)
          .eq("id", id)
          .select()
          .single();
        if (error) return mapSupabaseError(res, error);
        return res.json(data);
      } catch (err) {
        return res.status(500).json({ error: String(err) });
      }
    },
  );

  adminRouter.delete(
    "/client_images/:id",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { error } = await supabase
          .from("client_images")
          .delete()
          .eq("id", id);
        if (error) return mapSupabaseError(res, error);
        return res.json({ success: true });
      } catch (err) {
        return res.status(500).json({ error: String(err) });
      }
    },
  );

  adminRouter.get("/blog/posts", async (req: Request, res: Response) => {
    try {
      const { data: posts, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return mapSupabaseError(res, error);

      const { data: tagLinks, error: tagError } = await supabase
        .from("blog_post_tags")
        .select("post_id, blog_tags ( id, name, slug )");
      if (tagError) return mapSupabaseError(res, tagError);

      const tagsByPost = new Map<string, any[]>();
      (tagLinks || []).forEach((link: any) => {
        if (!link.blog_tags) return;
        if (!tagsByPost.has(link.post_id)) {
          tagsByPost.set(link.post_id, []);
        }
        tagsByPost.get(link.post_id)!.push(link.blog_tags);
      });

      const result = (posts || []).map((post: any) => ({
        ...post,
        tags: tagsByPost.get(post.id) || [],
      }));

      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.post("/blog/posts", async (req: Request, res: Response) => {
    try {
      const { tags, ...postData } = req.body as Record<string, any> & {
        tags?: Array<{ id?: string; name?: string }>;
      };
      const { data, error } = await supabase
        .from("blog_posts")
        .insert([{ ...postData }])
        .select()
        .single();
      if (error) return mapSupabaseError(res, error);

      if (Array.isArray(tags) && data?.id) {
        const rows = tags.map((tag) => ({
          post_id: data.id,
          tag_id: tag.id,
        }));
        const { error: tagError } = await supabase
          .from("blog_post_tags")
          .insert(rows);
        if (tagError) return mapSupabaseError(res, tagError);
      }

      const { post, error: fetchError } = await fetchBlogPostWithTags(
        data?.id as string,
      );
      if (fetchError) return mapSupabaseError(res, fetchError);
      return res.json(post);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.get("/blog/posts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { post, error } = await fetchBlogPostWithTags(id);
      if (error) return mapSupabaseError(res, error);
      return res.json(post);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.patch("/blog/posts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { tags, ...updates } = req.body as Record<string, any> & {
        tags?: Array<{ id?: string; name?: string }>;
      };
      const { error } = await supabase
        .from("blog_posts")
        .update(updates)
        .eq("id", id);
      if (error) return mapSupabaseError(res, error);

      if (Array.isArray(tags)) {
        const { error: deleteError } = await supabase
          .from("blog_post_tags")
          .delete()
          .eq("post_id", id);
        if (deleteError) return mapSupabaseError(res, deleteError);

        if (tags.length > 0) {
          const rows = tags.map((tag) => ({
            post_id: id,
            tag_id: tag.id,
          }));
          const { error: addError } = await supabase
            .from("blog_post_tags")
            .insert(rows);
          if (addError) return mapSupabaseError(res, addError);
        }
      }

      const { post, error: fetchError } = await fetchBlogPostWithTags(id);
      if (fetchError) return mapSupabaseError(res, fetchError);
      return res.json(post);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.delete("/blog/posts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) return mapSupabaseError(res, error);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.get("/blog/tags", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from("blog_tags")
        .select("*")
        .order("name", { ascending: true });
      if (error) return mapSupabaseError(res, error);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.post("/blog/tags", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from("blog_tags")
        .insert([{ ...(req.body as SupabaseRow) }])
        .select()
        .single();
      if (error) return mapSupabaseError(res, error);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.patch("/blog/tags/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from("blog_tags")
        .update(req.body as SupabaseRow)
        .eq("id", id)
        .select()
        .single();
      if (error) return mapSupabaseError(res, error);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.delete("/blog/tags/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from("blog_tags").delete().eq("id", id);
      if (error) return mapSupabaseError(res, error);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.get("/faqs", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from("faq_entries")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) return mapSupabaseError(res, error);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.post("/faqs", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from("faq_entries")
        .insert([
          {
            ...(req.body as SupabaseRow),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();
      if (error) return mapSupabaseError(res, error);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.patch("/faqs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from("faq_entries")
        .update({
          ...(req.body as SupabaseRow),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) return mapSupabaseError(res, error);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.delete("/faqs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { error } = await supabase
        .from("faq_entries")
        .delete()
        .eq("id", id);
      if (error) return mapSupabaseError(res, error);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.get("/reviews", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from("client_reviews")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) return mapSupabaseError(res, error);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.post("/reviews", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from("client_reviews")
        .insert([
          {
            ...(req.body as SupabaseRow),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();
      if (error) return mapSupabaseError(res, error);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.patch("/reviews/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from("client_reviews")
        .update({
          ...(req.body as SupabaseRow),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) return mapSupabaseError(res, error);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.delete("/reviews/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { error } = await supabase
        .from("client_reviews")
        .delete()
        .eq("id", id);
      if (error) return mapSupabaseError(res, error);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.get("/pricing/packages", async (req: Request, res: Response) => {
    try {
      const { data: packages, error } = await supabase
        .from("pricing_packages")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) return mapSupabaseError(res, error);

      const [
        { data: featureData, error: featureError },
        { data: tierData, error: tierError },
      ] = await Promise.all([
        supabase
          .from("pricing_package_features")
          .select("*")
          .order("display_order", { ascending: true }),
        supabase
          .from("pricing_package_tiers")
          .select("*")
          .order("display_order", { ascending: true }),
      ]);

      if (featureError) return mapSupabaseError(res, featureError);
      if (tierError) return mapSupabaseError(res, tierError);

      const featuresByPackage = new Map<string, any[]>();
      (featureData || []).forEach((feature: any) => {
        if (!featuresByPackage.has(feature.package_id)) {
          featuresByPackage.set(feature.package_id, []);
        }
        featuresByPackage.get(feature.package_id)!.push(feature);
      });

      const tiersByPackage = new Map<string, any[]>();
      (tierData || []).forEach((tier: any) => {
        if (!tiersByPackage.has(tier.package_id)) {
          tiersByPackage.set(tier.package_id, []);
        }
        tiersByPackage.get(tier.package_id)!.push(tier);
      });

      const result = (packages || []).map((pkg: any) => ({
        ...pkg,
        features: featuresByPackage.get(pkg.id) || [],
        tiers: tiersByPackage.get(pkg.id) || [],
      }));

      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.post("/pricing/packages", async (req: Request, res: Response) => {
    try {
      const { features, tiers, ...payload } = req.body as Record<
        string,
        any
      > & {
        features?: Array<Record<string, any>>;
        tiers?: Array<Record<string, any>>;
      };
      const { data, error } = await supabase
        .from("pricing_packages")
        .insert([{ ...payload }])
        .select()
        .single();
      if (error) return mapSupabaseError(res, error);

      const packageId = data?.id as string;

      if (Array.isArray(features) && packageId) {
        const rows = features.map((feature, index) => ({
          package_id: packageId,
          feature_name: feature.feature_name,
          feature_description: feature.feature_description ?? null,
          display_order: feature.display_order ?? index,
        }));
        const { error: featureError } = await supabase
          .from("pricing_package_features")
          .insert(rows);
        if (featureError) return mapSupabaseError(res, featureError);
      }

      if (Array.isArray(tiers) && packageId) {
        const rows = tiers.map((tier, index) => ({
          package_id: packageId,
          tier_name: tier.tier_name,
          price_amount: tier.price_amount ?? null,
          price_label: tier.price_label ?? null,
          display_order: tier.display_order ?? index,
          is_featured: Boolean(tier.is_featured),
        }));
        const { error: tierError } = await supabase
          .from("pricing_package_tiers")
          .insert(rows);
        if (tierError) return mapSupabaseError(res, tierError);
      }

      const { pkg, error: fetchError } =
        await fetchPricingPackageWithRelations(packageId);
      if (fetchError) return mapSupabaseError(res, fetchError);
      return res.json(pkg);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.patch(
    "/pricing/packages/:id",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { features, tiers, ...updates } = req.body as Record<
          string,
          any
        > & {
          features?: Array<Record<string, any>>;
          tiers?: Array<Record<string, any>>;
        };
        const { error } = await supabase
          .from("pricing_packages")
          .update(updates)
          .eq("id", id);
        if (error) return mapSupabaseError(res, error);

        if (Array.isArray(features)) {
          const { error: deleteFeaturesError } = await supabase
            .from("pricing_package_features")
            .delete()
            .eq("package_id", id);
          if (deleteFeaturesError)
            return mapSupabaseError(res, deleteFeaturesError);

          if (features.length > 0) {
            const rows = features.map((feature, index) => ({
              package_id: id,
              feature_name: feature.feature_name,
              feature_description: feature.feature_description ?? null,
              display_order: feature.display_order ?? index,
            }));
            const { error: insertError } = await supabase
              .from("pricing_package_features")
              .insert(rows);
            if (insertError) return mapSupabaseError(res, insertError);
          }
        }

        if (Array.isArray(tiers)) {
          const { error: deleteTiersError } = await supabase
            .from("pricing_package_tiers")
            .delete()
            .eq("package_id", id);
          if (deleteTiersError) return mapSupabaseError(res, deleteTiersError);

          if (tiers.length > 0) {
            const rows = tiers.map((tier, index) => ({
              package_id: id,
              tier_name: tier.tier_name,
              price_amount: tier.price_amount ?? null,
              price_label: tier.price_label ?? null,
              display_order: tier.display_order ?? index,
              is_featured: Boolean(tier.is_featured),
            }));
            const { error: insertTierError } = await supabase
              .from("pricing_package_tiers")
              .insert(rows);
            if (insertTierError) return mapSupabaseError(res, insertTierError);
          }
        }

        const { pkg, error: fetchError } =
          await fetchPricingPackageWithRelations(id);
        if (fetchError) return mapSupabaseError(res, fetchError);
        return res.json(pkg);
      } catch (err) {
        return res.status(500).json({ error: String(err) });
      }
    },
  );

  adminRouter.delete(
    "/pricing/packages/:id",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { error } = await supabase
          .from("pricing_packages")
          .delete()
          .eq("id", id);
        if (error) return mapSupabaseError(res, error);
        return res.json({ success: true });
      } catch (err) {
        return res.status(500).json({ error: String(err) });
      }
    },
  );

  adminRouter.get("/partners", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) return mapSupabaseError(res, error);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.post("/partners", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from("partners")
        .insert([{ ...(req.body as SupabaseRow) }])
        .select()
        .single();
      if (error) return mapSupabaseError(res, error);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.patch("/partners/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from("partners")
        .update(req.body as SupabaseRow)
        .eq("id", id)
        .select()
        .single();
      if (error) return mapSupabaseError(res, error);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.delete("/partners/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (error) return mapSupabaseError(res, error);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.get("/inquiries", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from("partnership_inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return mapSupabaseError(res, error);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.patch("/inquiries/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, notes } = (req.body || {}) as {
        status?: string;
        notes?: string;
      };
      const { data, error } = await supabase
        .from("partnership_inquiries")
        .update({ status, notes })
        .eq("id", id)
        .select()
        .single();
      if (error) return mapSupabaseError(res, error);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  adminRouter.delete("/inquiries/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { error } = await supabase
        .from("partnership_inquiries")
        .delete()
        .eq("id", id);
      if (error) return mapSupabaseError(res, error);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  app.use("/api/admin", adminRouter);

  app.post("/api/partners/inquiries", async (req: Request, res: Response) => {
    try {
      const payload = (req.body || {}) as Record<string, any>;
      const { data, error } = await supabase
        .from("partnership_inquiries")
        .insert({ ...payload, status: payload.status || "pending" })
        .select()
        .single();
      if (error) return mapSupabaseError(res, error);
      return res.status(201).json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  app.post("/api/client/favorites", async (req: Request, res: Response) => {
    try {
      const { gallery_id, client_email, image_public_id } = (req.body ||
        {}) as {
        gallery_id?: string;
        client_email?: string;
        image_public_id?: string;
      };
      if (!gallery_id || !client_email || !image_public_id) {
        return res.status(400).json({ error: "Missing fields" });
      }
      const { data: gallery } = await supabase
        .from("client_galleries")
        .select("id,status")
        .eq("id", gallery_id)
        .maybeSingle();
      if (!gallery || gallery.status !== "active") {
        return res.status(400).json({ error: "Invalid or inactive gallery" });
      }
      const { data, error } = await supabase
        .from("client_gallery_favorites")
        .insert({ gallery_id, client_email, image_public_id })
        .select()
        .single();
      if (error) return res.status(500).json({ error });
      return res.status(201).json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  app.post(
    "/api/client/favorites/delete",
    async (req: Request, res: Response) => {
      try {
        const { gallery_id, client_email, image_public_id } = (req.body ||
          {}) as {
          gallery_id?: string;
          client_email?: string;
          image_public_id?: string;
        };
        if (!gallery_id || !client_email || !image_public_id) {
          return res.status(400).json({ error: "Missing fields" });
        }
        const { data, error } = await supabase
          .from("client_gallery_favorites")
          .delete()
          .match({ gallery_id, client_email, image_public_id });
        if (error) return res.status(500).json({ error });
        const deletedData = data as unknown;
        const deletedCount = Array.isArray(deletedData)
          ? (deletedData as unknown[]).length
          : 0;
        return res.json({ success: true, deleted: deletedCount });
      } catch (err) {
        return res.status(500).json({ error: String(err) });
      }
    },
  );

  app.post("/api/client/downloads", async (req: Request, res: Response) => {
    try {
      const payload = (req.body || {}) as Record<string, any>;
      if (!payload.gallery_id || !payload.client_email) {
        return res.status(400).json({ error: "Missing fields" });
      }
      const { data, error } = await supabase
        .from("client_gallery_downloads")
        .insert(payload)
        .select()
        .single();
      if (error) return res.status(500).json({ error });
      return res.status(201).json(data);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  app.post(
    "/api/client/galleries/:id/increment_view",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        if (!id) {
          return res.status(400).json({ error: "Missing id" });
        }
        const { data: current, error: fetchError } = await supabase
          .from("client_galleries")
          .select("view_count")
          .eq("id", id)
          .maybeSingle();
        if (fetchError) return res.status(500).json({ error: fetchError });
        const currentCount =
          current && typeof current.view_count === "number"
            ? current.view_count
            : Number(current?.view_count ?? 0);
        const { data, error } = await supabase
          .from("client_galleries")
          .update({ view_count: currentCount + 1 })
          .eq("id", id)
          .select()
          .single();
        if (error) return res.status(500).json({ error });
        return res.json(data);
      } catch (err) {
        return res.status(500).json({ error: String(err) });
      }
    },
  );

  app.get("/health", (req: Request, res: Response) => {
    return res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      supabase: Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY),
      email: Boolean(process.env.RESEND_API_KEY),
    });
  });

  return { app };
}
