import { type Commission } from "../services/sheetsService";
import { type Account } from "../services/accountsService";

/**
 * Checks if a Commission is assigned to a specific Resident Maker (Account or Name/ID string).
 * Handles flexible matching:
 * - Match by Account ID (e.g., "ACC-123")
 * - Match by Email (e.g., "juan.delacruz@dlsu.edu.ph")
 * - Match by Full Name ("Juan dela Cruz" vs "Juan Dela Cruz")
 * - Match by Reversed Name ("dela Cruz, Juan")
 * - Whitespace and case insensitivity
 */
export function isCommissionAssignedToMaker(
  commission: Commission,
  makerOrTarget: Account | string | null | undefined
): boolean {
  if (!commission || !commission.rm || !makerOrTarget) return false;

  const rmRaw = String(commission.rm).trim();
  if (!rmRaw) return false;

  if (typeof makerOrTarget === "string") {
    const targetStr = makerOrTarget.trim();
    if (!targetStr) return false;
    return rmRaw.toLowerCase() === targetStr.toLowerCase();
  }

  const { id, firstName = "", lastName = "", email = "" } = makerOrTarget;

  const rmLower = rmRaw.toLowerCase();

  // 1. Direct ID match
  if (id && rmRaw === id) return true;

  // 2. Email match
  if (email && rmLower === email.toLowerCase().trim()) return true;

  // 3. Full Name match ("Juan dela Cruz")
  const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
  if (fullName && rmLower === fullName) return true;

  // 4. Reversed Full Name match ("dela Cruz, Juan")
  const reverseFullName = `${lastName}, ${firstName}`.trim().toLowerCase();
  if (reverseFullName && rmLower === reverseFullName) return true;

  // 5. Normalized whitespace match
  const normalizedRm = rmLower.replace(/\s+/g, " ");
  const normalizedFullName = fullName.replace(/\s+/g, " ");
  if (normalizedFullName && normalizedRm === normalizedFullName) return true;

  // 6. Partial check: if c.rm matches just first or last name when exact ID/email are not available
  if (firstName && rmLower === firstName.toLowerCase().trim()) return true;

  return false;
}

/**
 * Finds the Account object matching a commission's assigned RM in a list of makers.
 */
export function getMakerForCommission(
  commission: Commission,
  makers: Account[]
): Account | undefined {
  if (!commission.rm) return undefined;
  return makers.find(m => isCommissionAssignedToMaker(commission, m));
}

/**
 * Resolves a clean display name for a commission's assigned RM string.
 */
export function getMakerDisplayName(
  commissionRm: string | null | undefined,
  makers: Account[]
): string {
  if (!commissionRm || !commissionRm.trim()) return "Unassigned";
  const dummyComm = { rm: commissionRm } as Commission;
  const found = getMakerForCommission(dummyComm, makers);
  if (found) {
    return `${found.firstName} ${found.lastName}`;
  }
  return commissionRm.trim();
}

/**
 * Resolves the Google Drive (or file link) for a commission.
 * Primary source is the `file` column from the `commission_reqs` tab.
 * Handles full HTTP/HTTPS URLs, Google Drive domain patterns, embedded URLs,
 * and falls back to `driveLink` if needed. Returns null when no valid link is present.
 */
export function resolveDriveLink(commission: Partial<Commission> | null | undefined): string | null {
  if (!commission) return null;

  // 1. Primary check: 'file' column from commission_reqs tab
  const fromFile = (commission.file || "").trim();
  if (fromFile) {
    if (/^https?:\/\//i.test(fromFile)) {
      return fromFile;
    }
    if (/^drive\.google\.com/i.test(fromFile) || /^docs\.google\.com/i.test(fromFile)) {
      return `https://${fromFile}`;
    }
    const urlMatch = fromFile.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      return urlMatch[0];
    }
    if (!["—", "-", "needs design", "has file", "no file", "none"].includes(fromFile.toLowerCase())) {
      if (fromFile.includes(".") || fromFile.includes("/")) {
        return /^https?:\/\//i.test(fromFile) ? fromFile : `https://${fromFile}`;
      }
    }
  }

  // 2. Secondary fallback check: 'driveLink' field
  const direct = (commission.driveLink || "").trim();
  if (direct) {
    if (/^https?:\/\//i.test(direct)) return direct;
    if (/^drive\.google\.com/i.test(direct) || /^docs\.google\.com/i.test(direct)) {
      return `https://${direct}`;
    }
    const match = direct.match(/https?:\/\/[^\s]+/i);
    if (match) return match[0];
    return `https://${direct}`;
  }

  return null;
}
