const models = require("../models");

/**
 * Mirrors AppsScriptMirror.gs's `getOrCreateSheet` dispatch: each entry
 * here is the MongoDB equivalent of one Sheets tab. `idField` tells the
 * generic add/update/delete route which field identifies a row (most
 * sheets use "id", but a few — inherited as-is from the original schema —
 * use their own naming: "resident_ID", "reservation_id",
 * "attendance_request_id").
 */
const COLLECTIONS = {
  commission_reqs: { model: models.Commission, idField: "id" },
  accounts: {
    model: models.Account,
    idField: "id",
    // Columns that must NEVER leave the server once written — mirrors
    // SENSITIVE_ACCOUNT_FIELDS in the original AppsScriptMirror.gs.
    sensitiveFields: ["passwordHash", "salt"],
  },
  weeklyScheds: { model: models.WeeklySchedule, idField: "resident_ID" },
  announcements: { model: models.Announcement, idField: "id" },
  faqs: { model: models.Faq, idField: "id" },
  modules: { model: models.TrainingModule, idField: "id" },
  chat: { model: models.ChatMessage, idField: "id" },
  attendanceLogs: { model: models.AttendanceLog, idField: "id" },
  machines: { model: models.Machine, idField: "id" },
  machine_reservations: { model: models.MachineReservation, idField: "reservation_id" },
  attendance_requests: { model: models.AttendanceRequest, idField: "attendance_request_id" },
  services: { model: models.ServiceOffering, idField: "id" },
  workshops: { model: models.Workshop, idField: "id" },
  testimonials: { model: models.Testimonial, idField: "id" },
  tasks: { model: models.Task, idField: "id" },
};

const CHAT_MESSAGE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours — matches purgeExpiredChatMessages in the old backend

module.exports = { COLLECTIONS, CHAT_MESSAGE_TTL_MS };
