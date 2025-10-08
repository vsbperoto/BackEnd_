import type { IncomingMessage, ServerResponse } from "http";

import createAppModule from "../server/app.cjs";

interface CreateAppModule {
  createApp: () => { app: (req: IncomingMessage, res: ServerResponse) => void };
}

const { createApp } = createAppModule as CreateAppModule;

let cachedApp: ((req: IncomingMessage, res: ServerResponse) => void) | null =
  null;

function getApp(): (req: IncomingMessage, res: ServerResponse) => void {
  if (!cachedApp) {
    const { app } = createApp();
    cachedApp = app as unknown as (
      req: IncomingMessage,
      res: ServerResponse,
    ) => void;
  }
  return cachedApp;
}

type ApiRequest = IncomingMessage & {
  query?: Record<string, string | string[]>;
  body?: unknown;
};

type ApiResponse = ServerResponse;

export default function handler(req: ApiRequest, res: ApiResponse): void {
  try {
    const app = getApp();
    app(req, res);
  } catch (error) {
    console.error("❌ Failed to handle API request", error);
    res.statusCode = 500;
    res.end("Internal server error");
  }
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
