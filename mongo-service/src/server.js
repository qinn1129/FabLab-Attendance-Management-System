require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const { validateSecret } = require("./middleware/validateSecret");
const dataRoutes = require("./routes/data");

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  })
);
app.use(express.json({ limit: "10mb" })); // profile picture data-URLs can be a few hundred KB

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// Every read/write below requires the shared secret, same as the old
// Apps Script backend.
app.use("/api/data", validateSecret, dataRoutes);

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[server] FabLab Mongo service listening on http://127.0.0.1:${PORT}`);
      console.log(`[server] Data endpoint: http://127.0.0.1:${PORT}/api/data`);
    });
  } catch (err) {
    console.error("[server] Failed to start:", err.message);
    process.exit(1);
  }
}

start();
