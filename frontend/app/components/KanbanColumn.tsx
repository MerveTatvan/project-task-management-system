"use client";

import TaskCard from "./TaskCard";
import { useDroppable } from "@dnd-kit/core";

export default function KanbanColumn({ title, tasks, onDelete }: any) {
  const { setNodeRef } = useDroppable({
    id: title,
  });

  return (
    <div
      ref={setNodeRef}
      className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl p-4 w-full min-h-[350px] shadow-md flex flex-col"
    >
      {/* HEADER */}
      <h2 className="font-bold text-lg mb-4 capitalize text-gray-700 tracking-wide">
  {title} ({tasks.length})
</h2>

      {/* TASK LIST */}
      <div className="flex flex-col gap-3 flex-1">
        {tasks.map((task: any) => (
          <TaskCard key={task.id} task={task} onDelete={onDelete} />
        ))}
      </div>

      {/* EMPTY STATE */}
      {tasks.length === 0 && (
        <div className="text-center text-gray-400 text-sm mt-6">
          No tasks here ✨
        </div>
      )}
    </div>
  );
}