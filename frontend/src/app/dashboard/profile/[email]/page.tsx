// Target file: frontend/src/app/dashboard/profile/[email]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type UserProfile = {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  department: string;
  birthDate: string;
  extraInfo: string;
  linkedin?: string;
  github?: string;
  profileImage?: string;
};

type ProfileStats = {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  successRate: number;
};

export default function OtherUserProfilePage() {
  const params = useParams();
  const email = decodeURIComponent(params.email as string);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    successRate: 0,
  });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, [email]);

  const fetchProfile = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me/${email}`
    );

    const data = await res.json();

    if (data && data.email) {
      setProfile(data);
    }
  };

  const fetchStats = async () => {
    if (!email) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`);
      const data = await res.json();

      if (!Array.isArray(data)) {
        setStats({
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          successRate: 0,
        });
        return;
      }

      const userTasks = data.filter((task: any) =>
        (task.assignedTo || "")
          .toLowerCase()
          .split(",")
          .map((item: string) => item.trim())
          .includes(email.toLowerCase())
      );

      const total = userTasks.length;
      const completed = userTasks.filter((task: any) => task.status === "DONE").length;
      const pending = total - completed;
      const successRate = total === 0 ? 0 : Math.round((completed / total) * 100);

      setStats({
        totalTasks: total,
        completedTasks: completed,
        pendingTasks: pending,
        successRate,
      });
    } catch {
      setStats({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        successRate: 0,
      });
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-indigo-100 to-cyan-100">
        <p className="font-bold text-slate-600 animate-pulse">
          Loading profile...
        </p>
      </div>
    );
  }

  const initials = `${profile.name?.charAt(0) || ""}${
    profile.surname?.charAt(0) || ""
  }`;

  const mailLink = `mailto:${profile.email}?subject=Hello from Task Dashboard&body=Hi ${profile.name},`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-100 to-cyan-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white/75 backdrop-blur rounded-3xl shadow-2xl shadow-blue-500/15 border border-slate-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl font-black overflow-hidden border-4 border-white shadow-xl shadow-blue-500/10 shadow-blue-500/10">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={`${profile.name} ${profile.surname}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials || "U"
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-black text-slate-900">
                {profile.name} {profile.surname}
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                {profile.role || "-"} • {profile.department || "-"}
              </p>

              <a
                href={mailLink}
                className="text-sm text-indigo-600 hover:underline mt-1 block font-semibold"
              >
                {profile.email}
              </a>

              <div className="flex gap-3 mt-4 flex-wrap">
                <a
                  href={mailLink}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow"
                >
                  ✉ Send Email
                </a>

                {profile.linkedin && (
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-2xl text-sm font-bold border border-blue-100"
                  >
                    LinkedIn
                  </a>
                )}

                {profile.github && (
                  <a
                    href={profile.github}
                    target="_blank"
                    className="bg-white/70 hover:bg-white/60 text-slate-700 px-4 py-2 rounded-2xl text-sm font-bold border border-slate-200"
                  >
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/75 backdrop-blur-xl p-5 rounded-3xl shadow-xl shadow-blue-500/10 shadow-blue-500/10 border-l-8 border-indigo-300">
            <p className="text-sm text-slate-500">Total Tasks</p>
            <p className="text-3xl font-black text-indigo-600">
              {stats.totalTasks}
            </p>
          </div>

          <div className="bg-white/75 backdrop-blur-xl p-5 rounded-3xl shadow-xl shadow-blue-500/10 shadow-blue-500/10 border-l-8 border-emerald-300">
            <p className="text-sm text-slate-500">Completed</p>
            <p className="text-3xl font-black text-emerald-600">
              {stats.completedTasks}
            </p>
          </div>

          <div className="bg-white/75 backdrop-blur-xl p-5 rounded-3xl shadow-xl shadow-blue-500/10 shadow-blue-500/10 border-l-8 border-amber-300">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="text-3xl font-black text-amber-600">
              {stats.pendingTasks}
            </p>
          </div>

          <div className="bg-white/75 backdrop-blur-xl p-5 rounded-3xl shadow-xl shadow-blue-500/10 shadow-blue-500/10 border-l-8 border-blue-300">
            <p className="text-sm text-slate-500">Success Rate</p>
            <p className="text-3xl font-black text-blue-600">
              {stats.successRate}%
            </p>
          </div>
        </div>

        <div className="bg-white/75 backdrop-blur rounded-3xl shadow-xl shadow-blue-500/10 border border-slate-100 p-6">
          <h2 className="font-black text-xl text-slate-900 mb-4">
            Profile Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
              <p className="font-black text-indigo-700">Email</p>
              <a
                href={mailLink}
                className="text-indigo-600 hover:underline mt-1 block font-semibold"
              >
                {profile.email || "-"}
              </a>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="font-black text-blue-700">Role</p>
              <p className="text-slate-600 mt-1">{profile.role || "-"}</p>
            </div>

            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
              <p className="font-black text-teal-700">Department</p>
              <p className="text-slate-600 mt-1">
                {profile.department || "-"}
              </p>
            </div>

            <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
              <p className="font-black text-violet-700">Birth Date</p>
              <p className="text-slate-600 mt-1">
                {profile.birthDate || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/75 backdrop-blur rounded-3xl shadow-xl shadow-blue-500/10 border border-slate-100 p-6">
          <h2 className="font-black text-xl text-slate-900 mb-3">About</h2>

          <p className="text-sm text-slate-600 leading-6 bg-white/70 border border-slate-100 rounded-2xl p-4">
            {profile.extraInfo || "No information added yet."}
          </p>
        </div>
      </div>
    </div>
  );
}