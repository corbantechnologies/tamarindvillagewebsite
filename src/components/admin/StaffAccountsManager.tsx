import React, { useState } from "react";
import { 
  Users, UserPlus, Key, Mail, Lock, ShieldCheck, 
  Trash2, Edit3, X, Check, Eye, EyeOff, ShieldAlert, Clock 
} from "lucide-react";
import { StaffUser, StaffRole } from "../../types";

interface StaffAccountsManagerProps {
  staffUsers: StaffUser[];
  onSaveUser: (userData: { name: string; email: string; password: string; role: StaffRole }) => Promise<void>;
  onUpdateUser: (id: string, updates: Partial<StaffUser> & { password?: string }) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  currentUserId?: string;
}

export default function StaffAccountsManager({
  staffUsers,
  onSaveUser,
  onUpdateUser,
  onDeleteUser,
  currentUserId
}: StaffAccountsManagerProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New user form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRole>("reservations");
  const [showPassword, setShowPassword] = useState(false);

  // Edit user form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<StaffRole>("reservations");
  const [editPassword, setEditPassword] = useState("");
  const [editActive, setEditActive] = useState(true);

  const openAddModal = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("reservations");
    setShowPassword(false);
    setIsAddOpen(true);
  };

  const openEditModal = (u: StaffUser) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditPassword("");
    setEditActive(u.active ?? true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;
    setIsSubmitting(true);
    try {
      await onSaveUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role
      });
      setIsAddOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      const updates: any = {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        role: editRole,
        active: editActive
      };
      if (editPassword) {
        updates.password = editPassword;
      }
      await onUpdateUser(editingUser.id, updates);
      setEditingUser(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (r: string) => {
    switch (r?.toLowerCase()) {
      case "admin":
        return <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">Admin</span>;
      case "manager":
        return <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">Manager</span>;
      case "reservations":
      case "reservationist":
        return <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">Reservations</span>;
      case "reception":
      case "concierge":
        return <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">Reception</span>;
      default:
        return <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-stone-100 text-stone-700">{r}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-brand-teal mb-1">
            <ShieldCheck className="w-4 h-4 text-brand-gold" />
            <span>Identity &amp; Role-Based Access Control (RBAC)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            Staff Accounts &amp; Permissions
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage individual staff accounts, email logins, password policies, and department roles.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal text-white font-bold text-xs uppercase tracking-widest hover:bg-brand-teal-dark transition-colors cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New Account</span>
        </button>
      </div>

      {/* ROLES REFERENCE GUIDE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 border-l-3 border-purple-500 border-t border-r border-b border-stone-200">
          <div className="font-bold text-stone-900 uppercase tracking-wider">Admin</div>
          <div className="text-[11px] text-stone-500 mt-1 leading-relaxed">
            Full root ownership, provision &amp; revoke staff accounts, audit trails, and backups.
          </div>
        </div>
        <div className="bg-white p-4 border-l-3 border-amber-500 border-t border-r border-b border-stone-200">
          <div className="font-bold text-stone-900 uppercase tracking-wider">Manager</div>
          <div className="text-[11px] text-stone-500 mt-1 leading-relaxed">
            Operational oversight, website content, dining, facilities, and rate approval.
          </div>
        </div>
        <div className="bg-white p-4 border-l-3 border-emerald-500 border-t border-r border-b border-stone-200">
          <div className="font-bold text-stone-900 uppercase tracking-wider">Reservations</div>
          <div className="text-[11px] text-stone-500 mt-1 leading-relaxed">
            Inquiries pipeline, custom quotations, Paystack payment links, and pricing rules.
          </div>
        </div>
        <div className="bg-white p-4 border-l-3 border-sky-500 border-t border-r border-b border-stone-200">
          <div className="font-bold text-stone-900 uppercase tracking-wider">Reception</div>
          <div className="text-[11px] text-stone-500 mt-1 leading-relaxed">
            Front desk board, check-in &amp; check-out, in-house guest list, and transfer pickups.
          </div>
        </div>
      </div>

      {/* STAFF USERS TABLE */}
      <div className="bg-white border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Email Login</th>
                <th className="py-3 px-4">Role Assigned</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {staffUsers.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-stone-900">
                    {u.name}
                    {u.id === currentUserId && (
                      <span className="ml-2 text-[9px] font-mono uppercase bg-brand-gold/20 text-brand-dark px-1.5 py-0.5 border border-brand-gold/30">
                        You
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-stone-600">
                    {u.email}
                  </td>
                  <td className="py-3.5 px-4">
                    {getRoleBadge(u.role)}
                  </td>
                  <td className="py-3.5 px-4">
                    {u.active === false ? (
                      <span className="text-[10px] font-bold uppercase text-stone-400 bg-stone-100 px-2 py-0.5">
                        Deactivated
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-stone-400 text-[11px] whitespace-nowrap">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "Never"}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-700 bg-white border border-stone-300 hover:border-stone-500 transition-colors cursor-pointer"
                      >
                        Edit / Reset
                      </button>
                      {u.id !== "usr_admin_1" && u.id !== "user_admin" && (
                        <button
                          onClick={() => onDeleteUser(u.id)}
                          className="p-1 hover:bg-stone-100 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete staff account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE STAFF MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md p-6 border border-stone-300 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900">Provision Staff Account</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brenda Achieng"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Work Email Login *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. bachieng@tamarind.co.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Department Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRole)}
                  className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal bg-white"
                >
                  <option value="reservations">Reservations (Inquiries, Quotes, Rates)</option>
                  <option value="reception">Reception (Front Desk, Check-In/Out)</option>
                  <option value="manager">Manager (Property Operations &amp; Reports)</option>
                  <option value="admin">Administrator (Full Master System Control)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Temporary Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-brand-teal text-white font-bold uppercase tracking-widest hover:bg-brand-teal-dark transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md p-6 border border-stone-300 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900">Edit Staff Account</h3>
              <button onClick={() => setEditingUser(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Email Login</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">Department Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as StaffRole)}
                  className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal bg-white"
                >
                  <option value="reservations">Reservations</option>
                  <option value="reception">Reception</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Reset Password (leave empty to keep unchanged)
                </label>
                <input
                  type="password"
                  placeholder="Enter new password if changing"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold uppercase tracking-wider text-stone-700">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="w-4 h-4 text-brand-teal rounded-none border-stone-300"
                  />
                  <span>Account Active (Allowed to sign in)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-brand-teal text-white font-bold uppercase tracking-widest hover:bg-brand-teal-dark transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
