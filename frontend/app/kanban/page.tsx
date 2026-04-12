"use client";

import { useState } from "react";
import KanbanColumn from "../components/KanbanColumn";

import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export default function KanbanPage() {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  const [filter, setFilter] = useState("all"); // 🔥 FILTER STATE

  const [tasks, setTasks] = useState([
    { id: 1, title: "Design UI", status: "todo", priority: "high", deadline: "" },
    { id: 2, title: "Build API", status: "inprogress", priority: "medium", deadline: "" },
    { id: 3, title: "Test App", status: "done", priority: "low", deadline: "" },
  ]);

  const sensors = useSensors(useSensor(PointerSensor));

  // ✅ DELETE
  const deleteTask = (id: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  // ✅ UPDATE
  const updateTask = (id: number, newTitle: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, title: newTitle } : task
      )
    );
  };

  // ✅ ADD
  const addTask = () => {
    if (!title.trim()) return;

    setTasks((prev) => [
      ...prev,
      {
        id: Date.now(),
        title,
        status: "todo",
        priority,
        deadline,
      },
    ]);

    setTitle("");
    setPriority("medium");
    setDeadline("");
  };

  // ✅ DRAG & DROP
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  // ✅ OVERDUE CHECK
  const isOverdue = (task: any) => {
    if (!task.deadline) return false;
    return new Date(task.deadline) < new Date();
  };

  // ✅ FILTERED TASKS
  const filteredTasks =
    filter === "overdue"
      ? tasks.filter(isOverdue)
      : tasks;

  // ✅ COLUMN FILTERS
  const todo = filteredTasks.filter((t) => t.status === "todo");
  const inProgress = filteredTasks.filter((t) => t.status === "inprogress");
  const done = filteredTasks.filter((t) => t.status === "done");

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="p-6 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          Kanban Board
        </h1>

        {/* FILTER BUTTONS */}
        <div className="mb-4 flex gap-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded ${
              filter === "all"
                ? "bg-black text-white"
                : "bg-white"
            }`}
          >
            All
          </button>

          <button
            onClick={() => setFilter("overdue")}
            className={`px-4 py-2 rounded ${
              filter === "overdue"
                ? "bg-red-500 text-white"
                : "bg-white"
            }`}
          >
            Overdue ⚠️
          </button>
        </div>

        {/* ADD TASK */}
        <div className="mb-6 flex gap-3 bg-white p-4 rounded-xl shadow items-center">
          <input
            type="text"
            placeholder="Enter task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 rounded w-full"
          />

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </select>

          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="border p-2 rounded"
          />

          <button
            onClick={addTask}
            className="bg-black text-white px-5 py-2 rounded"
          >
            Add
          </button>
        </div>

        {/* BOARD */}
        <div className="grid grid-cols-3 gap-6">
          <SortableContext
            items={todo.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <KanbanColumn
              title="todo"
              tasks={todo}
              onDelete={deleteTask}
              onUpdate={updateTask}
            />
          </SortableContext>

          <SortableContext
            items={inProgress.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <KanbanColumn
              title="inprogress"
              tasks={inProgress}
              onDelete={deleteTask}
              onUpdate={updateTask}
            />
          </SortableContext>

          <SortableContext
            items={done.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <KanbanColumn
              title="done"
              tasks={done}
              onDelete={deleteTask}
              onUpdate={updateTask}
            />
          </SortableContext>
        </div>
      </div>
    </DndContext>
  );
}