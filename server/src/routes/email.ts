import express, { type Request, type Response } from "express";
import { Resend } from "resend";

interface GalleryPayload {
  bride_name?: string;
  groom_name?: string;
  galleryUrl?: string;
  access_code?: string;
  welcome_message?: string | null;
  images?: Array<unknown>;
  client_email?: string;
  expiration_date?: string;
}

interface CredentialsRequestBody {
  gallery: GalleryPayload;
  galleryUrl: string;
}

interface ExpirationWarningRequestBody {
  gallery: GalleryPayload;
  daysRemaining: number;
}

const router = express.Router();

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.warn(
    "⚠️  Warning: RESEND_API_KEY not set. Email functionality will be disabled.",
  );
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

router.post(
  "/send-credentials",
  async (
    req: Request<unknown, unknown, CredentialsRequestBody>,
    res: Response,
  ) => {
    try {
      if (!resend) {
        return res.status(503).json({
          error:
            "Email service not configured. Please set RESEND_API_KEY in environment variables.",
        });
      }

      const { gallery, galleryUrl } = req.body || {};

      if (!gallery || !galleryUrl || !gallery.client_email) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const expirationDate = new Date(
        gallery.expiration_date ?? new Date().toISOString(),
      ).toLocaleDateString("bg-BG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const { data, error } = await resend.emails.send({
        from: "Wedding Gallery <onboarding@resend.dev>",
        to: gallery.client_email,
        subject: `Вашата сватбена галерия - ${gallery.bride_name} & ${gallery.groom_name}`,
        html: generateCredentialsEmailTemplate({
          brideName: gallery.bride_name ?? "",
          groomName: gallery.groom_name ?? "",
          galleryUrl,
          accessCode: gallery.access_code ?? "",
          expirationDate,
          welcomeMessage: gallery.welcome_message ?? "",
          imageCount: gallery.images?.length ?? 0,
        }),
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.json({ success: true, data });
    } catch (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },
);

router.post(
  "/send-expiration-warning",
  async (
    req: Request<unknown, unknown, ExpirationWarningRequestBody>,
    res: Response,
  ) => {
    try {
      if (!resend) {
        return res.status(503).json({
          error:
            "Email service not configured. Please set RESEND_API_KEY in environment variables.",
        });
      }

      const { gallery, daysRemaining } = req.body || {};

      if (!gallery || daysRemaining === undefined || !gallery.client_email) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const expirationDate = new Date(
        gallery.expiration_date ?? new Date().toISOString(),
      ).toLocaleDateString("bg-BG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const { data, error } = await resend.emails.send({
        from: "Wedding Gallery <onboarding@resend.dev>",
        to: gallery.client_email,
        subject: `Вашата галерия изтича след ${daysRemaining} дни`,
        html: generateExpirationWarningTemplate({
          brideName: gallery.bride_name ?? "",
          groomName: gallery.groom_name ?? "",
          daysRemaining,
          expirationDate,
        }),
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.json({ success: true, data });
    } catch (error) {
      console.error("Error sending expiration warning:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },
);

function generateCredentialsEmailTemplate(data: {
  brideName: string;
  groomName: string;
  galleryUrl: string;
  accessCode: string;
  expirationDate: string;
  welcomeMessage: string;
  imageCount: number;
}) {
  return `<!DOCTYPE html>
<html lang="bg">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Вашата Сватбена Галерия</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        text-align: center;
        border-radius: 10px 10px 0 0;
      }
      .content {
        background: #f9f9f9;
        padding: 30px;
        border-radius: 0 0 10px 10px;
      }
      .code-box {
        background: white;
        border: 2px dashed #667eea;
        padding: 15px;
        text-align: center;
        font-size: 24px;
        font-weight: bold;
        color: #667eea;
        margin: 20px 0;
        border-radius: 5px;
      }
      .button {
        display: inline-block;
        background: #667eea;
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 5px;
        margin: 20px 0;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        color: #666;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>${data.brideName} & ${data.groomName}</h1>
    </div>
    <div class="content">
      <p>Здравейте,</p>
      <p>Радваме се да споделим с вас специалните моменти от вашата сватба! Вашата персонална галерия е готова за разглеждане.</p>

      <p><strong>Код за достъп:</strong></p>
      <div class="code-box">${data.accessCode}</div>

      <p style="text-align: center;">
        <a href="${data.galleryUrl}" class="button">Вижте Вашата Галерия</a>
      </p>

      ${data.welcomeMessage ? `<p><em>${data.welcomeMessage}</em></p>` : ""}

      <p><strong>Детайли:</strong></p>
      <ul>
        <li>Брой снимки: ${data.imageCount}</li>
        <li>Галерията е валидна до: ${data.expirationDate}</li>
      </ul>

      <p>Можете да прегледате, изтеглите и маркирате любимите си снимки.</p>
    </div>
    <div class="footer">
      <p>Ако имате въпроси, моля свържете се с нас.</p>
    </div>
  </body>
</html>`;
}

function generateExpirationWarningTemplate(data: {
  brideName: string;
  groomName: string;
  daysRemaining: number;
  expirationDate: string;
}) {
  return `<!DOCTYPE html>
<html lang="bg">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Напомняне за изтичаща галерия</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background: #ff9a9e;
        color: white;
        padding: 30px;
        text-align: center;
        border-radius: 10px 10px 0 0;
      }
      .content {
        background: #f9f9f9;
        padding: 30px;
        border-radius: 0 0 10px 10px;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        color: #666;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>${data.brideName} & ${data.groomName}</h1>
    </div>
    <div class="content">
      <p>Здравейте,</p>
      <p>
        Това е приятелско напомняне, че вашата галерия изтича след ${data.daysRemaining}
        дни.
      </p>
      <p>
        Моля, уверете се, че сте изтеглили любимите си спомени преди
        <strong>${data.expirationDate}</strong>.
      </p>
      <p>Благодарим ви, че избрахте EverMore за вашите специални моменти.</p>
    </div>
    <div class="footer">
      <p>Ако имате въпроси, моля свържете се с нас.</p>
    </div>
  </body>
</html>`;
}

export default router;
