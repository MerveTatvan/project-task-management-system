"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Task = {
  id: number;
  title: string;
  description?: string | null;
  status?: string | null;
  assignedTo?: string | null;
  projectId?: number | null;
};

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

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [activeTab, setActiveTab] = useState<
    "tasks" | "profile" | "messages" | "requests"
  >("tasks");

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    Promise.all([fetchTasks(), fetchProfile()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const fetchTasks = async () => {
    const email = localStorage.getItem("email");
    if (!email) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/assigned/${email}`
    );

    const data = await res.json();
    setTasks(Array.isArray(data) ? data : []);
  };

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

  const addTask = async () => {
    if (!newTask.trim()) {
      toast.error("Görev başlığı boş olamaz");
      return;
    }

    const email = localStorage.getItem("email");

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: newTask,
        description: "",
        assignedTo: email,
        status: "TODO",
      }),
    });

    setNewTask("");
    fetchTasks();
    toast.success("Task created 🎉");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg font-semibold animate-pulse">
          Loading Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Task Dashboard</h1>
          <p className="text-sm text-gray-500">Manage everything</p>
        </div>

        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {["tasks", "profile", "messages", "requests"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-3 py-1 rounded-lg text-sm ${
              activeTab === tab ? "bg-black text-white" : "bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "tasks" && (
        <>
          <div className="flex gap-2 mb-6">
            <input
              className="border p-2 flex-1 rounded-lg"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Yeni görev ekle..."
            />

            <button
              onClick={addTask}
              className="bg-blue-500 text-white px-4 rounded-lg"
            >
              Add
            </button>
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-gray-500">Henüz task yok 🚀</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 border rounded-xl bg-white"
                >
                  <p className="font-semibold">{task.title}</p>

                  {task.description && (
                    <p className="text-sm text-gray-500">
                      {task.description}
                    </p>
                  )}

                  <p className="text-sm text-blue-500">
                    Status: {task.status || "TODO"}
                  </p>

                  <p className="text-sm text-gray-500">
                    Assigned To: {task.assignedTo}
                  </p>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === "profile" && (
        <div className="bg-white p-6 rounded-xl shadow space-y-3">
          <h2 className="text-xl font-bold mb-2">Profile</h2>

          {!profile ? (
            <p>Profile loading failed or empty</p>
          ) : (
            <>
              <input className="border p-2 w-full" value={profile.name} disabled />
              <input className="border p-2 w-full" value={profile.surname} disabled />
              <input className="border p-2 w-full" value={profile.email} disabled />
              <input className="border p-2 w-full" value={profile.birthDate} disabled />
              <input className="border p-2 w-full" value={profile.department} disabled />
              <input className="border p-2 w-full" value={profile.role} disabled />

              <textarea
                className="border p-2 w-full"
                value={profile.extraInfo}
                disabled
              />
            </>
          )}
        </div>
      )}

      {activeTab === "requests" && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Requests</h2>
          <p className="text-gray-500">Henüz request sistemi eklenmedi.</p>
        </div>
      )}

      {activeTab === "messages" && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Messages</h2>
          <p className="text-gray-500">Henüz mesaj sistemi eklenmedi.</p>
        </div>
      )}
    </div>
  );
}