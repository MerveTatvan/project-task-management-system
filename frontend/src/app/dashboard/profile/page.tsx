// Target file: frontend/src/app/dashboard/profile/page.tsx
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

type ActivityLog = {
  id: number;
  userEmail?: string;
  action: string;
  type: string;
  targetId?: number | null;
  createdAt: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPasswordRules, setShowPasswordRules] = useState(false);

  const [stats, setStats] = useState<ProfileStats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    successRate: 0,
  });

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);


  const passwordRules = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*]/.test(newPassword),
    noName:
      newPassword.length === 0 ||
      !profile ||
      ((!profile.name ||
        !newPassword.toLowerCase().includes(profile.name.toLowerCase())) &&
        (!profile.surname ||
          !newPassword.toLowerCase().includes(profile.surname.toLowerCase()))),
  };

  const isNewPasswordValid =
    passwordRules.length &&
    passwordRules.upper &&
    passwordRules.lower &&
    passwordRules.number &&
    passwordRules.special &&
    passwordRules.noName;

  const newPasswordsMatch = newPassword === confirmNewPassword;

  useEffect(() => {
    fetchProfile();
    fetchActivities();
    fetchStats();
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
      setPreviewImage(data.profileImage || null);
    }
  };

  const fetchStats = async () => {
    const email = localStorage.getItem("email");
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

  const fetchActivities = async () => {
    const email = localStorage.getItem("email");
    if (!email) return;

    setActivityLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/activity/${encodeURIComponent(
          email
        )}`
      );

      const data = await res.json();

      setActivities(Array.isArray(data) ? data : []);
    } catch {
      setActivities([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const formatActivityDate = (dateText?: string) => {
    if (!dateText) return "";

    const date = new Date(dateText);

    if (Number.isNaN(date.getTime())) {
      return dateText;
    }

    return date.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActivityVisual = (type?: string) => {
    if (!type) {
      return {
        icon: "🔔",
        label: "General",
        dotClass: "bg-white/700",
        badgeClass: "bg-white/60 text-slate-700 border-slate-200",
        iconClass: "bg-white/60 text-slate-700",
      };
    }

    if (type.includes("PROJECT")) {
      return {
        icon: "📁",
        label: "Project",
        dotClass: "bg-cyan-500",
        badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-100",
        iconClass: "bg-cyan-50 text-cyan-700",
      };
    }

    if (type.includes("REQUEST")) {
      return {
        icon: "📝",
        label: "Request",
        dotClass: "bg-violet-500",
        badgeClass: "bg-violet-50 text-violet-700 border-violet-100",
        iconClass: "bg-violet-50 text-violet-700",
      };
    }

    if (type.includes("TASK") || type === "DEADLINE") {
      return {
        icon: type === "DEADLINE" ? "⏰" : "✅",
        label: type === "DEADLINE" ? "Deadline" : "Task",
        dotClass: "bg-blue-500",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-100",
        iconClass: "bg-blue-50 text-blue-700",
      };
    }

    if (type === "COMMENT_MENTION") {
      return {
        icon: "@",
        label: "Mention",
        dotClass: "bg-indigo-500",
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-100",
        iconClass: "bg-indigo-50 text-indigo-700",
      };
    }

    return {
      icon: "🔔",
      label: type,
      dotClass: "bg-white/700",
      badgeClass: "bg-white/60 text-slate-700 border-slate-200",
      iconClass: "bg-white/60 text-slate-700",
    };
  };

  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64 = reader.result as string;

      setPreviewImage(base64);

      setProfile((prev: any) => ({
        ...prev,
        profileImage: base64,
      }));
    };

    reader.readAsDataURL(file);
  };

  const updateProfile = async () => {
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

  const changePassword = async () => {
    if (!profile) return;

    if (!oldPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (!newPasswordsMatch) {
      toast.error("New passwords do not match");
      return;
    }

    if (!isNewPasswordValid) {
      toast.error("New password does not meet the requirements");
      return;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password?email=${encodeURIComponent(
        profile.email
      )}&oldPassword=${encodeURIComponent(
        oldPassword
      )}&newPassword=${encodeURIComponent(newPassword)}`,
      {
        method: "POST",
      }
    );

    const text = await res.text();

    if (!res.ok || text.includes("yanlış") || text.includes("uymuyor")) {
      toast.error(text || "Password could not be changed");
      return;
    }

    setOldPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowPasswordRules(false);

    toast.success(text || "Password changed");
  };

  const Rule = ({ ok, text }: { ok: boolean; text: string }) => (
    <p className={`text-xs ${ok ? "text-emerald-600" : "text-red-500"}`}>
      {ok ? "✓" : "•"} {text}
    </p>
  );

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-indigo-100 to-cyan-100">
        <p className="font-bold text-slate-600 animate-pulse">
          Loading profile...
        </p>
      </div>
    );
  }

  const isOwnProfile =
    typeof window !== "undefined" &&
    localStorage.getItem("email") === profile.email;
      return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-100 to-cyan-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="bg-white/75 backdrop-blur rounded-3xl shadow-2xl shadow-blue-500/15 border border-slate-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative w-fit">
              <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl font-black overflow-hidden border-4 border-white shadow-xl shadow-blue-500/10 shadow-blue-500/10">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  `${profile.name?.charAt(0) || ""}${
                    profile.surname?.charAt(0) || ""
                  }`
                )}
              </div>

              {isOwnProfile && (
                <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2 py-1 rounded-xl cursor-pointer shadow">
                  Edit
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-black text-slate-900">
                {profile.name} {profile.surname}
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                {profile.role} • {profile.department}
              </p>

              <p className="text-sm text-slate-400 mt-1">{profile.email}</p>

              <div className="flex gap-3 mt-4">
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

        <div className="bg-white/75 backdrop-blur rounded-3xl shadow-xl shadow-blue-500/10 border border-slate-100 p-6 space-y-4">
          <h2 className="font-black text-xl text-slate-900">Profile Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="border border-slate-200 bg-white/70 p-3 rounded-2xl"
              value={profile.name}
              disabled
            />

            <input
              className="border border-slate-200 bg-white/70 p-3 rounded-2xl"
              value={profile.surname}
              disabled
            />

            <input
              className="border border-slate-200 bg-white/70 p-3 rounded-2xl"
              value={profile.email}
              disabled
            />

            <input
              className="border border-slate-200 bg-white/70 p-3 rounded-2xl"
              value={profile.department}
              disabled
            />

            <input
              className="border border-slate-200 bg-white/70 p-3 rounded-2xl"
              value={profile.role}
              disabled
            />

            <input
              className="border border-slate-200 bg-white/70 p-3 rounded-2xl"
              value={profile.birthDate || ""}
              disabled
            />
          </div>

          <input
            className="border border-slate-200 bg-white/70 p-3 w-full rounded-2xl"
            placeholder="LinkedIn URL"
            value={profile.linkedin || ""}
            disabled={!isOwnProfile}
            onChange={(e) =>
              setProfile({ ...profile, linkedin: e.target.value })
            }
          />

          <input
            className="border border-slate-200 bg-white/70 p-3 w-full rounded-2xl"
            placeholder="GitHub URL"
            value={profile.github || ""}
            disabled={!isOwnProfile}
            onChange={(e) =>
              setProfile({ ...profile, github: e.target.value })
            }
          />

          <textarea
            className="border border-slate-200 bg-white/70 p-3 w-full rounded-2xl min-h-[110px]"
            placeholder="About..."
            value={profile.extraInfo || ""}
            disabled={!isOwnProfile}
            onChange={(e) =>
              setProfile({ ...profile, extraInfo: e.target.value })
            }
          />

          {isOwnProfile && (
            <button
              onClick={updateProfile}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-blue-500/10 shadow-blue-500/10"
            >
              Save Changes
            </button>
          )}
        </div>

        {isOwnProfile && (
          <div className="bg-white/75 backdrop-blur rounded-3xl shadow-xl shadow-blue-500/10 border border-slate-100 p-6 space-y-4">
            <div>
              <h2 className="font-black text-xl text-slate-900">
                Change Password
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Update your password securely. Your new password must follow the same security rules used during sign up.
              </p>
            </div>

            <input
              type="password"
              className="border border-slate-200 bg-white/70 p-3 w-full rounded-2xl"
              placeholder="Current Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />

            <input
              type="password"
              className="border border-slate-200 bg-white/70 p-3 w-full rounded-2xl"
              placeholder="New Password"
              value={newPassword}
              onFocus={() => setShowPasswordRules(true)}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <input
              type="password"
              className="border border-slate-200 bg-white/70 p-3 w-full rounded-2xl"
              placeholder="Confirm New Password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />

            {confirmNewPassword && (
              <p
                className={`rounded-xl px-3 py-2 text-sm font-medium ${
                  newPasswordsMatch
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {newPasswordsMatch
                  ? "Passwords match ✔"
                  : "Passwords do not match ❌"}
              </p>
            )}

            {showPasswordRules && (
              <div className="space-y-1 rounded-2xl border border-slate-200 bg-white/70 p-4">
                <Rule ok={passwordRules.length} text="At least 8 characters" />
                <Rule ok={passwordRules.upper} text="Contains uppercase letter" />
                <Rule ok={passwordRules.lower} text="Contains lowercase letter" />
                <Rule ok={passwordRules.number} text="Contains number" />
                <Rule
                  ok={passwordRules.special}
                  text="Contains special character (!@#$%^&*)"
                />
                <Rule
                  ok={passwordRules.noName}
                  text="Must not include your first or last name"
                />
              </div>
            )}

            <button
              onClick={changePassword}
              className="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 hover:from-indigo-700 hover:to-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-blue-500/10 shadow-blue-500/10"
            >
              Update Password
            </button>
          </div>
        )}

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
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-black text-xl text-slate-900">
                Recent Activity
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Real activity records from tasks, projects and requests.
              </p>
            </div>

            {isOwnProfile && (
              <button
                onClick={fetchActivities}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-2xl text-xs font-black border border-indigo-100"
              >
                Refresh
              </button>
            )}
          </div>

          <div className="space-y-3">
            {activityLoading ? (
              <p className="text-sm text-slate-400">Loading activities...</p>
            ) : activities.length === 0 ? (
              <div className="bg-white/70 border border-slate-100 rounded-2xl p-5 text-center">
                <p className="text-sm font-bold text-slate-500">
                  No activity yet
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  New task, project and request updates will appear here.
                </p>
              </div>
            ) : (
              activities.map((activity) => {
                const visual = getActivityVisual(activity.type);

                return (
                  <div
                    key={activity.id}
                    className="flex justify-between gap-4 bg-white/70 border border-slate-100 rounded-2xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black ${visual.iconClass}`}
                      >
                        {visual.icon}
                      </span>

                      <div>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-black ${visual.badgeClass}`}
                        >
                          {visual.label}
                        </span>

                        <p className="font-bold text-slate-800 mt-2">
                          {activity.action}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          {formatActivityDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white/75 backdrop-blur rounded-3xl shadow-xl shadow-blue-500/10 border border-slate-100 p-6">
          <h2 className="font-black text-xl text-slate-900 mb-4">
            Activity Timeline
          </h2>

          {activities.length === 0 ? (
            <p className="text-sm text-slate-400">
              No timeline activity yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {activities.slice(0, 8).map((activity) => {
                const visual = getActivityVisual(activity.type);

                return (
                  <li
                    key={`timeline-${activity.id}`}
                    className="flex items-center gap-3 text-slate-700"
                  >
                    <span
                      className={`w-3 h-3 rounded-full ${visual.dotClass}`}
                    ></span>
                    <span className="font-semibold">{activity.action}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
