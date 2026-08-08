/**
 * One-time migration: Google Sheets (via the existing Apps Script
 * deployment) -> MongoDB.
 *
 * Usage:
 *   1. Copy .env.example to .env and fill in MONGODB_URI,
 *      LEGACY_GOOGLE_SCRIPT_URL, LEGACY_WEBAPP_SECRET.
 *   2. For accounts specifically: open the Google Sheet, go to the
 *      "accounts" tab, File > Download > Comma Separated Values (.csv),
 *      save it as accounts_export.csv in this folder (or wherever
 *      ACCOUNTS_CSV_PATH points). This is the ONLY way to bring real
 *      password hashes over — the Apps Script GET endpoint always strips
 *      passwordHash/salt, even for authenticated callers, so there is no
 *      API-based way to migrate passwords.
 *   3. npm run migrate
 *
 * Safe to re-run: every collection is cleared before re-inserting, so
 * running this twice won't create duplicates. Do NOT run this against a
 * database you're actively using in production without backing it up
 * first — it deletes existing documents in each target collection before
 * inserting the freshly-migrated rows.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { connectDB } = require("./src/config/db");
const models = require("./src/models");

const LEGACY_URL = process.env.LEGACY_GOOGLE_SCRIPT_URL;
const LEGACY_SECRET = process.env.LEGACY_WEBAPP_SECRET;
const ACCOUNTS_CSV_PATH = process.env.ACCOUNTS_CSV_PATH || "./accounts_export.csv";

// sheet name (as used by the legacy Apps Script "sheet" query param) -> Mongoose model
const NON_ACCOUNT_SHEETS = {
  commission_reqs: models.Commission,
  weeklyScheds: models.WeeklySchedule,
  announcements: models.Announcement,
  faqs: models.Faq,
  modules: models.TrainingModule,
  chat: models.ChatMessage,
  attendanceLogs: models.AttendanceLog,
  machines: models.Machine,
  machine_reservations: models.MachineReservation,
  attendance_requests: models.AttendanceRequest,
  services: models.ServiceOffering,
  workshops: models.Workshop,
  testimonials: models.Testimonial,
  tasks: models.Task,
};

async function fetchLegacySheet(sheetName) {
  if (!LEGACY_URL || !LEGACY_SECRET) {
    throw new Error(
      "LEGACY_GOOGLE_SCRIPT_URL and LEGACY_WEBAPP_SECRET must be set in .env to migrate from Sheets."
    );
  }
  const url = `${LEGACY_URL}?secret=${encodeURIComponent(LEGACY_SECRET)}&sheet=${encodeURIComponent(sheetName)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching sheet "${sheetName}"`);
  }
  const data = await response.json();
  if (data && data.error) {
    throw new Error(`Apps Script returned an error for "${sheetName}": ${data.error}`);
  }
  if (!Array.isArray(data)) {
    throw new Error(`Unexpected response shape for "${sheetName}" (expected an array).`);
  }
  return data;
}

async function migrateNonAccountSheets() {
  for (const [sheetName, model] of Object.entries(NON_ACCOUNT_SHEETS)) {
    process.stdout.write(`Migrating "${sheetName}"... `);
    try {
      const rows = await fetchLegacySheet(sheetName);
      await model.deleteMany({});
      if (rows.length > 0) {
        // Skip completely blank rows (Sheets sometimes returns trailing
        // empty rows depending on how the sheet was edited).
        const cleaned = rows.filter((r) => Object.values(r).some((v) => v !== "" && v !== null && v !== undefined));
        if (cleaned.length > 0) {
          await model.insertMany(cleaned, { ordered: false });
        }
        console.log(`${cleaned.length} row(s).`);
      } else {
        console.log("0 rows (sheet is empty).");
      }
    } catch (err) {
      console.log(); // finish the "Migrating..." line before the error
      console.error(`  ✗ Failed to migrate "${sheetName}": ${err.message}`);
      console.error(`    Skipping this sheet — you can re-run the migration after fixing the issue.`);
    }
  }
}

async function migrateAccountsFromCsv() {
  const resolvedPath = path.resolve(ACCOUNTS_CSV_PATH);
  process.stdout.write(`Migrating "accounts" from ${resolvedPath}... `);

  if (!fs.existsSync(resolvedPath)) {
    console.log();
    console.warn(
      `  ⚠ No CSV found at ${resolvedPath}. Skipping account migration.\n` +
        `    Export the "accounts" tab from Google Sheets (File > Download > CSV),\n` +
        `    save it at that path, and re-run "npm run migrate" — or run it again with\n` +
        `    ACCOUNTS_CSV_PATH pointing at wherever you saved it.\n` +
        `    Until then, you'll need to seed a fresh admin: npm run seed-admin`
    );
    return;
  }

  const csvText = fs.readFileSync(resolvedPath, "utf-8");
  const records = parse(csvText, { columns: true, skip_empty_lines: true });

  await models.Account.deleteMany({});

  const docs = records
    .filter((r) => r.id && r.email)
    .map((r) => ({
      id: r.id,
      role: r.role,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      passwordHash: r.passwordHash,
      salt: r.salt,
      status: r.status,
      program: r.program || "",
      year: r.year || "",
      schedule: r.schedule || "",
      hoursWeek: Number(r.hoursWeek) || 0,
      totalHours: Number(r.totalHours) || 0,
      createdAt: r.createdAt || "",
      description: r.description || "",
      hobbies: r.hobbies || "",
      motto: r.motto || "",
      profilePicture: r.profilePicture || "",
    }));

  if (docs.length > 0) {
    await models.Account.insertMany(docs, { ordered: false });
  }
  console.log(`${docs.length} account(s).`);

  const missingPasswords = docs.filter((d) => !d.passwordHash || !d.salt).length;
  if (missingPasswords > 0) {
    console.warn(
      `  ⚠ ${missingPasswords} account(s) migrated without a passwordHash/salt — ` +
        `those columns may have been missing from the CSV export. Those users will ` +
        `need a password reset (re-register or an Admin can update their record directly in MongoDB).`
    );
  }
}

async function main() {
  console.log("── FabLab Sheets → MongoDB migration ──\n");
  await connectDB();

  await migrateNonAccountSheets();
  console.log();
  await migrateAccountsFromCsv();

  console.log("\nDone. Double-check counts above against your Sheet before deleting anything.");
  process.exit(0);
}

main().catch((err) => {
  console.error("\nMigration failed:", err);
  process.exit(1);
});
