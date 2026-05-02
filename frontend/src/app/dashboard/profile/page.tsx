"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type UserProfile = {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  department: string;
  birthDate: string;
  extraInfo: string;

  /* NEW: SOCIAL LINKS */
  linkedin?: string;
  github?: string;
};

/* =========================
   NEW: PROFILE STATS
========================= */
type ProfileStats = {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  successRate: number;
};

/* =========================
   NEW: ACTIVITY TYPE
========================= */
type Activity = {
  id: number;
  text: string;
  date: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [stats] = useState<ProfileStats>({
    totalTasks: 12,
    completedTasks: 7,
    pendingTasks: 5,
    successRate: 58,
  });

  const [activities] = useState<Activity[]>([
    { id: 1, text: "Task 'Login fix' completed", date: "Today" },
    { id: 2, text: "Task 'Dashboard UI' created", date: "Yesterday" },
    { id: 3, text: "You moved task to In Progress", date: "2 days ago" },
  ]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const email = localStorage.getItem("email");
    if (!email) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me/${email}`
    );
    const data = await res.json();

    if (data && data.email) {
      setProfile(data);
    }
  };

  const updateAbout = async () => {
    if (!profile) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users/update/${profile.email}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      }
    );

    if (!res.ok) {
      toast.error("Update failed");
      return;
    }

    toast.success("Profile updated");
  };

  if (!profile) {
    return <p className="p-6">Loading profile...</p>;
  }

  /* =========================
     NEW: OWN PROFILE CHECK
  ========================= */
  const isOwnProfile =
    typeof window !== "undefined" &&
    localStorage.getItem("email") === profile.email;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg">

      {/* ================= PROFILE CARD ================= */}
      <div className="flex items-center gap-4 p-5 bg-blue-50 rounded-xl mb-6">

        <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-xl font-bold">
          {profile.name?.charAt(0)}{profile.surname?.charAt(0)}
        </div>

        <div>
          <h2 className="text-2xl font-bold">
            {profile.name} {profile.surname}
          </h2>
          <p className="text-gray-600">
            {profile.role} • {profile.department}
          </p>
        </div>
      </div>

      {/* ================= SOCIAL LINKS EDIT ================= */}
      <div className="mb-6 space-y-2">
        <input
          className="border p-2 w-full"
          placeholder="LinkedIn URL"
          value={profile.linkedin || ""}
          disabled={!isOwnProfile}
          onChange={(e) =>
            setProfile({ ...profile, linkedin: e.target.value })
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="GitHub URL"
          value={profile.github || ""}
          disabled={!isOwnProfile}
          onChange={(e) =>
            setProfile({ ...profile, github: e.target.value })
          }
        />
      </div>

      {/* ================= SOCIAL LINKS DISPLAY ================= */}
      <div className="mb-4 flex gap-4">
        {profile.linkedin && (
          <a
            href={profile.linkedin}
            target="_blank"
            className="text-blue-600 underline"
          >
            LinkedIn
          </a>
        )}

        {profile.github && (
          <a
            href={profile.github}
            target="_blank"
            className="text-gray-800 underline"
          >
            GitHub
          </a>
        )}
      </div>

      {/* ================= PROFILE INFO ================= */}
      <input className="border p-2 w-full mb-2" value={profile.name} disabled />
      <input className="border p-2 w-full mb-2" value={profile.surname} disabled />
      <input className="border p-2 w-full mb-2" value={profile.email} disabled />
      <input className="border p-2 w-full mb-2" value={profile.department} disabled />
      <input className="border p-2 w-full mb-2" value={profile.role} disabled />

      {/* ================= ABOUT ================= */}
      <textarea
        className="border p-2 w-full mb-4"
        placeholder="About..."
        value={profile.extraInfo || ""}
        disabled={!isOwnProfile}
        onChange={(e) =>
          setProfile({ ...profile, extraInfo: e.target.value })
        }
      />

      {/* SAVE BUTTON (ONLY OWN PROFILE) */}
      {isOwnProfile && (
        <button
          onClick={updateAbout}
          className="bg-blue-500 text-white px-4 py-2 rounded mb-6"
        >
          Save
        </button>
      )}

      {/* ================= PROFILE STATS ================= */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-gray-100 rounded">
          <p>Total Tasks</p>
          <b>{stats.totalTasks}</b>
        </div>

        <div className="p-3 bg-gray-100 rounded">
          <p>Completed</p>
          <b>{stats.completedTasks}</b>
        </div>

        <div className="p-3 bg-gray-100 rounded">
          <p>Pending</p>
          <b>{stats.pendingTasks}</b>
        </div>

        <div className="p-3 bg-gray-100 rounded">
          <p>Success Rate</p>
          <b>{stats.successRate}%</b>
        </div>
      </div>

      {/* ================= ACTIVITY ================= */}
      <div className="mb-6">
        <h3 className="font-bold mb-2">Recent Activity</h3>

        {activities.map((a) => (
          <div key={a.id} className="p-2 border-b">
            <p>{a.text}</p>
            <small className="text-gray-500">{a.date}</small>
          </div>
        ))}
      </div>

      {/* ================= TIMELINE ================= */}
      <div>
        <h3 className="font-bold mb-2">Activity Timeline</h3>

        <ul className="space-y-2">
          <li>🟢 You moved task to In Progress</li>
          <li>🔵 You commented on a task</li>
          <li>🟣 You created a request</li>
        </ul>
      </div>
    </div>
  );
}