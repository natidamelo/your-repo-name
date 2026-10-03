import React, { useState, useEffect } from 'react';
import { 
  Users, KeyRound, Lock, Shield, UserPlus, Trash2, 
  CheckCircle2, AlertTriangle, X, ShieldAlert, Check, RefreshCw
} from 'lucide-react';
import { 
  getUsersApi, adminResetPasswordApi, adminUpdateUserApi, 
  adminDeleteUserApi, registerUserApi 
} from '../../api/client';
import { User, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const UserManagementSection: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Password reset modal state
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // New user modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newUserUsername, setNewUserUsername] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserPassword, setNewUserPassword] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('staff');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getUsersApi();
      setUsers(data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load users' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    if (newPassword.length < 4) {
      showNotification('error', 'Password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('error', 'Passwords do not match.');
      return;
    }

    setIsResetting(true);
    try {
      await adminResetPasswordApi(resetTargetUser.id, newPassword);
      showNotification('success', `Password for user "${resetTargetUser.username}" changed successfully.`);
      setResetTargetUser(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update password');
    } finally {
      setIsResetting(false);
    }
  };

  const handleRoleChange = async (targetUser: User, newRole: UserRole) => {
    try {
      await adminUpdateUserApi(targetUser.id, { role: newRole });
      showNotification('success', `Updated ${targetUser.username}'s role to ${newRole}.`);
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update role');
    }
  };

  const handleToggleActive = async (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      showNotification('error', 'You cannot deactivate your own admin account.');
      return;
    }
    const newStatus = !targetUser.is_active;
    try {
      await adminUpdateUserApi(targetUser.id, { is_active: newStatus });
      showNotification('success', `User "${targetUser.username}" is now ${newStatus ? 'Active' : 'Inactive'}.`);
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, is_active: newStatus } : u));
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to change user status');
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      showNotification('error', 'You cannot delete your own admin account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete user "${targetUser.username}"?`)) {
      return;
    }
    try {
      await adminDeleteUserApi(targetUser.id);
      showNotification('success', `User "${targetUser.username}" has been removed.`);
      setUsers(prev => prev.filter(u => u.id !== targetUser.id));
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete user');
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserUsername.trim() || !newUserEmail.trim() || !newUserPassword) {
      showNotification('error', 'Please fill in all required fields.');
      return;
    }
    if (newUserPassword.length < 4) {
      showNotification('error', 'Password must be at least 4 characters long.');
      return;
    }

    setIsCreating(true);
    try {
      await registerUserApi({
        username: newUserUsername.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        role: newUserRole
      });
      showNotification('success', `Created new ${newUserRole} account "${newUserUsername.trim()}".`);
      setShowAddModal(false);
      setNewUserUsername('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('staff');
      fetchUsers();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create user account');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="p-5 rounded-xl bg-card border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">Staff & Manager User Accounts</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Admin control: manage credentials, change staff/manager passwords, assign roles & access permissions
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={isLoading}
            className="h-8 px-2.5 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground border border-border text-xs font-medium flex items-center space-x-1.5 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium flex items-center space-x-1.5 shadow-sm transition active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {feedback && (
        <div className={`p-3.5 rounded-lg text-xs font-semibold flex items-center space-x-2 ${
          feedback.type === 'success' 
            ? 'bg-emerald-100 border border-emerald-300 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' 
            : 'bg-destructive/15 border border-destructive/30 text-destructive-foreground'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Users Table / List */}
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center text-muted-foreground text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mr-2 text-primary" />
            Loading accounts...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No user accounts found.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map(u => {
              const isSelf = u.id === currentUser?.id;
              const roleBadgeColor = 
                u.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-400 border-purple-300 dark:border-purple-500/20' 
                  : u.role === 'manager'
                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-500/10 dark:text-sky-400 border-sky-300 dark:border-sky-500/20'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/20';

              return (
                <div key={u.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/15 transition">
                  {/* User Profile */}
                  <div className="flex items-center space-x-3 min-w-[200px]">
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                      {u.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-foreground">{u.username}</span>
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">You</span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">{u.email}</span>
                    </div>
                  </div>

                  {/* Role Selector & Status */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center space-x-1.5">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                        disabled={isSelf}
                        className={`h-7 px-2 text-[11px] font-semibold rounded-md border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring ${roleBadgeColor}`}
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="staff">Staff</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(u)}
                      disabled={isSelf}
                      className={`h-7 px-2.5 rounded-md text-[11px] font-medium border transition ${
                        u.is_active 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  {/* Actions: Change Password & Delete */}
                  <div className="flex items-center space-x-2 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
                    <button
                      type="button"
                      onClick={() => {
                        setResetTargetUser(u);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="h-8 px-3 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground border border-border text-xs font-medium flex items-center space-x-1.5 transition"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                      <span>Change Password</span>
                    </button>

                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u)}
                        className="h-8 px-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 text-xs transition"
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Change User Password</h4>
                  <p className="text-[11px] text-muted-foreground">Account: <span className="font-semibold text-foreground">{resetTargetUser.username}</span> ({resetTargetUser.role})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetTargetUser(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordResetSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Enter new password (min 4 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 h-8 rounded-lg bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 h-8 rounded-lg bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring transition"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="h-8 px-3 rounded-lg border border-border text-foreground hover:bg-accent text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
                >
                  {isResetting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Create User Account</h4>
                  <p className="text-[11px] text-muted-foreground">Register new manager, staff, or admin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. hebron or beti"
                  value={newUserUsername}
                  onChange={(e) => setNewUserUsername(e.target.value)}
                  className="w-full px-3 h-8 rounded-lg bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@callcenter.local"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 h-8 rounded-lg bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 4 characters"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 h-8 rounded-lg bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-2.5 h-8 rounded-lg bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring transition"
                >
                  <option value="staff">Staff (View Schedules & Shifts)</option>
                  <option value="manager">Manager (Manage Schedules, Shifts & Reports)</option>
                  <option value="admin">Admin (Full Control + User & System Settings)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-8 px-3 rounded-lg border border-border text-foreground hover:bg-accent text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
                >
                  {isCreating ? (
                    <span>Creating...</span>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
