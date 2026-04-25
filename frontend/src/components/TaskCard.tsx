"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function TaskCard({ task, onDelete, onUpdate }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(task.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // ✅ PRIORITY COLOR
  const priorityColor =
    task.priority === "high"
      ? "bg-red-100 text-red-600"
      : task.priority === "medium"
      ? "bg-yellow-100 text-yellow-600"
      : "bg-green-100 text-green-600";

  // ✅ SAVE EDIT
  const handleSave = () => {
    if (!newTitle.trim()) return;

    onUpdate(task.id, newTitle);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded-xl shadow-md mb-3 cursor-grab active:cursor-grabbing border border-gray-100 hover:shadow-lg transition-all"
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-2">
        {/* PRIORITY BADGE */}
        <span
          className={`text-xs px-2 py-1 rounded-full font-semibold ${priorityColor}`}
        >
          {task.priority.toUpperCase()}
        </span>

        {/* DELETE */}
        <button
          onClick={() => onDelete(task.id)}
          className="text-gray-400 hover:text-red-500 text-lg"
        >
          ✕
        </button>
      </div>

      {/* CONTENT */}
      {isEditing ? (
        <div className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="border p-2 rounded w-full text-sm"
          />

          <button
            onClick={handleSave}
            className="bg-black text-white px-3 rounded text-sm"
          >
            Save
          </button>
        </div>
      ) : (
        <div>
          <p className="text-gray-800 font-medium">{task.title}</p>

          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-blue-500 mt-2 hover:underline"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}