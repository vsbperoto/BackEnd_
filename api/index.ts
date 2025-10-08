import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { Express } from "express";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

type CreateAppModule = {
  createApp: () => { app: Express };
};

let cachedApp: Express | null = null;

function getApp(): Express {
  if (!cachedApp) {
    const { createApp } = require("../server/app.cjs") as CreateAppModule;
    const { app } = createApp();
    cachedApp = app;
  }

  return cachedApp;
}

const handler = (req: VercelRequest, res: VercelResponse): void => {
  const app = getApp();
  app(req as any, res as any);
};

export default handler;

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
