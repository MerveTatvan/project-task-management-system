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
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

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

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4">Profile</h2>

      <input className="border p-2 w-full mb-2" value={profile.name} disabled />
      <input className="border p-2 w-full mb-2" value={profile.surname} disabled />
      <input className="border p-2 w-full mb-2" value={profile.email} disabled />
      <input className="border p-2 w-full mb-2" value={profile.department} disabled />
      <input className="border p-2 w-full mb-2" value={profile.role} disabled />

      <textarea
        className="border p-2 w-full mb-2"
        placeholder="About..."
        value={profile.extraInfo || ""}
        onChange={(e) =>
          setProfile({ ...profile, extraInfo: e.target.value })
        }
      />

      <button
        onClick={updateAbout}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Save
      </button>
    </div>
  );
}
