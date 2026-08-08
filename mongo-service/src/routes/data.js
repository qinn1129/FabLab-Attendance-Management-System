const express = require("express");
const { COLLECTIONS, CHAT_MESSAGE_TTL_MS } = require("../config/collections");
const { hashPassword, generateSalt } = require("../utils/password");
const { Account } = require("../models");

const router = express.Router();

/** Strips a model instance down to a plain object, dropping Mongo's internal fields plus any sensitive fields configured for that sheet. */
function toSafeObject(doc, sensitiveFields) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj._id;
  delete obj.__v;
  if (sensitiveFields) {
    sensitiveFields.forEach((f) => delete obj[f]);
  }
  return obj;
}

/** Mirrors purgeExpiredChatMessages(): deletes any chat row older than 24h. Called lazily on every chat read/write, same as before. */
async function purgeExpiredChat() {
  const cutoff = new Date(Date.now() - CHAT_MESSAGE_TTL_MS).toISOString();
  const { ChatMessage } = require("../models");
  await ChatMessage.deleteMany({ createdAt: { $lt: cutoff } });
}

// ─────────────────────────────────────────────
// GET — generic sheet reader, EXCEPT accounts gets sanitized
// (mirrors doGet in AppsScriptMirror.gs)
// ─────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const sheetname = req.query.sheet;
    if (!sheetname) {
      return res.status(400).json({ error: "Missing sheet name URL parameter" });
    }

    const entry = COLLECTIONS[sheetname];
    if (!entry) {
      return res.status(404).json({ error: "Sheet not found: " + sheetname });
    }

    if (sheetname === "chat") {
      await purgeExpiredChat();
    }

    const docs = await entry.model.find({}).lean();
    const rows = docs.map((doc) => {
      const obj = { ...doc };
      delete obj._id;
      delete obj.__v;
      if (entry.sensitiveFields) {
        entry.sensitiveFields.forEach((f) => delete obj[f]);
      }
      return obj;
    });

    return res.json(rows);
  } catch (error) {
    console.error("[data:GET]", error);
    return res.status(500).json({ error: error.message || String(error) });
  }
});

// ─────────────────────────────────────────────
// POST — generic add/update/delete, plus dedicated auth actions
// (mirrors doPost in AppsScriptMirror.gs)
// ─────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const action = body.action || null;

    // ── Auth actions (always operate on "accounts") ──
    if (action === "login") return handleLogin(req, res);
    if (action === "registerRM") return handleRegisterRM(req, res);
    if (action === "changePassword") return handleChangePassword(req, res);

    // ── Generic CRUD ──
    const sheetname = req.query.sheet || body.sheet;
    if (!sheetname) {
      return res.status(400).json({ error: "Missing sheet name URL or POST body parameter" });
    }

    const entry = COLLECTIONS[sheetname];
    if (!entry) {
      return res.status(404).json({ error: "Sheet not found: " + sheetname });
    }

    if (action === "add") {
      const rowData = { ...body.data };
      if (sheetname === "accounts") sanitizeAccountWrite(rowData);
      await entry.model.create(rowData);

      if (sheetname === "chat") await purgeExpiredChat();

      return res.json({ success: true });
    }

    if (action === "update") {
      const id = body.id;
      const rowData = { ...body.data };
      if (sheetname === "accounts") sanitizeAccountWrite(rowData);

      const filter = { [entry.idField]: id };
      const existing = await entry.model.findOne(filter);

      if (!existing) {
        // weeklyScheds mirrors the old behavior of upserting a brand-new
        // row when updating a resident who doesn't have one yet.
        if (sheetname === "weeklyScheds") {
          await entry.model.create({ [entry.idField]: id, ...rowData });
          return res.json({ success: true, created: true });
        }
        return res.status(404).json({ error: "Row with ID " + id + " not found." });
      }

      await entry.model.updateOne(filter, { $set: rowData });
      return res.json({ success: true });
    }

    if (action === "delete") {
      const id = body.id;
      const filter = { [entry.idField]: id };
      const result = await entry.model.deleteOne(filter);
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Row with ID " + id + " not found." });
      }
      return res.json({ success: true });
    }

    return res.status(400).json({ error: "Invalid action: " + action });
  } catch (error) {
    console.error("[data:POST]", error);
    return res.status(500).json({ error: error.message || String(error) });
  }
});

/**
 * Blocks a client from ever writing passwordHash/salt directly through the
 * generic add/update path. Password changes go through the dedicated
 * "changePassword" action instead, which re-hashes server-side.
 * Mirrors sanitizeAccountWrite() from the old backend.
 *
 * NOTE (carried over from the original AppsScriptMirror.gs, not fixed as
 * part of this migration): this does NOT block a client from setting
 * `role` or `status` via the generic update path — that's the
 * self-promotion vulnerability flagged in the security audit. The whole
 * app currently authorizes every request with a single shared secret
 * (WEBAPP_SECRET) rather than per-user identity, so there's no way to
 * distinguish "an Admin is calling update" from "an RM is calling update"
 * at this layer without adding real session/token auth — a bigger change
 * than this migration was scoped to cover. Worth doing as a follow-up.
 */
function sanitizeAccountWrite(rowData) {
  delete rowData.passwordHash;
  delete rowData.salt;
}

async function handleLogin(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({ error: "Email and password are required." });
  }

  const account = await Account.findOne({ email: new RegExp(`^${escapeRegex(email.trim())}$`, "i") });
  if (!account) {
    return res.json({ error: "Invalid email or password." });
  }

  const computedHash = hashPassword(password, account.salt || "");
  if (!account.passwordHash || computedHash !== account.passwordHash) {
    return res.json({ error: "Invalid email or password." });
  }

  if (account.status === "Pending") {
    return res.json({ error: "Your account is awaiting Admin approval." });
  }
  if (account.status === "Inactive") {
    return res.json({ error: "This account has been deactivated." });
  }

  const safeUser = toSafeObject(account, ["passwordHash", "salt"]);
  return res.json({ success: true, user: safeUser });
}

async function handleRegisterRM(req, res) {
  const { firstName, lastName, email, password, program, year } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.json({ error: "Missing required fields." });
  }

  const existing = await Account.findOne({ email: new RegExp(`^${escapeRegex(email.trim())}$`, "i") });
  if (existing) {
    return res.json({ error: "An account with that email already exists." });
  }

  const salt = generateSalt();
  const hash = hashPassword(password, salt);
  const id = "ACC-" + Date.now();

  await Account.create({
    id,
    role: "ResidentMaker",
    firstName,
    lastName,
    email,
    passwordHash: hash,
    salt,
    status: "Pending",
    program: program || "",
    year: year || "",
    schedule: "",
    hoursWeek: 0,
    totalHours: 0,
    createdAt: new Date().toISOString(),
  });

  return res.json({ success: true, message: "Registered. Awaiting Admin approval." });
}

async function handleChangePassword(req, res) {
  const { id, currentPassword, newPassword } = req.body;
  if (!id || !currentPassword || !newPassword) {
    return res.json({ error: "Missing required fields." });
  }

  const account = await Account.findOne({ id });
  if (!account) return res.json({ error: "Account not found." });

  const computedHash = hashPassword(currentPassword, account.salt || "");
  if (computedHash !== account.passwordHash) {
    return res.json({ error: "Current password is incorrect." });
  }
  if (String(newPassword).length < 8) {
    return res.json({ error: "New password must be at least 8 characters." });
  }

  const newSalt = generateSalt();
  const newHash = hashPassword(newPassword, newSalt);
  await Account.updateOne({ id }, { $set: { passwordHash: newHash, salt: newSalt } });

  return res.json({ success: true });
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = router;
