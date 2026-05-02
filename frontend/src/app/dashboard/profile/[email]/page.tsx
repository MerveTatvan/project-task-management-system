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
};

export default function OtherUserProfilePage() {
  const params = useParams();
  const email = decodeURIComponent(params.email as string);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchProfile();
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

  if (!profile) {
    return <p className="p-6">Loading profile...</p>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">
        {profile.name} {profile.surname}
      </h2>

      <p><b>Email:</b> {profile.email}</p>
      <p><b>Role:</b> {profile.role}</p>
      <p><b>Department:</b> {profile.department}</p>

      <div className="mt-4">
        <b>About:</b>
        <p>{profile.extraInfo || "No info"}</p>
      </div>

      <div className="mt-4 flex gap-4">
        {profile.linkedin && (
          <a href={profile.linkedin} target="_blank" className="text-blue-600 underline">
            LinkedIn
          </a>
        )}

        {profile.github && (
          <a href={profile.github} target="_blank" className="text-gray-800 underline">
            GitHub
          </a>
        )}
      </div>
    </div>
  );
}