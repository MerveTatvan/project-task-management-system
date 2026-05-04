"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "code" | "reset">("email");
  const [resetCode, setResetCode] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [department, setDepartment] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const router = useRouter();

  const passwordRules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password),
    noName:
      password.length === 0 ||
      ((!name || !password.toLowerCase().includes(name.toLowerCase())) &&
        (!surname || !password.toLowerCase().includes(surname.toLowerCase()))),
  };

  const isPasswordValid =
    passwordRules.length &&
    passwordRules.upper &&
    passwordRules.lower &&
    passwordRules.number &&
    passwordRules.special &&
    passwordRules.noName;

  const passwordsMatch = password === confirmPassword;

  const login = async () => {
    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    if (!email.trim() || !password.trim()) {
      setMessage("Please enter email and password");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("email", data.email);
        router.push("/dashboard");
      } else {
        setMessage("Login failed");
      }
    } catch {
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    if (
      !name.trim() ||
      !surname.trim() ||
      !birthDate.trim() ||
      !department.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setMessage("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!isPasswordValid) {
      setMessage("Password does not meet the requirements");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          surname,
          birthDate,
          department,
          email,
          password,
        }),
      });

      const text = await res.text();

      if (!res.ok || text.includes("zaten")) {
        setMessage(text || "Register failed");
        return;
      }

      setMessage(text || "Registered successfully. You can login now.");
      setIsSuccess(true);
      setIsRegister(false);

      setName("");
      setSurname("");
      setBirthDate("");
      setDepartment("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setMessage("Register error");
    } finally {
      setLoading(false);
    }
  };


  const sendResetCode = async () => {
    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    if (!email.trim()) {
      setMessage("Please enter your email address");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password?email=${encodeURIComponent(
          email
        )}`,
        {
          method: "POST",
        }
      );

      const text = await res.text();

      if (!res.ok || text.includes("bulunamadı")) {
        setMessage(text || "Code could not be sent");
        return;
      }

      setForgotStep("code");
      setMessage(text || "Verification code sent to your email.");
      setIsSuccess(true);
    } catch {
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  };

  const verifyResetCode = async () => {
    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    if (!email.trim() || !resetCode.trim()) {
      setMessage("Please enter email and verification code");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-reset-code?email=${encodeURIComponent(
          email
        )}&code=${encodeURIComponent(resetCode)}`,
        {
          method: "POST",
        }
      );

      const text = await res.text();

      if (!res.ok || text.includes("yanlış") || text.includes("doldu") || text.includes("bulunamadı")) {
        setMessage(text || "Code verification failed");
        return;
      }

      setForgotStep("reset");
      setPassword("");
      setConfirmPassword("");
      setMessage(text || "Code verified. Please set a new password.");
      setIsSuccess(true);
    } catch {
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    if (!email.trim() || !resetCode.trim() || !password.trim() || !confirmPassword.trim()) {
      setMessage("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!isPasswordValid) {
      setMessage("Password does not meet the requirements");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password?email=${encodeURIComponent(
          email
        )}&code=${encodeURIComponent(resetCode)}&newPassword=${encodeURIComponent(
          password
        )}`,
        {
          method: "POST",
        }
      );

      const text = await res.text();

      if (!res.ok || text.includes("uymuyor") || text.includes("yanlış") || text.includes("doldu")) {
        setMessage(text || "Password could not be updated");
        return;
      }

      setIsForgotPassword(false);
      setForgotStep("email");
      setResetCode("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setMessage(text || "Password updated successfully. You can login now.");
      setIsSuccess(true);
    } catch {
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    setIsForgotPassword(false);
    setForgotStep("email");
    setResetCode("");
    setPassword("");
    setConfirmPassword("");
    setMessage("");
    setIsSuccess(false);
  };

  const Rule = ({ ok, text }: { ok: boolean; text: string }) => (
    <p className={`text-xs ${ok ? "text-emerald-600" : "text-red-500"}`}>
      {ok ? "✓" : "•"} {text}
    </p>
  );

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/95 to-blue-950/95" />

      <div className="absolute left-10 top-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-blue-600/80 to-cyan-500/60 p-10 text-white lg:flex">
          <div>
            <div className="mb-8 inline-flex rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur">
              Project & Task Management System
            </div>

            <h2 className="text-4xl font-bold leading-tight">
              Manage projects, assign tasks and track progress beautifully.
            </h2>

            <p className="mt-5 text-sm leading-6 text-blue-50">
              A modern dashboard experience for teams, managers and developers.
              Organize tasks, collaborate faster and keep every workflow under
              control.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-xs text-blue-50">Tracking</p>
            </div>

            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <p className="text-2xl font-bold">Team</p>
              <p className="text-xs text-blue-50">Based</p>
            </div>

            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <p className="text-2xl font-bold">Smart</p>
              <p className="text-xs text-blue-50">Workflow</p>
            </div>
          </div>
        </div>

        <div className="bg-white/95 p-6 sm:p-8 lg:p-10">
          <div className="mb-7 text-center">
            <h1 className="text-3xl font-bold text-slate-900">
              {isForgotPassword
                ? "Reset Password"
                : isRegister
                ? "Create Account"
                : "Welcome Back"}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {isForgotPassword
                ? "Enter your email, verify the code and create a new secure password."
                : isRegister
                ? "Create your team account to start managing tasks."
                : "Login to continue to your dashboard."}
            </p>
          </div>

          {message && (
            <p
              className={`mb-4 rounded-xl px-4 py-3 text-center text-sm font-medium ${
                isSuccess
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {message}
            </p>
          )}

          <div className="space-y-4">
            {isRegister && !isForgotPassword && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    placeholder="First Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    placeholder="Last Name"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Birth Date / Doğum Tarihi
                  </label>

                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>

                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">Select Department / Team</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Database">Database</option>
                  <option value="QA">QA</option>
                  <option value="DevOps">DevOps</option>
                  <option value="UI/UX">UI/UX</option>
                  <option value="IT">IT</option>
                  <option value="ARGE">ARGE</option>
                </select>
              </>
            )}

            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {(!isForgotPassword || forgotStep === "reset") && (
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder={isForgotPassword ? "New Password" : "Password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            )}

            {isForgotPassword && forgotStep === "code" && (
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="Verification Code"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
              />
            )}

            {isRegister && !isForgotPassword && (
              <>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                {confirmPassword && (
                  <p
                    className={`rounded-xl px-3 py-2 text-sm font-medium ${
                      passwordsMatch
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {passwordsMatch
                      ? "Passwords match ✔"
                      : "Passwords do not match ❌"}
                  </p>
                )}

                <div className="space-y-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <Rule ok={passwordRules.length} text="At least 8 characters" />
                  <Rule ok={passwordRules.upper} text="Contains uppercase letter" />
                  <Rule ok={passwordRules.lower} text="Contains lowercase letter" />
                  <Rule ok={passwordRules.number} text="Contains number" />
                  <Rule
                    ok={passwordRules.special}
                    text="Contains special character (!@#$%^&*)"
                  />
                  <Rule
                    ok={passwordRules.noName}
                    text="Must not include your first or last name"
                  />
                </div>
              </>
            )}

            <button
              onClick={
                isForgotPassword
                  ? forgotStep === "email"
                    ? sendResetCode
                    : forgotStep === "code"
                    ? verifyResetCode
                    : resetPassword
                  : isRegister
                  ? register
                  : login
              }
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : isForgotPassword
                ? forgotStep === "email"
                  ? "Send Verification Code"
                  : forgotStep === "code"
                  ? "Verify Code"
                  : "Update Password"
                : isRegister
                ? "Sign Up"
                : "Login"}
            </button>

            {!isRegister && !isForgotPassword && (
              <p className="text-center text-sm text-slate-600">
                Forgot your password?{" "}
                <span
                  onClick={() => {
                    setIsForgotPassword(true);
                    setForgotStep("email");
                    setMessage("");
                    setPassword("");
                    setConfirmPassword("");
                    setResetCode("");
                  }}
                  className="cursor-pointer font-semibold text-blue-600 hover:text-blue-700"
                >
                  Reset password
                </span>
              </p>
            )}

            {isForgotPassword && (
              <p className="text-center text-sm text-slate-600">
                Remember your password?{" "}
                <span
                  onClick={backToLogin}
                  className="cursor-pointer font-semibold text-blue-600 hover:text-blue-700"
                >
                  Back to login
                </span>
              </p>
            )}

            {!isForgotPassword && (
              <p className="text-center text-sm text-slate-600">
                {isRegister ? "Already have an account?" : "Not a member?"}{" "}
                <span
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setMessage("");
                    setConfirmPassword("");
                  }}
                  className="cursor-pointer font-semibold text-blue-600 hover:text-blue-700"
                >
                  {isRegister ? "Login" : "Sign up"}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}