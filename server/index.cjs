const { createApp } = require("./app.cjs");

const PORT = process.env.PORT || 4000;

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
    `📧 Email service: ${process.env.RESEND_API_KEY ? "Enabled" : "Disabled (set RESEND_API_KEY to enable)"}`,
  );
  console.log(
    `🗄️  Database: ${
      process.env.VITE_SUPABASE_URL &&
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
        ? "Connected"
        : "Not configured"
    }`,
  );
});
