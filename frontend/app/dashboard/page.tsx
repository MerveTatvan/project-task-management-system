"use client";

import { useMemo } from "react";

export default function DashboardPage() {
  const tasks = [
    { id: 1, status: "todo", priority: "high", deadline: "" },
    { id: 2, status: "inprogress", priority: "medium", deadline: "" },
    { id: 3, status: "done", priority: "low", deadline: "" },
  ];

  const stats = useMemo(() => {
    const total = tasks.length;

    const todo = tasks.filter((t) => t.status === "todo").length;
    const inProgress = tasks.filter((t) => t.status === "inprogress").length;
    const done = tasks.filter((t) => t.status === "done").length;

    const overdue = tasks.filter(
      (t) => t.deadline && new Date(t.deadline) < new Date()
    ).length;

    return { total, todo, inProgress, done, overdue };
  }, [tasks]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-5 gap-6">
        <StatCard title="Total Tasks" value={totalSafe(stats.total)} />
        <StatCard title="Todo" value={stats.todo} />
        <StatCard title="In Progress" value={stats.inProgress} />
        <StatCard title="Done" value={stats.done} />
        <StatCard title="Overdue" value={stats.overdue} red />
      </div>
    </div>
  );
}

function StatCard({ title, value, red }: any) {
  return (
    <div className={`p-4 rounded-xl shadow bg-white ${red ? "border border-red-400" : ""}`}>
      <h2 className="text-sm text-gray-500">{title}</h2>
      <p className={`text-2xl font-bold ${red ? "text-red-500" : "text-gray-800"}`}>
        {value}
      </p>
    </div>
  );
}

// küçük güvenlik (opsiyonel)
function totalSafe(val: any) {
  return val ?? 0;
}