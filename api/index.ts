const createAppModule = require("../server/app.cjs");
const { createApp } = createAppModule;

let cachedApp = null;

function getApp() {
  if (!cachedApp) {
    const { app } = createApp();
    cachedApp = app;
  }
  return cachedApp;
}

export default function handler(req, res) {
  const app = getApp();
  app(req, res);
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
