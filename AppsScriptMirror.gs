//Mirrors the appscript code

const SPREADSHEET_ID = "";
const WEBAPP_SECRET = "";

// Columns that must NEVER leave the server once written.
const SENSITIVE_ACCOUNT_FIELDS = ["passwordHash", "salt"];

function validateSecret(e) {
  let token = "";
  if (e.parameter && e.parameter.secret) {
    token = e.parameter.secret;
  } else if (e.postData && e.postData.contents) {
    try {
      const body = JSON.parse(e.postData.contents);
      token = body.secret;
    } catch (err) {}
  }
  return token === WEBAPP_SECRET;
}

// ─────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────

function setup_commission_reqs() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  getOrCreateSheet(ss, "commission_reqs");
}

function setup_accounts() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  getOrCreateSheet(ss, "accounts");
}

function setup_announcements() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  getOrCreateSheet(ss, "announcements");
}

function setup_faqs() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  getOrCreateSheet(ss, "faqs");
}

function setup_modules() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  getOrCreateSheet(ss, "modules");
}

function setup_chat() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  getOrCreateSheet(ss, "chat");
}

function setup_attendanceLogs() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  getOrCreateSheet(ss, "attendanceLogs");
}

function setup_attendanceRequests() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  getOrCreateSheet(ss, "attendance_requests");
}

function setup_services() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  getOrCreateSheet(ss, "services");
}
 
function setup_workshops() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  getOrCreateSheet(ss, "workshops");
}

function setup_testimonials() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  getOrCreateSheet(ss, "testimonials");
}

function getOrCreateSheet(ss, name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
        sheet = ss.insertSheet(name);
        if (name === "commission_reqs") {
            const headers = [
                "id", "client", "clientEmail", "clientType", "idNumber", "program", "college",
                "department", "service", "purpose", "color", "filament", "urgency", "weight",
                "notes", "file", "submitted", "rm", "printer", "status", "deadline", "problems"
            ];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        } else if (name === "accounts") {
            const headers = [
                "id", "role", "firstName", "lastName", "email",
                "passwordHash", "salt", "status",
                "program", "year", "schedule", "hoursWeek", "totalHours",
                "createdAt", "description", "hobbies", "motto", "profilePicture"
            ];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        } else if (name === "weeklyScheds") {
            const headers = ["resident_ID", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        } else if (name === "announcements") {
            const headers = ["id", "title", "body", "date", "pinned", "createdAt"];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        } else if (name === "faqs") {
            const headers = ["id", "q", "a", "createdAt"];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        } else if (name === "modules") {
            const headers = ["id", "title", "desc", "yt", "gd", "createdAt"];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        } else if (name === "chat") {
            const headers = ["id", "sender", "role", "text", "createdAt"];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        } else if (name === "attendanceLogs") {
            const headers = ["id", "resident_id", "clock_in_timestamp", "clock_out_timestamp", "total_hours", "status"];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        } else if (name === "machines") {
            const headers = ["id", "Machine Model", "Placement / Location Notes"];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
            const initialMachines = [
                ["MAC-001", "Ender 3 Pro #1", "3D Printing Area - Table A"],
                ["MAC-002", "Bambu Lab P1S", "3D Printing Area - Shelf A"],
                ["MAC-003", "Ender 3 Pro #2", "3D Printing Area - Table A"],
                ["MAC-004", "Bambu Lab A1", "3D Printing Area - Table B"]
            ];
            sheet.getRange(2, 1, initialMachines.length, headers.length).setValues(initialMachines);
        } else if (name === "machine_reservations") {
            const headers = ["reservation_id", "machine_id", "rm_id", "start_time", "end_time"];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        } else if (name === "attendance_requests") {
            const headers = ["attendance_request_id", "rm_id", "type", "date", "reason", "status"];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        } else if (name === "services") {
            const headers = ["id", "title", "desc", "icon", "image", "order", "createdAt"];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        } else if (name === "workshops") {
            const headers = ["id", "title", "date", "tag", "image", "link", "order", "createdAt"];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        } else if (name === "testimonials") {
            const headers = ["id", "name", "program", "text", "stars", "status", "submittedAt", "shownCount"];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        }
    return sheet;
}
}

/**
 * Run this ONCE manually from the Apps Script editor.
 */
function seedFirstAdmin() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("accounts");
  if (!sheet) throw new Error("Run setup_accounts() first.");

  const email = "admin@animolabs.ph";
  const plainPassword = "adminpass";

  const existing = findAccountRowByEmail(sheet, email);
  if (existing.rowIndex !== -1) {
    Logger.log("Admin with that email already exists.");
    return;
  }

  const salt = generateSalt();
  const hash = hashPassword(plainPassword, salt);
  const id = "ACC-" + new Date().getTime();

  sheet.appendRow([
    id, "Admin", "Domie James", "Jucutan", email,
    hash, salt, "Active",
    "", "", "", "", "",
    new Date().toISOString()
  ]);
  Logger.log("Seeded admin: " + email + " / " + plainPassword);
}

// ─────────────────────────────────────────────
// PASSWORD HASHING (salted SHA-256 — Apps Script has no native bcrypt)
// ─────────────────────────────────────────────

function generateSalt() {
  return Utilities.getUuid().replace(/-/g, "");
}

function hashPassword(password, salt) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    salt + password
  );
  return digest.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, "0")).join("");
}

function findAccountRowByEmail(sheet, email) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const emailIndex = headers.indexOf("email");
  const target = String(email).trim().toLowerCase();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][emailIndex]).trim().toLowerCase() === target) {
      return { rowIndex: i + 1, headers, row: data[i] }; // rowIndex is 1-based sheet row
    }
  }
  return { rowIndex: -1, headers, row: null };
}

function rowToSafeObject(headers, row) {
  const obj = {};
  for (let j = 0; j < headers.length; j++) {
    if (SENSITIVE_ACCOUNT_FIELDS.includes(headers[j])) continue;
    obj[headers[j]] = row[j];
  }
  return obj;
}

// ─────────────────────────────────────────────
// doGet — generic sheet reader, EXCEPT accounts gets sanitized
// ─────────────────────────────────────────────

function doGet(e) {
  if (!validateSecret(e)) {
    return jsonOut({ error: "Unauthorized access denied." });
  }

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetname = e.parameter && e.parameter.sheet;
    if (!sheetname) throw new Error("Missing sheet name URL parameter");

    const sheet = getOrCreateSheet(ss, sheetname);
    if (!sheet) throw new Error("Sheet not found: " + sheetname);

    if (sheetname === "chat") {
      purgeExpiredChatMessages(sheet);
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return jsonOut([]);

    const headers = data[0];
    const rows = [];
    for (let i = 1; i < data.length; i++) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        // Never let passwordHash / salt leave the server, even for the
        // "accounts" sheet listing used by the RM roster / admin RM list.
        if (sheetname === "accounts" && SENSITIVE_ACCOUNT_FIELDS.includes(headers[j])) {
          continue;
        }
        row[headers[j]] = data[i][j];
      }
      rows.push(row);
    }
    return jsonOut(rows);
  } catch (error) {
    return jsonOut({ error: error.toString() });
  }
}

// ─────────────────────────────────────────────
// doPost — generic add/update, plus dedicated auth actions
// ─────────────────────────────────────────────

function doPost(e) {
  if (!validateSecret(e)) {
    return jsonOut({ error: "Unauthorized access denied." });
  }

  try {
    let body = null;
    if (e.postData && e.postData.contents) {
        try {
            body = JSON.parse(e.postData.contents);
        } catch (err) { }
    }
    const action = body ? body.action : null;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // ── Auth actions (always operate on "accounts", regardless of body.sheet) ──
    if (action === "login") return handleLogin(ss, body);
    if (action === "registerRM") return handleRegisterRM(ss, body);
    if (action === "changePassword") return handleChangePassword(ss, body);

    // ── Generic CRUD (commission_reqs, weeklyScheds, and accounts for Admin-side edits) ──
    let sheetname = (e.parameter && e.parameter.sheet);
    if (!sheetname && body && body.sheet) {
        sheetname = body.sheet;
    }

    if (!sheetname) {
        throw new Error("Missing sheet name URL or POST body parameter")
    }

    const sheet = getOrCreateSheet(ss, sheetname);
    if (!sheet) throw new Error("Sheet not found: " + sheetname);

    if (action === "add") {
      const rowData = Object.assign({}, body.data);
      if (sheetname === "accounts") sanitizeAccountWrite(rowData);

      const headers = sheet.getDataRange().getValues()[0];
      const newRow = new Array(headers.length).fill("");
      for (let key in rowData) {
        const index = headers.indexOf(key);
        if (index > -1) newRow[index] = rowData[key];
      }
      sheet.appendRow(newRow);

      if (sheetname === "chat") {
        purgeExpiredChatMessages(sheet);
      }

      return jsonOut({ success: true });
    }

    if (action === "update") {
      const id = body.id;
      const rowData = Object.assign({}, body.data);
      if (sheetname === "accounts") sanitizeAccountWrite(rowData);

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      let idIndex = headers.indexOf("id");
      if (idIndex === -1) idIndex = headers.indexOf("resident_ID");
      if (idIndex === -1) idIndex = headers.indexOf("reservation_id");
      if (idIndex === -1) idIndex = headers.indexOf("attendance_request_id");

      if (idIndex === -1) {
          throw new Error("No ID column ('id', 'resident_ID', or 'reservation_id') found in sheet headers.");
      }

      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][idIndex] == id) { rowIndex = i + 1; break; }
      }
      
      if (rowIndex === -1) {
          if (sheetname === "weeklyScheds") {
              const newRow = new Array(headers.length).fill("");
              newRow[idIndex] = id;
              for (let key in rowData) {
                  const colIndex = headers.indexOf(key);
                  if (colIndex > -1) {
                      newRow[colIndex] = rowData[key];
                  }
              }
              sheet.appendRow(newRow);
              return jsonOut({ success: true, created: true });
          } else {
              throw new Error("Row with ID " + id + " not found.");
          }
      }

      for (let key in rowData) {
        const colIndex = headers.indexOf(key);
        if (colIndex > -1) sheet.getRange(rowIndex, colIndex + 1).setValue(rowData[key]);
      }
      return jsonOut({ success: true });
    }

    if (action === "delete") {
      const id = body.id;
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      let idIndex = headers.indexOf("id");
      if (idIndex === -1) idIndex = headers.indexOf("resident_ID");
      if (idIndex === -1) idIndex = headers.indexOf("reservation_id");
      if (idIndex === -1) idIndex = headers.indexOf("attendance_request_id");
      if (idIndex === -1) throw new Error("No ID column found in sheet headers.");

      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][idIndex] == id) { rowIndex = i + 1; break; }
      }
      if (rowIndex === -1) throw new Error("Row with ID " + id + " not found.");

      sheet.deleteRow(rowIndex);
      return jsonOut({ success: true });
    }

    throw new Error("Invalid action: " + action);
  } catch (error) {
    return jsonOut({ error: error.toString() });
  }
}

/**
 * Blocks a client from ever writing passwordHash/salt directly through the
 * generic add/update path. Password changes should go through a dedicated
 * action later (e.g. "changePassword") that re-hashes server-side.
 */
function sanitizeAccountWrite(rowData) {
  SENSITIVE_ACCOUNT_FIELDS.forEach(f => delete rowData[f]);
}

function handleLogin(ss, body) {
  const email = body.email;
  const password = body.password;
  if (!email || !password) {
    return jsonOut({ error: "Email and password are required." });
  }

  const sheet = getOrCreateSheet(ss, "accounts");
  if (!sheet) return jsonOut({ error: "Accounts sheet not found." });

  const { rowIndex, headers, row } = findAccountRowByEmail(sheet, email);
  if (rowIndex === -1) {
    return jsonOut({ error: "Invalid email or password." });
  }

  const hashIndex = headers.indexOf("passwordHash");
  const saltIndex = headers.indexOf("salt");
  const statusIndex = headers.indexOf("status");

  const storedHash = String(row[hashIndex] || "").trim();
  const storedSalt = String(row[saltIndex] || "").trim();
  const computedHash = hashPassword(password, storedSalt);
  if (!storedHash || computedHash !== storedHash) {
    return jsonOut({ error: "Invalid email or password." });
  }

  const status = String(row[statusIndex] || "").trim();
  if (status === "Pending") {
    return jsonOut({ error: "Your account is awaiting Admin approval." });
  }
  if (status === "Inactive") {
    return jsonOut({ error: "This account has been deactivated." });
  }

  return jsonOut({ success: true, user: rowToSafeObject(headers, row) });
}

/**
 * Self-registration for Resident Makers only. New accounts start as
 * "Pending" and must be approved by an Admin (via the generic "update"
 * action, setting status to "Active") before they can log in.
 */
function handleRegisterRM(ss, body) {
  const { firstName, lastName, email, password, program, year } = body;
  if (!firstName || !lastName || !email || !password) {
    return jsonOut({ error: "Missing required fields." });
  }

  const sheet = getOrCreateSheet(ss, "accounts");
  if (!sheet) return jsonOut({ error: "Accounts sheet not found." });

  const existing = findAccountRowByEmail(sheet, email);
  if (existing.rowIndex !== -1) {
    return jsonOut({ error: "An account with that email already exists." });
  }

  const salt = generateSalt();
  const hash = hashPassword(password, salt);
  const id = "ACC-" + new Date().getTime();

  sheet.appendRow([
    id, "ResidentMaker", firstName, lastName, email,
    hash, salt, "Pending",
    program || "", year || "", "", 0, 0,
    new Date().toISOString()
  ]);

  return jsonOut({ success: true, message: "Registered. Awaiting Admin approval." });
}

function handleChangePassword(ss, body) {
  const { id, currentPassword, newPassword } = body;
  if (!id || !currentPassword || !newPassword) {
    return jsonOut({ error: "Missing required fields." });
  }

  const sheet = getOrCreateSheet(ss, "accounts");
  if (!sheet) return jsonOut({ error: "Accounts sheet not found." });

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf("id");
  const hashIndex = headers.indexOf("passwordHash");
  const saltIndex = headers.indexOf("salt");

  let rowIndex = -1;
  let row = null;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] == id) { rowIndex = i + 1; row = data[i]; break; }
  }
  if (rowIndex === -1) return jsonOut({ error: "Account not found." });

  const computedHash = hashPassword(currentPassword, row[saltIndex]);
  if (computedHash !== row[hashIndex]) {
    return jsonOut({ error: "Current password is incorrect." });
  }
  if (newPassword.length < 8) {
    return jsonOut({ error: "New password must be at least 8 characters." });
  }

  const newSalt = generateSalt();
  const newHash = hashPassword(newPassword, newSalt);
  sheet.getRange(rowIndex, hashIndex + 1).setValue(newHash);
  sheet.getRange(rowIndex, saltIndex + 1).setValue(newSalt);

  return jsonOut({ success: true });
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

const CHAT_MESSAGE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Deletes any row in the "chat" sheet whose createdAt is more than 24
 * hours old. Called lazily on every read/write to the sheet, so no
 * separate time-driven trigger is required.
 */
function purgeExpiredChatMessages(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const headers = data[0];
  const createdAtIndex = headers.indexOf("createdAt");
  if (createdAtIndex === -1) return;

  const now = Date.now();
  // Walk bottom-up so deleting a row doesn't shift the index of rows
  // still left to check.
  for (let i = data.length - 1; i >= 1; i--) {
    const createdAtMs = new Date(data[i][createdAtIndex]).getTime();
    if (!isNaN(createdAtMs) && (now - createdAtMs) > CHAT_MESSAGE_TTL_MS) {
      sheet.deleteRow(i + 1);
    }
  }
}

function setup_chat() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  getOrCreateSheet(ss, "chat");
}