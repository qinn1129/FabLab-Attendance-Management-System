// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────

export const RESIDENT_MAKERS = [
  { id: 1, name: "Juan dela Cruz", email: "juan.delacruz@dlsu.edu.ph", program: "BS Computer Science", year: 3, schedule: ["Mon","Wed","Fri"], hoursWeek: 14, totalHours: 203, status: "Active" },
  { id: 2, name: "Ana Reyes", email: "ana.reyes@dlsu.edu.ph", program: "BS Electronics Engineering", year: 4, schedule: ["Tue","Thu"], hoursWeek: 10, totalHours: 178, status: "Active" },
  { id: 3, name: "Miguel Bautista", email: "miguel.bautista@dlsu.edu.ph", program: "BS Industrial Design", year: 2, schedule: ["Mon","Tue","Thu"], hoursWeek: 15, totalHours: 145, status: "Active" },
  { id: 4, name: "Sofia Lim", email: "sofia.lim@dlsu.edu.ph", program: "BS Mechanical Engineering", year: 3, schedule: ["Wed","Fri"], hoursWeek: 8, totalHours: 267, status: "On Leave" },
  { id: 5, name: "Carlos Santos", email: "carlos.santos@dlsu.edu.ph", program: "BS Computer Engineering", year: 4, schedule: ["Mon","Fri"], hoursWeek: 10, totalHours: 312, status: "Active" },
];

export const COMMISSIONS = [
  { id: "COM-001", client: "Bianca Torres", service: "3D Printing", file: "Has File", color: "Black", filament: "PLA", rm: "Juan dela Cruz", deadline: "Jun 27", printer: "Ender 3 Pro #1", status: "In Progress", submitted: "Jun 23" },
  { id: "COM-002", client: "Patrick Mendoza", service: "3D Printing", file: "Needs Design", color: "White", filament: "PETG", rm: "Ana Reyes", deadline: "Jun 30", printer: "Bambu Lab P1S", status: "Pending", submitted: "Jun 23" },
  { id: "COM-003", client: "Kristine Go", service: "Customized Keychain", file: "Has File", color: "Blue", filament: "PLA", rm: "Miguel Bautista", deadline: "Jun 26", printer: "Ender 3 Pro #2", status: "Completed", submitted: "Jun 20" },
  { id: "COM-004", client: "Rafael Cruz", service: "NFC Keychain", file: "—", color: "Red", filament: "TPU", rm: null, deadline: "Jul 02", printer: null, status: "Awaiting Approval", submitted: "Jun 23" },
  { id: "COM-005", client: "Leah Villanueva", service: "3D Printing", file: "Has File", color: "Gray", filament: "ABS", rm: "Carlos Santos", deadline: "Jun 28", printer: "Bambu Lab A1", status: "In Progress", submitted: "Jun 21" },
  { id: "COM-006", client: "Maria Gonzales", service: "3D Printing", file: "Needs Design", color: "White", filament: "PLA", rm: null, deadline: "Jul 04", printer: null, status: "Awaiting Approval", submitted: "Jun 23" },
];

export const PENDING_APPROVALS = [
  { id: "COM-004", client: "Rafael Cruz", email: "rafael.cruz@dlsu.edu.ph", phone: "+63 912 345 6789", service: "NFC Keychain", submitted: "Jun 23, 2:15 PM" },
  { id: "COM-006", client: "Maria Gonzales", email: "maria.gonzales@dlsu.edu.ph", phone: "+63 917 234 5678", service: "3D Printing (Needs Design)", submitted: "Jun 23, 3:42 PM" },
  { id: "COM-007", client: "Jose Ramos", email: "jose.ramos@dlsu.edu.ph", phone: "+63 998 876 5432", service: "Customized Keychain", submitted: "Jun 23, 4:05 PM" },
];

export const ANNOUNCEMENTS_DATA = [
  { id: 1, title: "FabLab Operating Hours Update", body: "Starting next week, FabLab will be open from 8AM to 6PM on weekdays. Weekends remain closed for regular commissions.", date: "Jun 23", pinned: true },
  { id: 2, title: "New Bambu Lab Printer Installed", body: "We are excited to announce a new Bambu Lab X1 Carbon is now available. Sign-up slots open Monday.", date: "Jun 20", pinned: false },
  { id: 3, title: "Workshop: Intro to 3D Modeling", body: "Join us this Saturday for an introductory Fusion 360 workshop. Limited slots only — register via email.", date: "Jun 18", pinned: false },
];

export const MODULES_DATA = [
  { id: 1, title: "Introduction to FDM 3D Printing", desc: "Fundamentals of Fused Deposition Modeling, printer setup, and slicing software.", yt: "https://youtube.com", gd: "https://drive.google.com" },
  { id: 2, title: "Designing for 3D Printing in Fusion 360", desc: "Best practices for designing parts optimized for FDM printing tolerances.", yt: "https://youtube.com", gd: "https://drive.google.com" },
  { id: 3, title: "NFC Technology and Applications", desc: "Overview of NFC technology and how FabLab produces NFC keychains and tags.", yt: "https://youtube.com", gd: "https://drive.google.com" },
  { id: 4, title: "Keychain Design and Customization", desc: "Step-by-step guide to designing and producing custom PLA keychains.", yt: "https://youtube.com", gd: "https://drive.google.com" },
];

export const FAQS_DATA = [
  { id: 1, q: "How long does a 3D printing commission take?", a: "Turnaround depends on complexity and size. Most prints complete within 2–5 business days." },
  { id: 2, q: "What file formats do you accept?", a: "We accept STL, OBJ, 3MF, and STEP files. Our team can also work from 2D sketches for design commissions." },
  { id: 3, q: "How do I pay for my commission?", a: "Pricing details are sent to your registered email after your request is reviewed and approved." },
  { id: 4, q: "Can I request a specific filament color?", a: "Yes! We carry PLA, ABS, PETG, and TPU in various colors, subject to current stock availability." },
  { id: 5, q: "What happens if I submit after Friday?", a: "Requests submitted Friday–Sunday will be processed the following week starting Monday." },
];

export const CHART_COMMISSION = [
  { name: "Mon", count: 4 }, { name: "Tue", count: 7 }, { name: "Wed", count: 5 },
  { name: "Thu", count: 8 }, { name: "Fri", count: 6 }, { name: "Sat", count: 2 },
];

export const CHART_STATUS = [
  { name: "Completed", value: 34, color: "#059669" },
  { name: "In Progress", value: 12, color: "#3b82f6" },
  { name: "Pending", value: 7, color: "#f59e0b" },
  { name: "Awaiting", value: 3, color: "#f97316" },
];

export const CHAT_MSGS = [
  { id: 1, sender: "Ana Reyes", avatar: "AR", mine: false, time: "10:24 AM", text: "Hey, is the Bambu printer available after 3PM?" },
  { id: 2, sender: "You", avatar: "ME", mine: true, time: "10:26 AM", text: "Yes it should be free from 3–5PM today!" },
  { id: 3, sender: "Miguel Bautista", avatar: "MB", mine: false, time: "10:31 AM", text: "COM-003 is ready for pickup notification!" },
  { id: 4, sender: "Juan dela Cruz", avatar: "JD", mine: false, time: "10:45 AM", text: "COM-001 print started — ETA ~4 hours." },
];

export const TESTIMONIALS = [
  { name: "Nico Alvarez", program: "BS MecE '25", text: "FabLab made my thesis prototype a reality. The resident makers were incredibly helpful and professional.", stars: 5 },
  { name: "Camille Flores", program: "BS IndD '25", text: "Super fast turnaround! My custom keychains for our org event were perfect. Will definitely order again.", stars: 5 },
  { name: "Andrei Tan", program: "BS CoE '24", text: "Couldn't have finished my capstone without FabLab. High quality prints and great service overall.", stars: 5 },
];
