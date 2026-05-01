"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminGuard } from "../../../src/hooks/useAdminGuard";
import {
  AUTH_BACKEND_ENABLED,
  UserProfile,
} from "../../../src/services/authService";

export default function UserManagement() {
  const { loading, authorized } = useAdminGuard();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "citizen",
    isActive: true,
  });

  // ─── Fetch users ──────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setFetching(true);
    try {
      if (!AUTH_BACKEND_ENABLED) {
        setUsers([]);
        setError("");
        return;
      }
      setError("Firestore is not wired in this build.");
    } catch {
      setError("Failed to fetch users.");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) fetchUsers();
  }, [authorized, fetchUsers]);

  // ─── Modal helpers ────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ firstName: "", lastName: "", email: "", role: "citizen", isActive: true });
    setShowModal(true);
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({ firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, isActive: user.isActive });
    setShowModal(true);
  };

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setError("");
    if (!AUTH_BACKEND_ENABLED) {
      setError("Saving users requires enabling the auth backend (Firebase).");
      return;
    }
    setError("Firestore is not wired in this build.");
  };

  const handleToggleActive = async (_user: UserProfile) => {
    if (!AUTH_BACKEND_ENABLED) {
      setError("Firestore is not enabled.");
      return;
    }
    setError("Firestore is not wired in this build.");
  };

  const handleDelete = async (user: UserProfile) => {
    if (!confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}? This cannot be undone.`)) return;
    if (!AUTH_BACKEND_ENABLED) {
      setError("Firestore is not enabled.");
      return;
    }
    setError("Firestore is not wired in this build.");
  };

  // ─── Role badge color ─────────────────────────────────────────────────────
  const roleBadgeStyle = (role: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      admin:              { background: "#d1fae5", color: "#065f46" },
      staff:              { background: "#dbeafe", color: "#1e40af" },
      citizen:  { background: "#f3f4f6", color: "#374151" },
    };
    return map[role] ?? map["Citizen"];
  };

  const formatRole = (role: string) => {
    const map: Record<string, string> = {
      admin: "Admin",
      staff: "Staff",
      citizen: "Citizen",
    };
    return map[role] ?? role;
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", color: "#2d6a4f" }}>
      Checking access...
    </div>
  );
  if (!authorized) return null;

  return (
    <div className="um-page" data-user-management-page>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap');

        /* Scoped only to this page — a global * reset breaks the app shell (sidebar, header). */
        .um-page,
        .um-page *,
        .um-page *::before,
        .um-page *::after {
          box-sizing: border-box;
        }

        .um-root {
          min-height: 100vh;
          background-color: #f0f4f0;
          background-image:
            radial-gradient(ellipse at 20% 10%, rgba(45,106,79,0.07) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(88,157,113,0.05) 0%, transparent 50%);
          font-family: 'DM Sans', sans-serif;
          padding: 2rem 1.5rem;
        }

        .um-inner {
          max-width: 1000px;
          margin: 0 auto;
        }

        /* ── Header ── */
        .um-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.75rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .um-header-left h1 {
          font-family: 'Lora', serif;
          font-size: 1.65rem;
          font-weight: 600;
          color: #1a3328;
          letter-spacing: -0.2px;
        }

        .um-header-left p {
          font-size: 0.83rem;
          color: #6b7c74;
          margin-top: 0.2rem;
          font-weight: 300;
        }

        .um-add-btn {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.65rem 1.25rem;
          background: linear-gradient(135deg, #2d6a4f, #40916c);
          color: white;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(45,106,79,0.28);
          transition: opacity 0.2s, transform 0.15s;
        }

        .um-add-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        /* ── Alerts ── */
        .alert {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.85rem;
          margin-bottom: 1.25rem;
        }
        .alert-error   { background: #fef2f2; color: #c0392b; border: 1px solid #fecaca; }
        .alert-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

        /* ── Table card ── */
        .um-card {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 8px 32px rgba(45,106,79,0.08);
          overflow: hidden;
        }

        .um-table {
          width: 100%;
          border-collapse: collapse;
        }

        .um-table thead {
          background: #f4f9f6;
          border-bottom: 1.5px solid #e0ede6;
        }

        .um-table th {
          padding: 0.85rem 1.1rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 600;
          color: #4a6358;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .um-table td {
          padding: 0.9rem 1.1rem;
          font-size: 0.875rem;
          color: #2d4a3e;
          border-bottom: 1px solid #eef4f1;
          vertical-align: middle;
        }

        .um-table tbody tr:last-child td { border-bottom: none; }

        .um-table tbody tr:hover td { background: #fafcfb; }

        /* ── Role badge ── */
        .role-badge {
          display: inline-block;
          padding: 0.25rem 0.65rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        /* ── Status dot ── */
        .status-wrap {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.85rem;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-dot.active   { background: #22c55e; }
        .status-dot.inactive { background: #d1d5db; }

        /* ── Action buttons ── */
        .action-wrap { display: flex; align-items: center; gap: 0.5rem; }

        .btn-edit, .btn-toggle, .btn-delete {
          padding: 0.35rem 0.75rem;
          border-radius: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }

        .btn-edit {
          background: #f0f7f3;
          color: #2d6a4f;
          border-color: #c3dece;
        }
        .btn-edit:hover { background: #2d6a4f; color: white; border-color: #2d6a4f; }

        .btn-toggle {
          background: #f8fbf9;
          color: #4a6358;
          border-color: #d4e4db;
        }
        .btn-toggle:hover { background: #e0ede6; }

        .btn-delete {
          background: #fff5f5;
          color: #c0392b;
          border-color: #fecaca;
        }
        .btn-delete:hover { background: #c0392b; color: white; border-color: #c0392b; }

        /* ── Empty / loading state ── */
        .um-empty {
          padding: 3rem;
          text-align: center;
          color: #8aab98;
          font-size: 0.9rem;
        }

        /* ── Modal overlay ── */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 35, 25, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 1.5rem;
        }

        .modal-box {
          background: #ffffff;
          border-radius: 16px;
          padding: 2rem;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }

        .modal-title {
          font-family: 'Lora', serif;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a3328;
          margin-bottom: 1.5rem;
        }

        .modal-field { margin-bottom: 1rem; }

        .modal-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 500;
          color: #2d4a3e;
          margin-bottom: 0.35rem;
        }

        .modal-input, .modal-select {
          width: 100%;
          padding: 0.65rem 0.9rem;
          border: 1.5px solid #d4e4db;
          border-radius: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          color: #1a3328;
          background: #f8fbf9;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .modal-input:focus, .modal-select:focus {
          border-color: #2d6a4f;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(45,106,79,0.1);
        }

        .modal-checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #4a6358;
          cursor: pointer;
        }

        .modal-checkbox-label input { accent-color: #2d6a4f; width: 15px; height: 15px; }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        .modal-save-btn {
          flex: 1;
          padding: 0.7rem;
          background: linear-gradient(135deg, #2d6a4f, #40916c);
          color: white;
          border: none;
          border-radius: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(45,106,79,0.25);
          transition: opacity 0.2s;
        }

        .modal-save-btn:hover { opacity: 0.9; }

        .modal-cancel-btn {
          flex: 1;
          padding: 0.7rem;
          background: #f4f9f6;
          color: #4a6358;
          border: 1.5px solid #d4e4db;
          border-radius: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }

        .modal-cancel-btn:hover { background: #e0ede6; }

        /* ── Name cell ── */
        .name-cell { font-weight: 500; color: #1a3328; }
        .email-cell { color: #6b7c74; font-size: 0.83rem; }
      `}</style>

      <div className="um-root">
        <div className="um-inner">

          {/* Header */}
          <div className="um-header">
            <div className="um-header-left">
              <h1>User Management</h1>
              <p>{users.length} total {users.length === 1 ? "user" : "users"}</p>
            </div>
            <button className="um-add-btn" onClick={openCreateModal}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add User
            </button>
          </div>

          {/* Alerts */}
          {error && <div className="alert alert-error">{error}</div>}
          {successMessage && <div className="alert alert-success">{successMessage}</div>}

          {/* Table */}
          <div className="um-card">
            {fetching ? (
              <div className="um-empty">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="um-empty">No users found.</div>
            ) : (
              <table className="um-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.uid}>
                      <td className="name-cell">{user.firstName} {user.lastName}</td>
                      <td className="email-cell">{user.email}</td>
                      <td>
                        <span className="role-badge" style={roleBadgeStyle(user.role)}>
                          {formatRole(user.role)}
                        </span>
                      </td>
                      <td>
                        <div className="status-wrap">
                          <span className={`status-dot ${user.isActive ? "active" : "inactive"}`} />
                          {user.isActive ? "Active" : "Inactive"}
                        </div>
                      </td>
                      <td>
                        <div className="action-wrap">
                          <button className="btn-edit" onClick={() => openEditModal(user)}>Edit</button>
                          <button className="btn-toggle" onClick={() => handleToggleActive(user)}>
                            {user.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button className="btn-delete" onClick={() => handleDelete(user)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="modal-title">{editingUser ? "Edit User" : "Add User"}</h2>

            <div className="modal-field">
              <label className="modal-label">First Name</label>
              <input
                className="modal-input"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Juan"
              />
            </div>

            <div className="modal-field">
              <label className="modal-label">Last Name</label>
              <input
                className="modal-input"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Dela Cruz"
              />
            </div>

            {!editingUser && (
              <div className="modal-field">
                <label className="modal-label">Email</label>
                <input
                  className="modal-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
            )}

            <div className="modal-field">
              <label className="modal-label">Role</label>
              <select
                className="modal-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="citizen">Citizen</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="modal-field">
              <label className="modal-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                Active account
              </label>
            </div>

            <div className="modal-actions">
              <button className="modal-save-btn" onClick={handleSave}>Save</button>
              <button className="modal-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}