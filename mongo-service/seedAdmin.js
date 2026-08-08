/**
 * Seeds a single Admin account directly into MongoDB. Mirrors
 * seedFirstAdmin() from AppsScriptMirror.gs. Use this if you're starting
 * fresh (no accounts CSV to migrate) or just need to get back into the
 * Admin Portal after a migration.
 *
 * Usage: npm run seed-admin
 */
require("dotenv").config();
const { connectDB } = require("./src/config/db");
const { Account } = require("./src/models");
const { hashPassword, generateSalt } = require("./src/utils/password");

const EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@animolabs.ph";
const PLAIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "adminpass";

async function main() {
  await connectDB();

  const existing = await Account.findOne({ email: new RegExp(`^${EMAIL}$`, "i") });
  if (existing) {
    console.log(`An account with email "${EMAIL}" already exists (id: ${existing.id}). Nothing to do.`);
    process.exit(0);
  }

  const salt = generateSalt();
  const hash = hashPassword(PLAIN_PASSWORD, salt);
  const id = "ACC-" + Date.now();

  await Account.create({
    id,
    role: "Admin",
    firstName: "Domie James",
    lastName: "Jucutan",
    email: EMAIL,
    passwordHash: hash,
    salt,
    status: "Active",
    program: "",
    year: "",
    schedule: "",
    hoursWeek: 0,
    totalHours: 0,
    createdAt: new Date().toISOString(),
  });

  console.log(`Seeded admin: ${EMAIL} / ${PLAIN_PASSWORD}`);
  console.log("Change this password after logging in.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed admin:", err);
  process.exit(1);
});
