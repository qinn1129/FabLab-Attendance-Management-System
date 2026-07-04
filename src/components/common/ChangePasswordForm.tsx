import React, { useState } from "react";
import { accountsService } from "../../services/accountsService";
import { Input } from "./Input";

/**
 * Self-service password change form. Used on both the Admin and RM profile
 * screens. Requires the current password to be re-entered server-side.
 */
export function ChangePasswordForm({ accountId }: { accountId: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    const result = await accountsService.changePassword(accountId, currentPassword, newPassword);
    setSaving(false);

    if (!result.success) {
      setError(result.error || "Failed to change password.");
      return;
    }
    setSuccess("Password updated successfully.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="border-t border-border pt-5 mt-5">
      <h4 className="text-sm font-semibold text-foreground mb-3">Change Password</h4>
      <div className="space-y-3 max-w-sm">
        <Input label="Current Password" type="password" value={currentPassword} onChange={setCurrentPassword} placeholder="••••••••" required />
        <Input label="New Password" type="password" value={newPassword} onChange={setNewPassword} placeholder="At least 8 characters" required />
        <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" required />
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {success && <p className="text-emerald-600 text-sm mt-2">{success}</p>}
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="mt-4 bg-muted hover:bg-muted/80 disabled:opacity-40 text-foreground font-semibold px-5 py-2 rounded-xl transition text-sm border border-border"
      >
        {saving ? "Updating..." : "Update Password"}
      </button>
    </div>
  );
}