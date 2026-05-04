"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

type Project = {
  id: number;
  name: string;
  description?: string | null;
  githubUrl?: string | null;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  memberEmails?: string[] | null;
  createdBy?: string | null;
};

type Task = {
  id: number;
  title: string;
  description?: string | null;
  status?: string | null;
  assignedTo?: string | null;
  createdBy?: string | null;
  priority?: string | null;
  dueDate?: string | null;
  projectId?: number | null;
};

type User = {
  id?: number;
  email: string;
  name?: string;
  surname?: string;
  role?: string;
  department?: string;
};

type ActivityLog = {
  id: number;
  type: string;
  targetId: number;
  action: string;
  actorEmail?: string | null;
  message?: string | null;
  createdAt?: string | null;
};

export default function ProjectDetailPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id ? Number(params.id) : null;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!projectId) return;

    Promise.all([fetchProject(), fetchTasks(), fetchUsers(), fetchActivities()]).finally(
      () => setLoading(false)
    );
  }, [projectId]);

  const fetchProject = async () => {
    const res = await fetch(`${API_URL}/api/projects/${projectId}`);
    const data = await res.json();
    setProject(data && data.id ? data : null);
  };

  const fetchTasks = async () => {
    const res = await fetch(`${API_URL}/api/tasks/project/${projectId}`);
    const data = await res.json();
    setTasks(Array.isArray(data) ? data : []);
  };

  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/api/users`);
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  };

  const fetchActivities = async () => {
    const res = await fetch(`${API_URL}/api/activity/project/${projectId}`);
    const data = await res.json();
    setActivities(Array.isArray(data) ? data : []);
  };

  const getUserFullName = (email?: string | null) => {
    if (!email) return "-";

    const user = users.find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!user) return email;

    const fullName = `${user.name || ""} ${user.surname || ""}`.trim();

    return fullName || user.email;
  };

  const formatDate = (dateText?: string | null) => {
    if (!dateText) return "Not set";

    const date = new Date(dateText);

    if (Number.isNaN(date.getTime())) return dateText;

    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateText?: string | null) => {
    if (!dateText) return "";

    const date = new Date(dateText);

    if (Number.isNaN(date.getTime())) return dateText;

    return date.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.status === "DONE").length;
    const active = tasks.filter(
      (task) => task.status === "IN_PROGRESS" || task.status === "TEST"
    ).length;
    const waiting = tasks.filter(
      (task) => task.status === "WAITING_APPROVAL"
    ).length;
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);

    return { total, done, active, waiting, progress };
  }, [tasks]);

  const projectStatusChartData = [
    { name: "TODO", value: tasks.filter((task) => (task.status || "TODO") === "TODO").length },
    { name: "IN_PROGRESS", value: tasks.filter((task) => task.status === "IN_PROGRESS").length },
    { name: "TEST", value: tasks.filter((task) => task.status === "TEST").length },
    { name: "WAITING_APPROVAL", value: tasks.filter((task) => task.status === "WAITING_APPROVAL").length },
    { name: "DONE", value: tasks.filter((task) => task.status === "DONE").length },
  ];

  const projectPriorityChartData = [
    { name: "LOW", value: tasks.filter((task) => (task.priority || "MEDIUM") === "LOW").length },
    { name: "MEDIUM", value: tasks.filter((task) => (task.priority || "MEDIUM") === "MEDIUM").length },
    { name: "HIGH", value: tasks.filter((task) => task.priority === "HIGH").length },
    { name: "URGENT", value: tasks.filter((task) => task.priority === "URGENT").length },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500">
        <p className="rounded-3xl bg-white/90 px-8 py-5 font-black text-blue-900 shadow-xl">
          Loading project...
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-6">
        <div className="rounded-3xl bg-white/95 p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black text-blue-950">Project not found</h1>
          <button
            onClick={() => router.push("/projects")}
            className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-6">
      <div className="w-full space-y-6">
        <div className="rounded-3xl border border-white/20 bg-white/95 p-7 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <button
                onClick={() => router.push("/projects")}
                className="mb-4 rounded-2xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-100"
              >
                ← Back to Projects
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-700">
                  {project.status || "Active"}
                </span>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                  Project #{project.id}
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-black text-blue-950">
                {project.name}
              </h1>
              <p className="mt-2 max-w-4xl text-sm text-blue-900/70">
                {project.description || "No description added."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-black"
                >
                  🔗 GitHub
                </a>
              )}

              <button
                onClick={() => router.push(`/kanban?projectId=${project.id}`)}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700"
              >
                Open Kanban
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-700">Progress</p>
              <p className="mt-1 text-3xl font-black text-blue-900">{stats.progress}%</p>
            </div>
            <div className="rounded-3xl bg-cyan-50 p-5">
              <p className="text-sm font-bold text-cyan-700">Total Tasks</p>
              <p className="mt-1 text-3xl font-black text-cyan-900">{stats.total}</p>
            </div>
            <div className="rounded-3xl bg-indigo-50 p-5">
              <p className="text-sm font-bold text-indigo-700">Active</p>
              <p className="mt-1 text-3xl font-black text-indigo-900">{stats.active}</p>
            </div>
            <div className="rounded-3xl bg-emerald-50 p-5">
              <p className="text-sm font-bold text-emerald-700">Done</p>
              <p className="mt-1 text-3xl font-black text-emerald-900">{stats.done}</p>
            </div>
          </div>

          <div className="mt-6 h-4 overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/20 bg-white/95 p-6 shadow-xl lg:col-span-2">
            <h2 className="text-xl font-black text-blue-950">Project Tasks</h2>
            <p className="mt-1 text-sm text-blue-900/60">
              Tasks connected to this project.
            </p>

            <div className="mt-5 space-y-3">
              {tasks.length === 0 ? (
                <p className="rounded-2xl bg-blue-50 p-5 text-sm font-bold text-blue-700">
                  No tasks connected to this project yet.
                </p>
              ) : (
                [...tasks]
                  .sort((a, b) => b.id - a.id)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="font-black text-blue-950">{task.title}</h3>
                          <p className="mt-1 text-xs text-blue-900/60">
                            Assigned to {(task.assignedTo || "-")
                              .split(",")
                              .map((mail) => getUserFullName(mail.trim()))
                              .join(", ")}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700">
                            {task.status || "TODO"}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-cyan-700">
                            {task.priority || "MEDIUM"}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                            Due: {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/20 bg-white/95 p-6 shadow-xl">
              <h2 className="text-xl font-black text-blue-950">Members</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.memberEmails && project.memberEmails.length > 0 ? (
                  project.memberEmails.map((email) => (
                    <span
                      key={email}
                      className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700"
                      title={email}
                    >
                      {getUserFullName(email)}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-blue-900/60">No members added.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/95 p-6 shadow-xl">
              <h2 className="text-xl font-black text-blue-950">Timeline</h2>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs font-black uppercase text-blue-700">Start</p>
                  <p className="font-bold text-blue-950">{formatDate(project.startDate)}</p>
                </div>
                <div className="rounded-2xl bg-cyan-50 p-4">
                  <p className="text-xs font-black uppercase text-cyan-700">Deadline</p>
                  <p className="font-bold text-blue-950">{formatDate(project.endDate)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/95 p-6 shadow-xl">
              <h2 className="text-xl font-black text-blue-950">Activity Log</h2>
              <div className="mt-4 space-y-3">
                {activities.length === 0 ? (
                  <p className="rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-700">
                    No activity yet.
                  </p>
                ) : (
                  activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4"
                    >
                      <p className="text-sm font-black text-blue-950">
                        {activity.message || activity.action}
                      </p>
                      <p className="mt-1 text-xs text-blue-900/60">
                        {getUserFullName(activity.actorEmail)} • {formatDateTime(activity.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
