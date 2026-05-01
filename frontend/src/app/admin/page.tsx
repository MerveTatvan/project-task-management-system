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
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

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

  const filteredUsers = users.filter((user) => {
    const fullText = `${user.name} ${user.surname} ${user.email} ${user.department}`
      .toLowerCase();

    const matchesSearch = fullText.includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

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

      <div className="bg-white border rounded-xl p-4 mb-6 flex gap-3">
        <input
          className="border p-2 rounded flex-1"
          placeholder="Search by name, email or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border p-2 rounded"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="MANAGER">MANAGER</option>
          <option value="WORKER">WORKER</option>
          <option value="DEVELOPER">DEVELOPER</option>
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-3">
        Showing {filteredUsers.length} of {users.length} users
      </p>

      <div className="space-y-3">
        {filteredUsers.map((user) => (
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
              <p className="text-sm text-gray-500">
                Current Role: {user.role}
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

        {filteredUsers.length === 0 && (
          <p className="text-gray-500 bg-white border rounded-xl p-4">
            No users found.
          </p>
        )}
      </div>
    </div>
  );
}