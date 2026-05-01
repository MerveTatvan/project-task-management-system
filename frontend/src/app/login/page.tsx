"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
      !password.trim()
    ) {
      setMessage("Please fill in all fields");
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
    } catch {
      setMessage("Register error");
    } finally {
      setLoading(false);
    }
  };

  const Rule = ({ ok, text }: { ok: boolean; text: string }) => (
    <p className={`text-xs ${ok ? "text-green-600" : "text-red-500"}`}>
      • {text}
    </p>
  );

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow w-80 space-y-4">
        <h1 className="text-xl font-bold text-center">
          {isRegister ? "Create Account" : "Login"}
        </h1>

        {message && (
          <p className={`text-sm text-center ${isSuccess ? "text-green-600" : "text-red-500"}`}>
            {message}
          </p>
        )}

        {isRegister && (
          <>
            <input className="border w-full p-2" placeholder="First Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="border w-full p-2" placeholder="Last Name" value={surname} onChange={(e) => setSurname(e.target.value)} />
            <input type="date" className="border w-full p-2" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            <input className="border w-full p-2" placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </>
        )}

        <input className="border w-full p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <input type="password" className="border w-full p-2" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

        {isRegister && (
          <div className="space-y-1">
            <Rule ok={passwordRules.length} text="At least 8 characters" />
            <Rule ok={passwordRules.upper} text="Contains uppercase letter" />
            <Rule ok={passwordRules.lower} text="Contains lowercase letter" />
            <Rule ok={passwordRules.number} text="Contains number" />
            <Rule ok={passwordRules.special} text="Contains special character (!@#$%^&*)" />
            <Rule ok={passwordRules.noName} text="Must not include your first or last name" />
          </div>
        )}

        <button
          onClick={isRegister ? register : login}
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          {loading ? "Please wait..." : isRegister ? "Sign Up" : "Login"}
        </button>

        <p className="text-center text-sm">
          {isRegister ? "Already have an account?" : "Not a member?"}{" "}
          <span
            onClick={() => {
              setIsRegister(!isRegister);
              setMessage("");
            }}
            className="text-blue-500 cursor-pointer"
          >
            {isRegister ? "Login" : "Sign up"}
          </span>
        </p>
      </div>
    </div>
  );
}