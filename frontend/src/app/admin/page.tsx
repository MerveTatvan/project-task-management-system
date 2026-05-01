"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  department: string;
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`);
    const data = await res.json();
    setUsers(data);
  };

  const updateRole = async (userId: number, newRole: string) => {
    const adminEmail = localStorage.getItem("email");

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/role?adminEmail=${adminEmail}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRole),
      }
    );

    fetchUsers();
    alert("Role updated");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>

        <button
          onClick={() => router.push("/dashboard")}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white border rounded-xl p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">
                {user.name} {user.surname}
              </p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-sm text-gray-500">
                Department: {user.department || "-"}
              </p>
            </div>

            <select
              value={user.role}
              onChange={(e) => updateRole(user.id, e.target.value)}
              className="border p-2 rounded"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="WORKER">WORKER</option>
              <option value="DEVELOPER">DEVELOPER</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
