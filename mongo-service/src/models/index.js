const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Every schema below intentionally uses `strict: false` and mostly-String
 * typing (matching how Sheets stores everything as text/loosely-typed
 * cells). The frontend already defensively coerces types on read
 * (`Number(x) || 0`, `x || null`, etc. — see each *Service.ts file), so
 * keeping the backend loose here avoids a second, redundant validation
 * layer and matches the exact behavior the app was already built around.
 *
 * `versionKey: false` disables Mongoose's `__v` field since nothing in the
 * app reads it. `id`/`resident_ID`/`reservation_id`/`attendance_request_id`
 * are the app's own string IDs (e.g. "COM-001", "ACC-<timestamp>") — NOT
 * Mongo's `_id` ObjectId, which still exists on every document but is
 * simply unused by the frontend.
 */
const baseOptions = { strict: false, versionKey: false };

const AccountSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    role: { type: String, enum: ["Admin", "ResidentMaker"], required: true },
    firstName: String,
    lastName: String,
    email: { type: String, required: true, index: true },
    passwordHash: String,
    salt: String,
    status: {
      type: String,
      enum: ["Active", "Pending", "On Leave", "Inactive"],
      default: "Pending",
    },
    program: String,
    year: String,
    schedule: String,
    hoursWeek: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },
    createdAt: String,
    description: String,
    hobbies: String,
    motto: String,
    profilePicture: String,
  },
  baseOptions
);

const CommissionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    client: String,
    clientEmail: String,
    clientContactNumber: String,
    clientType: String,
    affiliation: String,
    isDlsuStudent: Boolean,
    idNumber: String,
    program: String,
    college: String,
    department: String,
    service: String,
    purpose: String,
    purposeOther: String,
    color: String,
    colorOther: String,
    filament: String,
    urgency: String,
    expectedPickupDate: String,
    pickupOption: String,
    weight: Schema.Types.Mixed,
    notes: String,
    file: String,
    driveLink: String,
    submitted: String,
    rm: { type: String, default: null },
    printer: { type: String, default: null },
    status: { type: String, default: "Awaiting Approval" },
    deadline: { type: String, default: null },
    problems: { type: String, default: null },
  },
  baseOptions
);

const WeeklyScheduleSchema = new Schema(
  {
    resident_ID: { type: String, required: true, unique: true, index: true },
    Monday: String,
    Tuesday: String,
    Wednesday: String,
    Thursday: String,
    Friday: String,
    Saturday: String,
    Sunday: String,
  },
  baseOptions
);

const AnnouncementSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: String,
    body: String,
    date: String,
    pinned: { type: Boolean, default: false },
    createdAt: String,
  },
  baseOptions
);

const FaqSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    q: String,
    a: String,
    createdAt: String,
  },
  baseOptions
);

const TrainingModuleSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: String,
    desc: String,
    yt: String,
    gd: String,
    createdAt: String,
  },
  baseOptions
);

const ChatMessageSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    sender: String,
    role: { type: String, enum: ["Admin", "ResidentMaker"] },
    text: String,
    createdAt: String,
  },
  baseOptions
);

const AttendanceLogSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    resident_id: String,
    clock_in_timestamp: String,
    clock_out_timestamp: String,
    total_hours: { type: Number, default: 0 },
    status: { type: String, enum: ["Active", "Completed", "Invalid"] },
  },
  baseOptions
);

const MachineSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    "Machine Model": String,
    "Placement / Location Notes": String,
  },
  baseOptions
);

const MachineReservationSchema = new Schema(
  {
    reservation_id: { type: String, required: true, unique: true, index: true },
    machine_id: String,
    rm_id: String,
    start_time: String,
    end_time: String,
  },
  baseOptions
);

const AttendanceRequestSchema = new Schema(
  {
    attendance_request_id: { type: String, required: true, unique: true, index: true },
    rm_id: String,
    type: String,
    date: String,
    reason: String,
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  },
  baseOptions
);

const ServiceOfferingSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: String,
    desc: String,
    icon: String,
    image: String,
    order: { type: Number, default: 0 },
    createdAt: String,
    visible: { type: Boolean, default: true },
  },
  baseOptions
);

const WorkshopSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: String,
    date: String,
    tag: String,
    image: String,
    link: String,
    order: { type: Number, default: 0 },
    createdAt: String,
    visible: { type: Boolean, default: true },
  },
  baseOptions
);

const TestimonialSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: String,
    program: String,
    text: String,
    stars: { type: Number, default: 5 },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    submittedAt: String,
    shownCount: { type: Number, default: 0 },
  },
  baseOptions
);

const TaskSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    rm_id: String,
    task: String,
    deadline: String,
    status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
    source: { type: String, enum: ["Manual", "Auto"], default: "Manual" },
    createdAt: String,
  },
  baseOptions
);

module.exports = {
  Account: mongoose.model("Account", AccountSchema, "accounts"),
  Commission: mongoose.model("Commission", CommissionSchema, "commission_reqs"),
  WeeklySchedule: mongoose.model("WeeklySchedule", WeeklyScheduleSchema, "weeklyScheds"),
  Announcement: mongoose.model("Announcement", AnnouncementSchema, "announcements"),
  Faq: mongoose.model("Faq", FaqSchema, "faqs"),
  TrainingModule: mongoose.model("TrainingModule", TrainingModuleSchema, "modules"),
  ChatMessage: mongoose.model("ChatMessage", ChatMessageSchema, "chat"),
  AttendanceLog: mongoose.model("AttendanceLog", AttendanceLogSchema, "attendanceLogs"),
  Machine: mongoose.model("Machine", MachineSchema, "machines"),
  MachineReservation: mongoose.model("MachineReservation", MachineReservationSchema, "machine_reservations"),
  AttendanceRequest: mongoose.model("AttendanceRequest", AttendanceRequestSchema, "attendance_requests"),
  ServiceOffering: mongoose.model("ServiceOffering", ServiceOfferingSchema, "services"),
  Workshop: mongoose.model("Workshop", WorkshopSchema, "workshops"),
  Testimonial: mongoose.model("Testimonial", TestimonialSchema, "testimonials"),
  Task: mongoose.model("Task", TaskSchema, "tasks"),
};
