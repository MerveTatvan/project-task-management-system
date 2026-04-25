"use client";
import { useState } from "react";

export default function TestPage() {
  const [message, setMessage] = useState("");

  const handleRegister = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Merve",
          email: "merve@test.com",
          password: "1234",
        }),
      });

      const data = await res.text();
      setMessage(data);
    } catch (err) {
      console.error(err);
      setMessage("Hata oluştu");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Register Test</h1>

      <button onClick={handleRegister}>
        Kullanıcı Kaydet
      </button>

      <p>{message}</p>
    </div>
  );
}