"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow text-center space-y-4">
        <h1 className="text-3xl font-bold">
          Project and Task Management System
        </h1>

        <p className="text-gray-500">
          Login to manage your projects and tasks.
        </p>

        <button
          onClick={() => router.push("/login")}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Login / Sign Up
        </button>
      </div>
    </div>
  );
}
