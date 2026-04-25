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

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<
    "tasks" | "profile" | "messages" | "requests"
  >("tasks");

  const router = useRouter();
  const API = "http://localhost:5001/api/tasks";

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetchTasks().finally(() => setLoading(false));
  }, []);

  const fetchTasks = async () => {
    const res = await fetch(API, {
      headers: {
        Authorization: getToken() || "",
      },
    });

    const data = await res.json();
    setTasks(Array.isArray(data) ? data : []);
  };

  const addTask = async () => {
    if (!newTask.trim()) return;

    await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getToken() || "",
      },
      body: JSON.stringify({ title: newTask }),
    });

    setNewTask("");
    fetchTasks();
    toast.success("Task created 🎉");
  };

  const deleteTask = async (id: number) => {
    await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: getToken() || "",
      },
    });

    setConfirmDelete(null);
    fetchTasks();
    toast.error("Task deleted 🗑️");
  };

  const updateTask = async () => {
    if (!editingTask) return;

    await fetch(`${API}/${editingTask.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: getToken() || "",
      },
      body: JSON.stringify(editingTask),
    });

    setEditingTask(null);
    fetchTasks();
    toast.success("Task updated ✏️");
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

      {/* HEADER */}
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

      {/* TABS */}
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

      {/* TASKS */}
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

      {/* PROFILE */}
      {activeTab === "profile" && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Profile</h2>
          <input className="border p-2 w-full mb-2" placeholder="Name" />
          <input className="border p-2 w-full mb-2" placeholder="Email" />
          <button className="bg-blue-500 text-white px-4 py-2">
            Save
          </button>
        </div>
      )}

      {/* REQUESTS */}
      {activeTab === "requests" && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Requests</h2>
          <input className="border p-2 w-full mb-2" />
          <textarea className="border p-2 w-full mb-2" />
          <button className="bg-green-500 text-white px-4 py-2">
            Send
          </button>
        </div>
      )}

      {/* MESSAGES */}
      {activeTab === "messages" && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Messages</h2>
          <div className="border h-32 mb-3 p-2">No messages</div>
          <input className="border p-2 w-full mb-2" />
          <button className="bg-blue-500 text-white px-4 py-2">
            Send
          </button>
        </div>
      )}

      {/* DELETE MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-80 text-center">
            <p className="mb-4">Delete "{confirmDelete.title}"?</p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => deleteTask(confirmDelete.id)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Yes, Delete
              </button>

              <button
                onClick={() => setConfirmDelete(null)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL (ENHANCED) ================= */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96">

            {/* TASK TITLE */}
            <input
              className="border p-2 w-full mb-2"
              value={editingTask.title}
              onChange={(e) =>
                setEditingTask({
                  ...editingTask,
                  title: e.target.value,
                })
              }
              placeholder="Task name"
            />

            {/* DUE DATE */}
            <input
              type="date"
              className="border p-2 w-full mb-2"
              value={editingTask.dueDate || ""}
              onChange={(e) =>
                setEditingTask({
                  ...editingTask,
                  dueDate: e.target.value,
                })
              }
            />

            {/* TEAM SELECT */}
            <select
              className="border p-2 w-full mb-4"
              value={editingTask.team || ""}
              onChange={(e) =>
                setEditingTask({
                  ...editingTask,
                  team: e.target.value,
                })
              }
            >
              <option value="">Select Team</option>
              <option value="IT">IT</option>
              <option value="ARGE">ARGE</option>
              <option value="ACCOUNTING">ACCOUNTING</option>
              <option value="CONTROLLING">CONTROLLING</option>
            </select>

            <button
              onClick={updateTask}
              className="bg-green-500 text-white px-4 py-2 w-full"
            >
              Save
            </button>

          </div>
        </div>
      )}
    </div>
  );
}