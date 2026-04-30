"use client";

import { useEffect, useState } from "react";

type Task = {
  id: number;
  title: string;
  dueDate?: string | null;
  team?: string | null;
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);

  const [loading, setLoading] = useState(true);

  const API = `${process.env.NEXT_PUBLIC_API_URL}/api/tasks`;

  /* LOAD */
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetchTasks();
  }, []);

  /* FETCH */
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(API, {
        headers: {
          Authorization: token || "",
        },
      });

      const data = await res.json();

      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        setTasks([]);
      }

    } catch (err) {
      console.error(err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  /* ADD */
  const addTask = async () => {
    if (!newTask) return;

    const token = localStorage.getItem("token");

    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token || "",
      },
      body: JSON.stringify({ title: newTask }),
    });

    const created = await res.json();

    setTasks((prev) => [...prev, created]);
    setNewTask("");
  };

  /* DELETE */
  const deleteTask = async (id: number) => {
    const token = localStorage.getItem("token");

    await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: token || "",
      },
    });

    setTasks((prev) => prev.filter((t) => t.id !== id));
    setConfirmDelete(null);
  };

  /* UPDATE */
  const updateTask = async () => {
    if (!editingTask) return;

    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/${editingTask.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token || "",
      },
      body: JSON.stringify(editingTask),
    });

    const updated = await res.json();

    setTasks((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );

    setEditingTask(null);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Task Dashboard</h1>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          className="border p-2 flex-1 rounded"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Yeni görev ekle..."
        />

        <button
          onClick={addTask}
          className="bg-blue-500 text-white px-4 rounded"
        >
          Add
        </button>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-gray-500">Henüz task yok 🚀</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="p-4 border rounded flex justify-between items-center">
              <div>
                <p className="font-semibold text-lg">
                  {task.title || "Untitled Task"}
                </p>

                {task.dueDate && (
                  <p className="text-sm text-gray-500">
                    📅 {task.dueDate}
                  </p>
                )}

                {task.team && (
                  <p className="text-sm text-blue-500">
                    👥 {task.team}
                  </p>
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
          ))
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow w-80 text-center">
            <p className="mb-4 font-medium">
              “{confirmDelete.title}” silmek istediğine emin misin?
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => deleteTask(confirmDelete.id)}
                className="bg-red-500 text-white px-4 py-1 rounded"
              >
                Evet, Sil
              </button>

              <button
                onClick={() => setConfirmDelete(null)}
                className="bg-gray-300 px-4 py-1 rounded"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow w-96">
            <h2 className="text-lg font-bold mb-4">Görev Düzenle</h2>

            <label className="text-sm">Görev Adı</label>
            <input
              className="border w-full p-2 mb-3 rounded"
              value={editingTask.title}
              onChange={(e) =>
                setEditingTask({ ...editingTask, title: e.target.value })
              }
            />

            <label className="text-sm">Son Tarih</label>
            <input
              type="date"
              className="border w-full p-2 mb-3 rounded"
              value={editingTask.dueDate || ""}
              onChange={(e) =>
                setEditingTask({ ...editingTask, dueDate: e.target.value })
              }
            />

            <label className="text-sm">Ekip</label>
            <select
              className="border w-full p-2 mb-4 rounded"
              value={editingTask.team || ""}
              onChange={(e) =>
                setEditingTask({ ...editingTask, team: e.target.value })
              }
            >
              <option value="">Seçiniz</option>
              <option value="IT">IT</option>
              <option value="ARGE">ARGE</option>
              <option value="ACCOUNTING">ACCOUNTING</option>
              <option value="CONTROLLING">CONTROLLING</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={updateTask}
                className="bg-green-500 text-white px-4 py-1 rounded"
              >
                Kaydet
              </button>

              <button
                onClick={() => setEditingTask(null)}
                className="bg-gray-300 px-4 py-1 rounded"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
