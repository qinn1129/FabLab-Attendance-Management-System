/**
 * Mirrors validateSecret() from AppsScriptMirror.gs: accepts the secret
 * either as a query param (used by GET reads) or in the JSON body (used by
 * POST writes/actions). Responds the same way the old backend did —
 * {error: "..."} with a 200 status — rather than a REST-y 401, purely so
 * existing frontend error-handling code (`if (data.error) ...`) keeps
 * working unchanged during migration. Feel free to tighten this to a real
 * 401 later.
 */
function validateSecret(req, res, next) {
  const expected = process.env.WEBAPP_SECRET;
  const provided = req.query.secret || (req.body && req.body.secret);

  if (!expected) {
    console.error("[auth] WEBAPP_SECRET is not set on the server.");
    return res.status(500).json({ error: "Server misconfiguration: WEBAPP_SECRET is not set." });
  }

  if (provided !== expected) {
    return res.status(200).json({ error: "Unauthorized access denied." });
  }

  next();
}

module.exports = { validateSecret };
