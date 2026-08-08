const mongoose = require("mongoose");
const dns = require("dns");

// Node's own DNS resolver (separate from Windows' OS-level DNS settings)
// sometimes fails to resolve the SRV record `mongodb+srv://` URIs depend
// on — this shows up as `querySrv ECONNREFUSED` even when your OS network
// settings and internet connection are completely fine. This is a common
// issue on Windows specifically. Forcing Node to use a known-working
// public resolver (independent of whatever Windows/your network is
// configured to use) works around it reliably.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

/**
 * Connects to MongoDB using MONGODB_URI from the environment. Call once at
 * server startup — Mongoose queues operations until the connection is
 * ready, so routes don't need to await this directly.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env and fill it in " +
        "(a local MongoDB instance or a free MongoDB Atlas cluster both work)."
    );
  }

  mongoose.connection.on("connected", () => {
    console.log("[db] Connected to MongoDB.");
  });
  mongoose.connection.on("error", (err) => {
    console.error("[db] MongoDB connection error:", err.message);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("[db] MongoDB disconnected.");
  });

  await mongoose.connect(uri);
}

module.exports = { connectDB };