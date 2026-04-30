"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  // LOGIN (AYNI)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // REGISTER (GENİŞLETİLDİ)
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [department, setDepartment] = useState("");

  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regMessage, setRegMessage] = useState("");

  const router = useRouter();

  // LOGIN (AYNI)
  const login = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        "http://localhost:5001/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        router.push("/dashboard");
      } else {
        setError("Token alınamadı");
      }
    } catch (err: any) {
      setError(err.message || "Login başarısız");
    } finally {
      setLoading(false);
    }
  };

  // REGISTER (GENİŞLETİLDİ)
  const register = async () => {
    setRegMessage("");

    try {
      const res = await fetch(
        "http://localhost:5001/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            surname,
            birthDate,
            department,
            email: regEmail,
            password: regPassword,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      setRegMessage("Üye oldun! Şimdi giriş yapabilirsin ✅");

      // form temizleme
      setName("");
      setSurname("");
      setBirthDate("");
      setDepartment("");
      setRegEmail("");
      setRegPassword("");

    } catch (err: any) {
      setRegMessage(err.message || "Register hatası");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100 gap-10">

      {/* REGISTER */}
      <div className="bg-white p-6 rounded shadow w-80 overflow-y-auto max-h-[90vh]">
        <h1 className="text-xl font-bold mb-4">
          Üye Ol
        </h1>

        {regMessage && (
          <p className="text-sm mb-2 text-green-600">
            {regMessage}
          </p>
        )}

        <input
          className="border w-full p-2 mb-2"
          placeholder="Ad"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="border w-full p-2 mb-2"
          placeholder="Soyad"
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
        />

        <input
          type="date"
          className="border w-full p-2 mb-2"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />

        <input
          className="border w-full p-2 mb-2"
          placeholder="Departman"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />

        <input
          className="border w-full p-2 mb-2"
          placeholder="Email"
          value={regEmail}
          onChange={(e) => setRegEmail(e.target.value)}
        />

        <input
          type="password"
          className="border w-full p-2 mb-4"
          placeholder="Password"
          value={regPassword}
          onChange={(e) => setRegPassword(e.target.value)}
        />

        <button
          onClick={register}
          className="w-full p-2 text-white rounded bg-green-500 hover:bg-green-600"
        >
          Üye Ol
        </button>
      </div>

      {/* LOGIN (DOKUNMADIK) */}
      <div className="bg-white p-6 rounded shadow w-80">

        <h1 className="text-xl font-bold mb-4">
          Login
        </h1>

        {error && (
          <p className="text-red-500 text-sm mb-2">
            {error}
          </p>
        )}

        <input
          className="border w-full p-2 mb-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="border w-full p-2 mb-4"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          disabled={loading}
          className={`w-full p-2 text-white rounded ${
            loading
              ? "bg-gray-400"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}