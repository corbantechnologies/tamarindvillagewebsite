import { StaffUser } from "../types";

export const DEFAULT_STAFF_USERS: StaffUser[] = [
  {
    id: "user_admin",
    name: "Master Administrator",
    pin: "1977",
    role: "admin",
    email: "admin@tamarind.co.ke",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "user_res1",
    name: "Reservations Lead",
    pin: "2026",
    role: "reservationist",
    email: "reservations.village@tamarind.co.ke",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "user_concierge",
    name: "Front Desk Concierge",
    pin: "2024",
    role: "concierge",
    email: "concierge@tamarind.co.ke",
    createdAt: "2026-01-01T00:00:00.000Z"
  }
];

export function loadStaffUsers(): StaffUser[] {
  try {
    const saved = localStorage.getItem("tamarind_staff_users");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to load staff users from localStorage:", e);
  }
  return DEFAULT_STAFF_USERS;
}

export function saveStaffUsers(users: StaffUser[]): void {
  try {
    localStorage.setItem("tamarind_staff_users", JSON.stringify(users));
  } catch (e) {
    console.error("Failed to save staff users to localStorage:", e);
  }
}

export function getCurrentStaffUser(): StaffUser | null {
  try {
    const saved = localStorage.getItem("tamarind_active_staff_user");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load active staff user:", e);
  }
  return null;
}

export function setCurrentStaffUser(user: StaffUser | null): void {
  try {
    if (user) {
      localStorage.setItem("tamarind_active_staff_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("tamarind_active_staff_user");
    }
  } catch (e) {
    console.error("Failed to set active staff user:", e);
  }
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  actor: "admin" | "reservationist" | "guest" | "system";
  actorName: string;
  action: string;
  type: string;
  category?: string;
  targetName?: string;
  targetType?: string;
  inquiryId?: string;
}

export const INITIAL_SYSTEM_LOGS: SystemAuditLog[] = [
  {
    id: "log_init_01",
    timestamp: "2026-01-01T00:00:00.000Z",
    actor: "system",
    actorName: "Tamarind Core System",
    action: "System initialized with Multi-User PIN Access Control & Live Pipeline",
    type: "system_init",
    category: "security",
    targetName: "Access Control",
    targetType: "System"
  },
  {
    id: "log_init_02",
    timestamp: "2026-01-01T00:00:00.000Z",
    actor: "admin",
    actorName: "Master Administrator",
    action: "Master Administrator credential registered (PIN 1977)",
    type: "pin_allocated",
    category: "security",
    targetName: "Master Administrator",
    targetType: "User"
  },
  {
    id: "log_init_03",
    timestamp: "2026-01-01T00:00:00.000Z",
    actor: "admin",
    actorName: "Master Administrator",
    action: "Allocated access passcode for Reservations Lead (PIN 2026)",
    type: "pin_allocated",
    category: "security",
    targetName: "Reservations Lead",
    targetType: "User"
  },
  {
    id: "log_init_04",
    timestamp: "2026-01-01T00:00:00.000Z",
    actor: "admin",
    actorName: "Master Administrator",
    action: "Allocated access passcode for Front Desk Concierge (PIN 2024)",
    type: "pin_allocated",
    category: "security",
    targetName: "Front Desk Concierge",
    targetType: "User"
  }
];

export function loadSystemAuditLogs(): SystemAuditLog[] {
  try {
    const saved = localStorage.getItem("tamarind_system_audit_logs");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to load system audit logs from localStorage:", e);
  }
  return INITIAL_SYSTEM_LOGS;
}

export function saveSystemAuditLogs(logs: SystemAuditLog[]): void {
  try {
    localStorage.setItem("tamarind_system_audit_logs", JSON.stringify(logs));
  } catch (e) {
    console.error("Failed to save system audit logs to localStorage:", e);
  }
}

export function ensureInquiryAuditTrail(inq: any): any {
  if (!inq) return inq;
  const payload = inq.payload || {};
  let auditTrail: any[] = Array.isArray(payload.auditTrail) ? [...payload.auditTrail] : [];

  if (auditTrail.length === 0) {
    // 1. Initial creation entry
    auditTrail.push({
      id: "audit_init_" + inq.id,
      timestamp: inq.createdAt || new Date().toISOString(),
      actor: "guest",
      actorName: payload.name || "Online Guest",
      action: `Inquiry submitted for ${payload.apartmentName || inq.type || "Apartment Suite"}${payload.checkIn ? ` (${payload.checkIn} to ${payload.checkOut})` : ""}`,
      type: "inquiry_created"
    });

    // 2. Any notes
    if (Array.isArray(payload.staffNotes)) {
      payload.staffNotes.forEach((note: any, idx: number) => {
        auditTrail.push({
          id: "audit_note_" + inq.id + "_" + idx,
          timestamp: note.createdAt || inq.createdAt || new Date().toISOString(),
          actor: "staff",
          actorName: note.author || "Tamarind Reservations",
          action: `Added negotiation note: "${note.text}"`,
          type: "staff_note"
        });
      });
    }

    // 3. Status change if not pending
    if (inq.status && inq.status.toLowerCase() !== "pending") {
      auditTrail.push({
        id: "audit_status_" + inq.id,
        timestamp: inq.createdAt || new Date().toISOString(),
        actor: "staff",
        actorName: "Tamarind Reservations",
        action: `Status moved to "${inq.status}"`,
        type: "status_change"
      });
    }

    // 4. Payment link if exists
    if (payload.paymentLink) {
      auditTrail.push({
        id: "audit_pay_" + inq.id,
        timestamp: inq.createdAt || new Date().toISOString(),
        actor: "staff",
        actorName: "Tamarind Reservations",
        action: `Direct payment link configured: ${payload.paymentLink}`,
        type: "payment_link"
      });
    }

    payload.auditTrail = auditTrail;
    inq.payload = payload;
  }
  return inq;
}
