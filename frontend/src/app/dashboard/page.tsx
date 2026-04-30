"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Task = {
  id: number;
  title: string;
  dueDate?: string | null;
  team?: string | null;
};

type UserProfile = {
  id: number;
  name: string;
  surname: string;
  email: string;
  department?: string | null;
  birthDate?: string | null;
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<
    "tasks" | "profile" | "messages" | "requests"
  >("tasks");

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [form, setForm] = useState({
    department: "",
    extraInfo: "",
  });

  const router = useRouter();

  const API = `${process.env.NEXT_PUBLIC_API_URL}/api/tasks`;
  const AUTH_API = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`;

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    Promise.all([fetchTasks(), fetchProfile()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const fetchTasks = async () => {
    const token = getToken();

    const res = await fetch(API, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setTasks(Array.isArray(data) ? data : []);
  };

  const fetchProfile = async () => {
    try {
      const token = getToken();

      const res = await fetch(AUTH_API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok && data && data.id) {
        setProfile({
          id: data.id,
          name: data.name || "",
          surname: data.surname || "",
          email: data.email || "",
          department: data.department || "",
          birthDate: data.birthDate || "",
        });

        setForm({
          department: data.department || "",
          extraInfo: "",
        });
      } else {
        setProfile(null);
      }
    } catch (err) {
      setProfile(null);
    }
  };
    const addTask = async () => {
    if (!newTask.trim()) return;

    const token = getToken();

    await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: newTask }),
    });

    setNewTask("");
    fetchTasks();
    toast.success("Task created 🎉");
  };

  const deleteTask = async (id: number) => {
    const token = getToken();

    await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setConfirmDelete(null);
    fetchTasks();
    toast.error("Task deleted 🗑️");
  };

  const updateTask = async () => {
    if (!editingTask) return;

    const token = getToken();

    await fetch(`${API}/${editingTask.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(editingTask),
    });

    setEditingTask(null);
    fetchTasks();
    toast.success("Task updated ✏️");
  };

  const updateProfile = async () => {
    const token = getToken();

    const res = await fetch(AUTH_API, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        department: form.department,
        extraInfo: form.extraInfo,
      }),
    });

    if (res.ok) {
      toast.success("Profile updated");

      const refreshed = await fetch(AUTH_API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedUser = await refreshed.json();

      if (refreshed.ok && updatedUser) {
        setProfile({
          id: updatedUser.id,
          name: updatedUser.name || "",
          surname: updatedUser.surname || "",
          email: updatedUser.email || "",
          department: updatedUser.department || "",
          birthDate: updatedUser.birthDate || "",
        });

        setForm({
          department: updatedUser.department || "",
          extraInfo: "",
        });
      }
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
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
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 border rounded-xl bg-white flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{task.title}</p>
                  {task.dueDate && (
                    <p className="text-sm text-gray-500">{task.dueDate}</p>
                  )}
                  {task.team && (
                    <p className="text-sm text-blue-500">{task.team}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingTask(task)}
                    className="text-blue-600"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setConfirmDelete(task)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
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
              <input className="border p-2 w-full" value={profile.birthDate || ""} disabled />

              <input
                className="border p-2 w-full"
                value={form.department}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    department: e.target.value,
                  }))
                }
              />

              <textarea
                className="border p-2 w-full"
                value={form.extraInfo}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    extraInfo: e.target.value,
                  }))
                }
              />

              <button
                onClick={updateProfile}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Save Changes
              </button>
            </>
          )}
        </div>
      )}

      {activeTab === "requests" && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Requests</h2>
        </div>
      )}

      {activeTab === "messages" && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Messages</h2>
        </div>
      )}
    </div>
  );
}
