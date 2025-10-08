import type { IncomingMessage, ServerResponse } from "http";
import type { Express } from "express";
import { createRequire } from "module";

type VercelRequest = IncomingMessage & {
  query?: Record<string, string | string[]>;
  cookies?: Record<string, string>;
  body?: unknown;
};

type VercelResponse = ServerResponse & {
  status(code: number): VercelResponse;
  send(body: unknown): void;
  json(body: unknown): void;
  redirect(url: string): void;
  redirect(status: number, url: string): void;
};

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
