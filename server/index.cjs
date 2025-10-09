const { createApp } = require("./app.cjs");

const PORT = Number(process.env.PORT) || 4000;
const legacyPrefix = "VITE_";

const getEnvValue = (key) =>
  process.env[key] ?? process.env[`${legacyPrefix}${key}`];

let app;

try {
  ({ app } = createApp());
} catch (error) {
  console.error("❌ Failed to initialize Express application", error);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`✅ Backend server listening on http://localhost:${PORT}`);
  console.log(
    `📧 Email service: ${
      process.env.RESEND_API_KEY
        ? "Enabled"
        : "Disabled (set RESEND_API_KEY to enable)"
    }`,
  );

  const supabaseConfigured = Boolean(
    (getEnvValue("SUPABASE_URL") || "") &&
      (getEnvValue("SUPABASE_SERVICE_ROLE_KEY") || ""),
  );

  console.log(
    `🗄️  Database: ${supabaseConfigured ? "Connected" : "Not configured"}`,
  );
});
