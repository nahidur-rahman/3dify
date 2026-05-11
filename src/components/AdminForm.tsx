"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineX,
} from "react-icons/hi";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  getStrongPasswordWarning,
  isStrongPassword,
  STRONG_PASSWORD_MESSAGE,
} from "@/lib/validation";

export default function AdminForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const passwordWarning =
    form.password.length > 0 ? getStrongPasswordWarning(form.password) : "";
  const showPasswordMatchFeedback = form.confirmPassword.length > 0;
  const passwordsMatch = form.password === form.confirmPassword;
  const canCreateAdmin = Boolean(
    form.username.trim() &&
    form.name.trim() &&
      form.email.trim() &&
      form.password &&
      form.confirmPassword &&
      isStrongPassword(form.password) &&
      passwordsMatch
  );

  const handleChange =
    (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isStrongPassword(form.password)) {
      setError(STRONG_PASSWORD_MESSAGE);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.push("/admin/login");
        router.refresh();
        return;
      }

      if (!res.ok) {
        const backendError =
          data?.details?.fieldErrors?.password?.[0] ||
          data?.details?.fieldErrors?.confirmPassword?.[0] ||
          data?.details?.fieldErrors?.username?.[0] ||
          data?.details?.fieldErrors?.name?.[0] ||
          data?.details?.fieldErrors?.email?.[0];

        setError(backendError || data.error || "Failed to create admin");
        return;
      }

      setSuccess(`Admin ${data.admin.username} created successfully.`);
      setForm({
        username: "",
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setShowPassword(false);
      setShowConfirmPassword(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Admin</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-3 rounded-xl text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Username
            </label>
            <Input
              name="admin-username"
              type="text"
              value={form.username}
              onChange={handleChange("username")}
              required
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="unique-username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Name
            </label>
            <Input
              name="admin-name"
              type="text"
              value={form.name}
              onChange={handleChange("name")}
              required
              autoComplete="off"
              placeholder="Display name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email
            </label>
            <Input
              name="admin-contact"
              type="text"
              value={form.email}
              onChange={handleChange("email")}
              required
              autoComplete="off"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
              placeholder="new-admin@3difybd.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Input
                name="admin-secret"
                type="text"
                value={form.password}
                onChange={handleChange("password")}
                required
                minLength={8}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
                placeholder="At least 8 characters"
                className={`pr-12 ${
                  showPassword ? "[-webkit-text-security:none]" : "[-webkit-text-security:disc]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <HiOutlineEyeOff className="h-5 w-5" />
                ) : (
                  <HiOutlineEye className="h-5 w-5" />
                )}
              </button>
            </div>
            {passwordWarning && (
              <p className="mt-2 flex items-center gap-1 text-[11px] leading-4 text-red-500">
                <HiOutlineX className="h-3.5 w-3.5 shrink-0" />
                <span>{passwordWarning}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                name="admin-secret-confirm"
                type="text"
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                required
                minLength={8}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
                placeholder="Re-enter the password"
                className={`pr-12 ${
                  showConfirmPassword
                    ? "[-webkit-text-security:none]"
                    : "[-webkit-text-security:disc]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                aria-pressed={showConfirmPassword}
              >
                {showConfirmPassword ? (
                  <HiOutlineEyeOff className="h-5 w-5" />
                ) : (
                  <HiOutlineEye className="h-5 w-5" />
                )}
              </button>
            </div>
            {showPasswordMatchFeedback && !passwordsMatch && (
              <p
                className="mt-2 flex items-center gap-1 text-[11px] leading-4 text-red-500"
              >
                <HiOutlineX className="h-3.5 w-3.5 shrink-0" />
                <span>Passwords do not match</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button
              type="submit"
              disabled={loading || !canCreateAdmin}
              className="flex-1"
            >
              {loading ? "Creating..." : "Create Admin"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}