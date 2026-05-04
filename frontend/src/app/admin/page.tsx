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

  // 🔥 YENİ: USER DELETE
  const deleteUser = async (userId: number) => {
    const confirmDelete = confirm(
      "Bu kullanıcıyı silmek istediğine emin misin?"
    );

    if (!confirmDelete) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`,
      {
        method: "DELETE",
      }
    );

    if (!res.ok) {
      alert("Silme işlemi başarısız");
      return;
    }

    alert("Kullanıcı silindi");
    fetchUsers();
  };

  const filteredUsers = users.filter((user) => {
    const fullText = `${user.name} ${user.surname} ${user.email} ${user.department}`
      .toLowerCase();

    const matchesSearch = fullText.includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (role: string) => {
    if (role === "ADMIN") {
      return "bg-rose-100 text-rose-700 border-rose-200";
    }

    if (role === "MANAGER") {
      return "bg-violet-100 text-violet-700 border-violet-200";
    }

    if (role === "DEVELOPER") {
      return "bg-blue-100 text-blue-700 border-blue-200";
    }

    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  const getInitials = (user: User) => {
    const first = user.name ? user.name.charAt(0).toUpperCase() : "";
    const second = user.surname ? user.surname.charAt(0).toUpperCase() : "";

    return `${first}${second}` || user.email.charAt(0).toUpperCase();
  };

  const totalAdmins = users.filter((user) => user.role === "ADMIN").length;
  const totalManagers = users.filter((user) => user.role === "MANAGER").length;
  const totalDevelopers = users.filter((user) => user.role === "DEVELOPER").length;
  const totalWorkers = users.filter((user) => user.role === "WORKER").length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-100 via-blue-100 to-cyan-100 p-6">
      <div className="pointer-events-none absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-blue-400/25 blur-3xl" />
      <div className="pointer-events-none absolute right-[-140px] top-32 h-[420px] w-[420px] rounded-full bg-cyan-300/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-180px] left-1/3 h-[420px] w-[420px] rounded-full bg-indigo-300/20 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <div className="mb-6 overflow-hidden rounded-[2rem] border border-white/50 bg-white/65 p-6 shadow-2xl shadow-blue-500/10 backdrop-blur-2xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-2 text-xs font-black text-blue-700 shadow-sm">
                🛠 Admin Workspace
              </div>

              <h1 className="text-4xl font-black tracking-tight text-slate-900">
                Admin Panel
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Manage users, update roles, review departments and keep the project
                management system organized from one clean control center.
              </p>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:scale-[1.03] hover:shadow-xl"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-3xl border border-white/50 bg-white/65 p-5 shadow-xl shadow-blue-500/5 backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Total Users
            </p>
            <p className="mt-2 text-3xl font-black text-blue-600">{users.length}</p>
          </div>

          <div className="rounded-3xl border border-white/50 bg-white/65 p-5 shadow-xl shadow-blue-500/5 backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Admins
            </p>
            <p className="mt-2 text-3xl font-black text-rose-500">{totalAdmins}</p>
          </div>

          <div className="rounded-3xl border border-white/50 bg-white/65 p-5 shadow-xl shadow-blue-500/5 backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Managers
            </p>
            <p className="mt-2 text-3xl font-black text-violet-500">{totalManagers}</p>
          </div>

          <div className="rounded-3xl border border-white/50 bg-white/65 p-5 shadow-xl shadow-blue-500/5 backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Developers
            </p>
            <p className="mt-2 text-3xl font-black text-blue-500">{totalDevelopers}</p>
          </div>

          <div className="rounded-3xl border border-white/50 bg-white/65 p-5 shadow-xl shadow-blue-500/5 backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Workers
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-500">{totalWorkers}</p>
          </div>
        </div>

        <div className="mb-6 rounded-[1.75rem] border border-white/50 bg-white/65 p-4 shadow-xl shadow-blue-500/5 backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>

              <input
                className="w-full rounded-2xl border border-blue-100 bg-white/80 px-12 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-200/60"
                placeholder="Search by name, email or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="rounded-2xl border border-blue-100 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-200/60"
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
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">User Management</h2>
            <p className="text-sm text-slate-600">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>

          <div className="rounded-full border border-white/50 bg-white/60 px-4 py-2 text-xs font-bold text-slate-600 shadow-sm backdrop-blur">
            Role updates are applied instantly
          </div>
        </div>

        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="group relative overflow-hidden rounded-[1.75rem] border border-white/50 bg-white/70 p-5 shadow-xl shadow-blue-500/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/15"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-500/0 via-cyan-400/0 to-indigo-400/0 opacity-0 transition group-hover:from-blue-500/10 group-hover:via-cyan-400/10 group-hover:to-indigo-400/10 group-hover:opacity-100" />

              <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-lg font-black text-white shadow-lg shadow-blue-500/25">
                    {getInitials(user)}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-black text-slate-900">
                        {user.name} {user.surname}
                      </p>

                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-black ${getRoleBadgeClass(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </div>

                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {user.email}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 font-bold text-cyan-700">
                        Department: {user.department || "-"}
                      </span>

                      <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 font-bold text-blue-700">
                        User ID: #{user.id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user.id, e.target.value)}
                    className="rounded-2xl border border-blue-100 bg-white/90 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-200/60"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="WORKER">WORKER</option>
                    <option value="DEVELOPER">DEVELOPER</option>
                  </select>

                  <button
                    onClick={() => deleteUser(user.id)}
                    className="rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-500/20 transition hover:scale-[1.03] hover:shadow-xl"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="rounded-[1.75rem] border border-white/50 bg-white/65 p-10 text-center shadow-xl shadow-blue-500/5 backdrop-blur-xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-3xl">
                🧑‍💻
              </div>

              <p className="text-lg font-black text-slate-800">No users found.</p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search text or selected role filter.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
