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
