"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineCheck, HiOutlineEye, HiOutlineEyeOff, HiOutlineKey, HiOutlineX } from "react-icons/hi";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { adminPasswordChangeSchema, getStrongPasswordWarning, PASSWORD_MIN_LENGTH } from "@/lib/validation";

const emptyForm = { currentPassword: "", newPassword: "", confirmNewPassword: "" };
const passwordFields = [
  { name: "currentPassword", label: "Current password", entry: "entry-1" },
  { name: "newPassword", label: "New password", entry: "entry-2" },
  { name: "confirmNewPassword", label: "Confirm new password", entry: "entry-3" },
] as const;

export default function ChangeAdminPasswordButton({ adminUsername }: { adminUsername: string }) {
  const router = useRouter();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [visible, setVisible] = useState({ currentPassword: false, newPassword: false, confirmNewPassword: false });
  const [supportsTextMask, setSupportsTextMask] = useState(false);

  useEffect(() => {
    setSupportsTextMask(CSS.supports("-webkit-text-security", "disc"));
  }, []);
  const parsedForm = adminPasswordChangeSchema.safeParse(form);
  const canSubmit = parsedForm.success;
  const newPasswordWarning = getStrongPasswordWarning(form.newPassword) || (
    !parsedForm.success
      ? parsedForm.error.issues.find((issue) => issue.path[0] === "newPassword")?.message || ""
      : ""
  );
  const passwordsMismatch = Boolean(form.confirmNewPassword && form.newPassword !== form.confirmNewPassword);

  const resetFields = () => {
    setForm(emptyForm);
    setVisible({ currentPassword: false, newPassword: false, confirmNewPassword: false });
  };
  const handleClose = useCallback(() => {
    if (loading) return;
    setOpen(false);
    setForm(emptyForm);
    setVisible({ currentPassword: false, newPassword: false, confirmNewPassword: false });
    setError("");
    setSuccess(false);
  }, [loading]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    const parsed = adminPasswordChangeSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json().catch(() => null);
      if (response.status === 401) {
        router.push("/admin/login");
        router.refresh();
        return;
      }
      if (!response.ok) {
        const fieldErrors = data?.details?.fieldErrors;
        setError(
          fieldErrors?.currentPassword?.[0] || fieldErrors?.newPassword?.[0] ||
          fieldErrors?.confirmNewPassword?.[0] || data?.error || "Unable to update your password. Please try again."
        );
        return;
      }
      resetFields();
      setSuccess(true);
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="h-auto min-h-9 whitespace-normal py-1.5" onClick={() => setOpen(true)}>
        <HiOutlineKey className="h-4 w-4 shrink-0" aria-hidden="true" />
        Change password
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        closeDisabled={loading}
        title="Change password"
        footer={success ? (
          <Button onClick={handleClose}>Done</Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
            <Button type="submit" form={formId} disabled={loading || !canSubmit}>
              {loading ? "Updating..." : "Update password"}
            </Button>
          </>
        )}
      >
        {success ? (
          <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-700 dark:bg-green-500/10 dark:text-green-400">
            Your password has been updated. Use your new password the next time you sign in.
          </p>
        ) : (
          <form id={formId} onSubmit={handleSubmit} autoComplete="off" aria-busy={loading} className="space-y-5 text-left">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Update the password for <span className="break-all font-medium text-gray-900 dark:text-white">{adminUsername}</span>.
            </p>
            <p id={`${formId}-manual-entry`} className="text-xs text-gray-500 dark:text-gray-400">
              Type each password manually. Pasting and dropping text are disabled.
            </p>
            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</p>}
            {passwordFields.map((field) => {
              const inputId = `${formId}-${field.entry}`;
              return (
                <div key={field.name}>
                  <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
                  <div className="relative">
                    <Input
                      id={inputId}
                      name={inputId}
                      type={visible[field.name] || supportsTextMask ? "text" : "password"}
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-bwignore="true"
                      data-form-type="other"
                      required
                      disabled={loading}
                      minLength={field.name === "currentPassword" ? undefined : PASSWORD_MIN_LENGTH}
                      maxLength={field.name === "currentPassword" ? 1024 : 72}
                      value={form[field.name]}
                      onPaste={(event) => {
                        event.preventDefault();
                        setError("Please type the password manually. Pasting is disabled.");
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        setError("Please type the password manually. Dropping text is disabled.");
                      }}
                      onChange={(event) => {
                        const inputEvent = event.nativeEvent as InputEvent;
                        const inputType = inputEvent.inputType || "";
                        // Accept typing, IME composition, deletion and undo/redo; reject autofill/replacement events.
                        const manualEdit = inputEvent.isTrusted && (
                          (inputType === "insertText" && inputEvent.data !== null) ||
                          inputType === "insertCompositionText" || inputType === "insertFromComposition" ||
                          inputType.startsWith("delete") || inputType === "historyUndo" || inputType === "historyRedo"
                        );
                        if (!manualEdit) {
                          event.currentTarget.value = form[field.name];
                          setError("Please type the password manually. Saved-password autofill is disabled.");
                          return;
                        }
                        setForm((previous) => ({ ...previous, [field.name]: event.target.value }));
                        setError("");
                      }}
                      aria-describedby={`${formId}-manual-entry${field.name === "newPassword" ? ` ${formId}-requirements` : field.name === "confirmNewPassword" && passwordsMismatch ? ` ${formId}-mismatch` : ""}`}
                      aria-invalid={field.name === "confirmNewPassword" && passwordsMismatch ? true : undefined}
                      className={`pr-12 text-base ${visible[field.name] ? "[-webkit-text-security:none]" : "[-webkit-text-security:disc]"}`}
                    />
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setVisible((previous) => ({ ...previous, [field.name]: !previous[field.name] }))}
                      aria-label={`${visible[field.name] ? "Hide" : "Show"} ${field.label.toLowerCase()}`}
                      aria-pressed={visible[field.name]}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50"
                    >
                      {visible[field.name] ? <HiOutlineEyeOff className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
                    </button>
                  </div>
                  {field.name === "newPassword" && (
                    <p
                      id={`${formId}-requirements`}
                      aria-live="polite"
                      className={`mt-2 flex items-center gap-1 text-xs ${!form.newPassword ? "text-gray-500 dark:text-gray-400" : newPasswordWarning ? "text-red-500" : "text-green-600 dark:text-green-400"}`}
                    >
                      {form.newPassword && (newPasswordWarning ? (
                        <HiOutlineX className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <HiOutlineCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      ))}
                      <span>{newPasswordWarning || "Password meets all requirements."}</span>
                    </p>
                  )}
                  {field.name === "confirmNewPassword" && passwordsMismatch && (
                    <p id={`${formId}-mismatch`} className="mt-2 text-xs text-red-500">New passwords do not match.</p>
                  )}
                </div>
              );
            })}
          </form>
        )}
      </Modal>
    </>
  );
}
