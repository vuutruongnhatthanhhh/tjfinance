"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Mail, Save, User2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ModalOverlay from "@/components/ui/ModalOverlay";

interface AccountSettingsModalProps {
  userEmail?: string;
  userName?: string;
  onClose: () => void;
  onSaved: () => void;
  showToast: (message: string, type?: "success" | "error") => void;
}

const FULL_NAME_MAX_LENGTH = 20;
const PASSWORD_MAX_LENGTH = 128;

export default function AccountSettingsModal({
  userEmail,
  userName,
  onClose,
  onSaved,
  showToast,
}: AccountSettingsModalProps) {
  const supabase = useMemo(() => createClient(), []);
  const [fullName, setFullName] = useState(userName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setProfileError("Vui lòng nhập họ và tên.");
      return;
    }

    if (trimmedName.length > FULL_NAME_MAX_LENGTH) {
      setProfileError(
        `Họ và tên không được vượt quá ${FULL_NAME_MAX_LENGTH} ký tự.`,
      );
      return;
    }

    setProfileLoading(true);
    setProfileError("");

    const { error } = await supabase.auth.updateUser({
      data: { full_name: trimmedName },
    });

    setProfileLoading(false);

    if (error) {
      setProfileError("Không thể cập nhật thông tin. Vui lòng thử lại.");
      return;
    }

    showToast("Cập nhật thông tin thành công");
    onSaved();
  };

  const handlePasswordSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!userEmail) {
      setPasswordError("Không tìm thấy email tài khoản.");
      return;
    }

    if (!currentPassword) {
      setPasswordError("Vui lòng nhập mật khẩu cũ.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Xác nhận mật khẩu không khớp.");
      return;
    }

    setPasswordLoading(true);
    setPasswordError("");

    const signInResult = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });

    if (signInResult.error) {
      setPasswordLoading(false);
      setPasswordError("Mật khẩu cũ không đúng.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setPasswordLoading(false);

    if (error) {
      setPasswordError("Không thể đổi mật khẩu. Vui lòng thử lại.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showToast("Đổi mật khẩu thành công");
  };

  return (
    <ModalOverlay
      onClose={onClose}
      panelClassName="w-full sm:max-w-lg max-h-[90dvh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
      panelStyle={{
        background: "rgba(8,20,12,0.97)",
        border: "1px solid rgba(45,154,75,0.18)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
      }}
    >
      <div
        className="flex items-center justify-between border-b px-6 py-5"
        style={{ borderColor: "rgba(45,154,75,0.12)" }}
      >
        <div>
          <p className="text-lg font-semibold text-white">Tài khoản</p>
          <p
            className="mt-1 text-sm"
            style={{ color: "rgba(226,255,232,0.42)" }}
          >
            Cập nhật tên hiển thị và đổi mật khẩu.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors"
          style={{
            background: "rgba(255,255,255,0.05)",
            color: "rgba(226,255,232,0.55)",
          }}
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-6 custom-scrollbar">
        <form
          onSubmit={handleProfileSave}
          className="space-y-4 rounded-2xl border p-4"
          style={{
            borderColor: "rgba(45,154,75,0.14)",
            background: "rgba(10,20,13,0.5)",
          }}
        >
          <div className="flex items-center gap-2">
            <User2 className="h-4 w-4 text-[#4ade80]" />
            <p className="text-sm font-semibold text-white">
              Thông tin cá nhân
            </p>
          </div>

          {profileError && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#fca5a5",
              }}
            >
              {profileError}
            </div>
          )}

          <div>
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-wide"
              style={{ color: "rgba(226,255,232,0.5)" }}
            >
              Họ và tên
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);
                if (profileError) setProfileError("");
              }}
              maxLength={FULL_NAME_MAX_LENGTH}
              placeholder="Nguyễn Văn A"
              className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
              style={{
                borderColor: "rgba(45,154,75,0.2)",
                background: "rgba(5,13,8,0.8)",
              }}
            />
          </div>

          <div>
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-wide"
              style={{ color: "rgba(226,255,232,0.5)" }}
            >
              Email
            </label>
            <div
              className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm"
              style={{
                borderColor: "rgba(45,154,75,0.12)",
                background: "rgba(255,255,255,0.03)",
                color: "rgba(226,255,232,0.72)",
              }}
            >
              <Mail className="h-4 w-4 text-[#4ade80]" />
              <span className="truncate">{userEmail || "Chưa có email"}</span>
            </div>
          </div>

          <div
            className="flex items-center justify-between text-xs"
            style={{ color: "rgba(226,255,232,0.36)" }}
          >
            <span>Tối đa {FULL_NAME_MAX_LENGTH} ký tự</span>
            <span>
              {fullName.trim().length}/{FULL_NAME_MAX_LENGTH}
            </span>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileLoading}
              className="btn-primary inline-flex items-center gap-2"
            >
              {profileLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lưu thông tin
            </button>
          </div>
        </form>

        <form
          onSubmit={handlePasswordSave}
          className="space-y-4 rounded-2xl border p-4"
          style={{
            borderColor: "rgba(45,154,75,0.14)",
            background: "rgba(10,20,13,0.5)",
          }}
        >
          <div className="flex items-center gap-2">
            <Save className="h-4 w-4 text-[#4ade80]" />
            <p className="text-sm font-semibold text-white">Đổi mật khẩu</p>
          </div>

          <p className="text-sm" style={{ color: "rgba(226,255,232,0.42)" }}>
            Nhập mật khẩu cũ để xác nhận trước khi đổi sang mật khẩu mới.
          </p>

          {passwordError && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#fca5a5",
              }}
            >
              {passwordError}
            </div>
          )}

          <div>
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-wide"
              style={{ color: "rgba(226,255,232,0.5)" }}
            >
              Mật khẩu cũ
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(event.target.value);
                  if (passwordError) setPasswordError("");
                }}
                maxLength={PASSWORD_MAX_LENGTH}
                placeholder="Nhập mật khẩu cũ"
                className="w-full rounded-xl border px-4 py-3 pr-12 text-sm text-white outline-none"
                style={{
                  borderColor: "rgba(45,154,75,0.2)",
                  background: "rgba(5,13,8,0.8)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: "rgba(226,255,232,0.4)" }}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-wide"
              style={{ color: "rgba(226,255,232,0.5)" }}
            >
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  if (passwordError) setPasswordError("");
                }}
                maxLength={PASSWORD_MAX_LENGTH}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full rounded-xl border px-4 py-3 pr-12 text-sm text-white outline-none"
                style={{
                  borderColor: "rgba(45,154,75,0.2)",
                  background: "rgba(5,13,8,0.8)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: "rgba(226,255,232,0.4)" }}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-wide"
              style={{ color: "rgba(226,255,232,0.5)" }}
            >
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  if (passwordError) setPasswordError("");
                }}
                maxLength={PASSWORD_MAX_LENGTH}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full rounded-xl border px-4 py-3 pr-12 text-sm text-white outline-none"
                style={{
                  borderColor: "rgba(45,154,75,0.2)",
                  background: "rgba(5,13,8,0.8)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: "rgba(226,255,232,0.4)" }}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordLoading}
              className="btn-primary inline-flex items-center gap-2"
            >
              {passwordLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lưu mật khẩu mới
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}
