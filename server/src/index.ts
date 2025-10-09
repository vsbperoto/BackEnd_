import { createApp } from "./app.js";

const PORT = Number(process.env.PORT || 4000);

let app;

try {
  ({ app } = createApp());
} catch (error) {
  console.error("❌ Failed to initialize Express application", error);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
