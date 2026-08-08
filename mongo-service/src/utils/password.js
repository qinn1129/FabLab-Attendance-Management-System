const crypto = require("crypto");

/**
 * Matches AppsScriptMirror.gs's hashPassword() exactly:
 *   Utilities.computeDigest(SHA_256, salt + password) -> hex string
 * Keeping this identical means migrated accounts' existing passwordHash
 * values remain valid after migration — nobody has to reset their password.
 */
function hashPassword(password, salt) {
  return crypto
    .createHash("sha256")
    .update(String(salt) + String(password))
    .digest("hex");
}

/** Matches Apps Script's generateSalt(): a UUID with dashes stripped. */
function generateSalt() {
  return crypto.randomUUID().replace(/-/g, "");
}

module.exports = { hashPassword, generateSalt };
