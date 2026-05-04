"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

type Task = {
  id: number;
  title: string;
  description?: string | null;
  status?: string | null;
  assignedTo?: string | null;
  createdBy?: string | null;
  assignmentType?: string | null;
  teamName?: string | null;
  priority?: string | null;
  dueDate?: string | null;
  reviewNote?: string | null;
  completedBy?: string | null;
  approvalRequestedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  projectId?: number | null;
};

type User = {
  id?: number;
  email: string;
  name?: string;
  surname?: string;
  role?: string;
  department?: string;
  profileImage?: string;
  profilePhoto?: string;
  profilePhotoUrl?: string;
  profileImageUrl?: string;
  photoUrl?: string;
  imageUrl?: string;
  avatarUrl?: string;
};

type Project = {
  id: number;
  name: string;
  description?: string | null;
  githubUrl?: string | null;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  memberEmails?: string[] | null;
};

const columns = [
  {
    id: "TODO",
    title: "To Do",
    icon: "📝",
    description: "Tasks waiting to be started",
    className: "border-amber-100 bg-amber-50/70",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    id: "IN_PROGRESS",
    title: "In Progress",
    icon: "🚧",
    description: "Tasks currently being worked on",
    className: "border-blue-100 bg-blue-50/70",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    id: "TEST",
    title: "Testing",
    icon: "🧪",
    description: "Tasks waiting for testing",
    className: "border-indigo-100 bg-indigo-50/70",
    badgeClass: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  {
    id: "WAITING_APPROVAL",
    title: "Waiting Approval",
    icon: "🕓",
    description: "Completed tasks waiting for creator review",
    className: "border-purple-100 bg-purple-50/70",
    badgeClass: "bg-purple-100 text-purple-700 border-purple-200",
  },
  {
    id: "DONE",
    title: "Done",
    icon: "✅",
    description: "Approved and closed tasks",
    className: "border-emerald-100 bg-emerald-50/70",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
];

export default function KanbanPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [searchText, setSearchText] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [viewFilter, setViewFilter] = useState("all");

  const router = useRouter();
  const searchParams = useSearchParams();

  const currentEmail =
    typeof window !== "undefined" ? localStorage.getItem("email") || "" : "";

  const role =
    typeof window !== "undefined" ? localStorage.getItem("role") || "" : "";

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedEmail = localStorage.getItem("email");

    if (!token || !storedEmail) {
      router.push("/login");
      return;
    }

    const projectFromUrl = searchParams.get("projectId");

    if (projectFromUrl) {
      setProjectFilter(projectFromUrl);
    }

    Promise.all([fetchUsers(), fetchProjects(), fetchTasks()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      const data = await res.json();

      setUsers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Users could not be loaded");
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects`);
      const data = await res.json();

      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setProjects([]);
    }
  };

  const fetchTasks = async () => {
    try {
      const userEmail = localStorage.getItem("email") || "";
      const userRole = localStorage.getItem("role") || "";

      const res = await fetch(`${API_URL}/api/tasks`);
      const data = await res.json();

      if (!Array.isArray(data)) {
        setTasks([]);
        return;
      }

      if (userRole === "ADMIN") {
        setTasks([...data].sort((a, b) => b.id - a.id));
        return;
      }

      const visibleTasks = data.filter((task: Task) => {
        const assignedToMe = (task.assignedTo || "")
          .toLowerCase()
          .includes(userEmail.toLowerCase());

        const createdByMe =
          (task.createdBy || "").toLowerCase() === userEmail.toLowerCase();

        return assignedToMe || createdByMe;
      });

      setTasks([...visibleTasks].sort((a, b) => b.id - a.id));
    } catch {
      toast.error("Tasks could not be loaded");
    }
  };

  const getUserByEmail = (email?: string | null) => {
    if (!email) return null;

    return users.find(
      (user) => (user.email || "").toLowerCase() === email.trim().toLowerCase()
    );
  };

  const getUserFullName = (email?: string | null) => {
    const user = getUserByEmail(email);

    if (!user) return email || "-";

    const fullName = `${user.name || ""} ${user.surname || ""}`.trim();

    return fullName || user.email || "-";
  };

  const getInitials = (email?: string | null) => {
    const user = getUserByEmail(email);

    if (user) {
      const nameInitial = user.name ? user.name.charAt(0).toUpperCase() : "";
      const surnameInitial = user.surname
        ? user.surname.charAt(0).toUpperCase()
        : "";

      return `${nameInitial}${surnameInitial}` || "U";
    }

    return email ? email.charAt(0).toUpperCase() : "U";
  };

  const getProfileImage = (user?: User | null) => {
    return (
      user?.profileImage ||
      user?.profilePhoto ||
      user?.profilePhotoUrl ||
      user?.profileImageUrl ||
      user?.photoUrl ||
      user?.imageUrl ||
      user?.avatarUrl ||
      ""
    );
  };

  const formatDate = (dateText?: string | null) => {
    if (!dateText) return "-";

    const date = new Date(dateText);

    if (Number.isNaN(date.getTime())) {
      return dateText;
    }

    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === "DONE") return false;

    const today = new Date().toISOString().split("T")[0];

    return task.dueDate < today;
  };

  const getPriorityClass = (priority?: string | null) => {
    if (priority === "URGENT") {
      return "bg-rose-100 text-rose-700 border-rose-200";
    }

    if (priority === "HIGH") {
      return "bg-orange-100 text-orange-700 border-orange-200";
    }

    if (priority === "MEDIUM") {
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }

    return "bg-teal-100 text-teal-700 border-teal-200";
  };

  const getTaskTeam = (task: Task) => {
    const assignedUser = getUserByEmail(
      (task.assignedTo || "").split(",")[0]?.trim()
    );

    return task.teamName || assignedUser?.department || "-";
  };

  const getProjectName = (projectId?: number | null) => {
    if (!projectId) return "No Project";

    const project = projects.find((item) => item.id === projectId);

    return project?.name || `Project #${projectId}`;
  };

  const getProjectById = (projectId?: number | null) => {
    if (!projectId) return null;

    return projects.find((project) => project.id === projectId) || null;
  };

  const selectedProjectFromFilter = projectFilter
    ? getProjectById(Number(projectFilter))
    : null;

  const allTeams = useMemo(() => {
    const defaultTeams = [
      "Frontend",
      "Backend",
      "Database",
      "QA",
      "DevOps",
      "UI/UX",
      "IT",
      "ARGE",
    ];

    return Array.from(
      new Set([
        ...defaultTeams,
        ...users.map((user) => user.department).filter(Boolean),
        ...tasks.map((task) => task.teamName).filter(Boolean),
      ])
    ).filter((team): team is string => Boolean(team));
  }, [users, tasks]);

  const filteredTasks = tasks.filter((task) => {
    const assignedNames = (task.assignedTo || "")
      .split(",")
      .map((email) => getUserFullName(email.trim()))
      .join(" ");

    const createdByName = getUserFullName(task.createdBy);
    const taskTeam = getTaskTeam(task);

    const matchesSearch =
      !searchText ||
      task.title.toLowerCase().includes(searchText.toLowerCase()) ||
      (task.description || "")
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      (task.assignedTo || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (task.createdBy || "").toLowerCase().includes(searchText.toLowerCase()) ||
      assignedNames.toLowerCase().includes(searchText.toLowerCase()) ||
      createdByName.toLowerCase().includes(searchText.toLowerCase());

    const matchesPriority =
      !priorityFilter || (task.priority || "MEDIUM") === priorityFilter;

    const matchesTeam = !teamFilter || taskTeam === teamFilter;

    const matchesProject =
      !projectFilter || String(task.projectId || "") === projectFilter;

    const assignedToMe = (task.assignedTo || "")
      .toLowerCase()
      .includes(currentEmail.toLowerCase());

    const createdByMe =
      (task.createdBy || "").toLowerCase() === currentEmail.toLowerCase();

    const matchesView =
      viewFilter === "all" ||
      (viewFilter === "assignedToMe" && assignedToMe) ||
      (viewFilter === "createdByMe" && createdByMe) ||
      (viewFilter === "overdue" && isOverdue(task));

    return (
      matchesSearch &&
      matchesPriority &&
      matchesTeam &&
      matchesProject &&
      matchesView
    );
  });

  const totalTasks = filteredTasks.length;
  const overdueCount = filteredTasks.filter(isOverdue).length;
  const waitingApprovalCount = filteredTasks.filter(
    (task) => task.status === "WAITING_APPROVAL"
  ).length;
  const doneCount = filteredTasks.filter((task) => task.status === "DONE").length;

  const getTasksByStatus = (status: string) => {
    return filteredTasks
      .filter((task) => (task.status || "TODO") === status)
      .sort((a, b) => b.id - a.id);
  };

  const updateTaskStatus = async (task: Task, newStatus: string) => {
    if (task.status === "DONE") {
      toast.error("Approved tasks are closed and cannot be moved");
      return;
    }

    if (newStatus === "DONE" && task.status === "WAITING_APPROVAL") {
      toast.error("Waiting approval tasks must be approved from dashboard");
      return;
    }

    const isAssignedToMe = (task.assignedTo || "")
      .toLowerCase()
      .includes(currentEmail.toLowerCase());

    const isCreator =
      (task.createdBy || "").toLowerCase() === currentEmail.toLowerCase();

    if (role !== "ADMIN" && !isAssignedToMe && !isCreator) {
      toast.error("You can only update tasks assigned to you or created by you");
      return;
    }

    const res = await fetch(
      `${API_URL}/api/tasks/${task.id}/status?status=${newStatus}&userEmail=${encodeURIComponent(
        currentEmail || ""
      )}`,
      {
        method: "PUT",
      }
    );

    if (!res.ok) {
      toast.error("Task status could not be updated");
      return;
    }

    fetchTasks();

    if (newStatus === "DONE") {
      toast.success("Task submitted for approval");
    } else {
      toast.success("Task moved");
    }
  };

  const handleDrop = async (status: string) => {
    if (!draggedTaskId) return;

    const task = tasks.find((item) => item.id === draggedTaskId);

    setDraggedTaskId(null);
    setDragOverColumn(null);

    if (!task) return;

    if ((task.status || "TODO") === status) return;

    await updateTaskStatus(task, status);
  };

  const UserPill = ({ email }: { email?: string | null }) => {
    if (!email) return null;

    const cleanEmail = email.trim();

    if (!cleanEmail || cleanEmail === "-") return null;

    const user = getUserByEmail(cleanEmail);

    return (
      <button
        type="button"
        onClick={() =>
          router.push(`/dashboard/profile/${encodeURIComponent(cleanEmail)}`)
        }
        className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 shadow-sm transition hover:bg-indigo-50 hover:text-indigo-700"
      >
        <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-[9px] font-black text-indigo-700">
          {getProfileImage(user) ? (
            <img
              src={getProfileImage(user)}
              alt={getUserFullName(cleanEmail)}
              className="h-full w-full object-cover"
            />
          ) : (
            getInitials(cleanEmail)
          )}
        </span>

        {getUserFullName(cleanEmail)}
      </button>
    );
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const assignedEmails = (task.assignedTo || "")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);

    const isClosed = task.status === "DONE";

    return (
      <div
        draggable={!isClosed}
        onClick={() => setSelectedTask(task)}
        onDragStart={() => {
          if (!isClosed) setDraggedTaskId(task.id);
        }}
        onDragEnd={() => {
          setDraggedTaskId(null);
          setDragOverColumn(null);
        }}
        className={`rounded-3xl border bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl ${
          isClosed ? "cursor-pointer opacity-80" : "cursor-grab active:cursor-grabbing"
        } ${
          draggedTaskId === task.id
            ? "scale-95 rotate-1 opacity-70 ring-4 ring-indigo-100"
            : ""
        }`}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-900">{task.title}</p>

            {task.description && (
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                {task.description}
              </p>
            )}
          </div>

          <span
            className={`whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-black ${getPriorityClass(
              task.priority || "MEDIUM"
            )}`}
          >
            {task.priority || "MEDIUM"}
          </span>
        </div>

        <div className="space-y-2 text-xs text-slate-500">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2">
            <p className="font-black text-slate-600">Assigned To</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {assignedEmails.length > 0 ? (
                assignedEmails.map((email) => (
                  <UserPill key={`${task.id}-${email}`} email={email} />
                ))
              ) : (
                <span>-</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-2">
            <p className="font-black text-blue-700">Created By</p>
            <div className="mt-2">
              {task.createdBy ? <UserPill email={task.createdBy} /> : "-"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-2">
              <p className="font-black text-teal-700">Team</p>
              <p className="mt-1 font-semibold text-slate-600">
                {getTaskTeam(task)}
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-2">
              <p className="font-black text-cyan-700">Project</p>
              <p className="mt-1 font-semibold text-slate-600">
                {getProjectName(task.projectId)}
              </p>
              {getProjectById(task.projectId)?.githubUrl && (
                <a
                  href={getProjectById(task.projectId)?.githubUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="mt-2 inline-flex rounded-xl bg-white px-2 py-1 text-[10px] font-black text-cyan-700 underline"
                >
                  GitHub
                </a>
              )}
            </div>

            <div
              className={`rounded-2xl border p-2 ${
                isOverdue(task)
                  ? "border-rose-100 bg-rose-50"
                  : "border-violet-100 bg-violet-50/70"
              }`}
            >
              <p
                className={`font-black ${
                  isOverdue(task) ? "text-rose-700" : "text-violet-700"
                }`}
              >
                Due Date
              </p>
              <p className="mt-1 font-semibold text-slate-600">
                {formatDate(task.dueDate)}
              </p>
            </div>
          </div>

          {task.reviewNote && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-2">
              <p className="font-black text-rose-700">Revision Note</p>
              <p className="mt-1 text-slate-600">{task.reviewNote}</p>
            </div>
          )}

          {task.status === "WAITING_APPROVAL" && (
            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-2">
              <p className="font-black text-purple-700">
                Waiting for creator approval
              </p>
              <p className="mt-1 text-slate-500">
                Approve or request revision from the dashboard.
              </p>
            </div>
          )}

          {task.status === "DONE" && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-2">
              <p className="font-black text-emerald-700">Closed / Approved</p>
              <p className="mt-1 text-slate-500">
                This task is completed and locked.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const KanbanColumn = ({ column }: { column: (typeof columns)[number] }) => {
    const columnTasks = getTasksByStatus(column.id);

    return (
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOverColumn(column.id);
        }}
        onDragLeave={() => setDragOverColumn(null)}
        onDrop={() => handleDrop(column.id)}
        className={`min-h-[560px] rounded-3xl border p-4 shadow-sm transition-all duration-300 ${
          column.className
        } ${
          dragOverColumn === column.id
            ? "scale-[1.01] border-indigo-300 bg-white/90 shadow-2xl ring-4 ring-indigo-100"
            : ""
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {column.icon} {column.title}
            </h2>
            <p className="mt-1 text-xs text-slate-500">{column.description}</p>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-black ${column.badgeClass}`}
          >
            {columnTasks.length}
          </span>
        </div>

        <div className="space-y-3">
          {columnTasks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-sm text-slate-400">
              Drop tasks here
            </div>
          ) : (
            columnTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50">
        <div className="rounded-3xl border border-slate-100 bg-white/90 px-8 py-5 shadow-lg backdrop-blur">
          <p className="animate-pulse text-lg font-bold text-slate-700">
            Loading Kanban board...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 p-6">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-6 rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                Project Management Workspace
              </div>

              <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                Kanban Board
              </h1>

              <p className="mt-3 max-w-3xl text-sm text-slate-500">
                Visualize your task workflow. Admins can see all tasks; other
                users only see tasks they created or tasks assigned to them.
              </p>

              {selectedProjectFromFilter && (
                <div className="mt-5 max-w-4xl rounded-3xl border border-cyan-100 bg-cyan-50/80 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-cyan-700">
                        Selected Project Board
                      </p>
                      <h2 className="mt-1 text-xl font-black text-slate-900">
                        {selectedProjectFromFilter.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {selectedProjectFromFilter.description ||
                          "No description added."}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white px-3 py-1 font-bold text-cyan-700">
                          Status: {selectedProjectFromFilter.status || "Active"}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 font-bold text-slate-600">
                          Start: {formatDate(selectedProjectFromFilter.startDate)}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 font-bold text-slate-600">
                          Deadline: {formatDate(selectedProjectFromFilter.endDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {selectedProjectFromFilter.githubUrl && (
                        <a
                          href={selectedProjectFromFilter.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-black"
                        >
                          🔗 GitHub
                        </a>
                      )}

                      <button
                        onClick={() => router.push(`/projects/${selectedProjectFromFilter.id}`)}
                        className="rounded-2xl border border-cyan-100 bg-white px-4 py-2 text-sm font-bold text-cyan-700 shadow-sm hover:bg-cyan-50"
                      >
                        Project Details
                      </button>

                      <button
                        onClick={() => setProjectFilter("")}
                        className="rounded-2xl border border-slate-100 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50"
                      >
                        Show All
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push("/dashboard")}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-black"
              >
                ← Dashboard
              </button>

              <button
                onClick={() => {
                  fetchProjects();
                  fetchTasks();
                }}
                className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 shadow-sm hover:bg-indigo-100"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="rounded-3xl border-l-8 border-indigo-300 bg-white p-5 shadow-md">
            <p className="text-sm text-slate-500">Visible Tasks</p>
            <p className="text-3xl font-black text-indigo-600">{totalTasks}</p>
          </div>

          <div className="rounded-3xl border-l-8 border-purple-300 bg-white p-5 shadow-md">
            <p className="text-sm text-slate-500">Waiting Approval</p>
            <p className="text-3xl font-black text-purple-600">
              {waitingApprovalCount}
            </p>
          </div>

          <div className="rounded-3xl border-l-8 border-emerald-300 bg-white p-5 shadow-md">
            <p className="text-sm text-slate-500">Done</p>
            <p className="text-3xl font-black text-emerald-600">{doneCount}</p>
          </div>

          <div className="rounded-3xl border-l-8 border-rose-300 bg-white p-5 shadow-md">
            <p className="text-sm text-slate-500">Overdue</p>
            <p className="text-3xl font-black text-rose-600">{overdueCount}</p>
          </div>

          <div className="rounded-3xl border-l-8 border-cyan-300 bg-white p-5 shadow-md">
            <p className="text-sm text-slate-500">Project Filter</p>
            <p className="line-clamp-1 text-lg font-black text-cyan-600">
              {selectedProjectFromFilter
                ? selectedProjectFromFilter.name
                : "All Projects"}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-slate-100 bg-white/95 p-5 shadow-lg">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
            <input
              className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Search by title, person or creator..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />

            <select
              className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>

            <select
              className="rounded-2xl border border-teal-100 bg-teal-50/60 p-3 text-sm outline-none focus:ring-2 focus:ring-teal-300"
              value={teamFilter}
              onChange={(event) => setTeamFilter(event.target.value)}
            >
              <option value="">All Teams</option>
              {allTeams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>

            <select
              className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-3 text-sm outline-none focus:ring-2 focus:ring-cyan-300"
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={String(project.id)}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              value={viewFilter}
              onChange={(event) => setViewFilter(event.target.value)}
            >
              <option value="all">All Visible Tasks</option>
              <option value="assignedToMe">Assigned To Me</option>
              <option value="createdByMe">Created By Me</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="grid min-w-[1200px] grid-cols-5 gap-5 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn key={column.id} column={column} />
          ))}
        </div>

        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${getPriorityClass(
                        selectedTask.priority || "MEDIUM"
                      )}`}
                    >
                      {selectedTask.priority || "MEDIUM"}
                    </span>

                    <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                      {selectedTask.status || "TODO"}
                    </span>

                    {isOverdue(selectedTask) && (
                      <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-black text-rose-700">
                        Overdue
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-black text-slate-900">
                    {selectedTask.title}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {selectedTask.description || "No description added."}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedTask(null)}
                  className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-indigo-700">
                    Assigned To
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(selectedTask.assignedTo || "-")
                      .split(",")
                      .map((email) => email.trim())
                      .filter(Boolean)
                      .map((email) => (
                        <UserPill key={`popup-assigned-${email}`} email={email} />
                      ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                    Created By
                  </p>
                  <div className="mt-3">
                    {selectedTask.createdBy ? (
                      <UserPill email={selectedTask.createdBy} />
                    ) : (
                      "-"
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-cyan-700">
                    Project
                  </p>
                  <p className="mt-2 font-bold text-slate-700">
                    {getProjectName(selectedTask.projectId)}
                  </p>
                  {getProjectById(selectedTask.projectId)?.githubUrl && (
                    <a
                      href={getProjectById(selectedTask.projectId)?.githubUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-xs font-black text-cyan-700 underline"
                    >
                      🔗 Open GitHub Repository
                    </a>
                  )}
                </div>

                <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-teal-700">
                    Team
                  </p>
                  <p className="mt-2 font-bold text-slate-700">
                    {getTaskTeam(selectedTask)}
                  </p>
                </div>

                <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-violet-700">
                    Due Date / Deadline
                  </p>
                  <p className="mt-2 font-bold text-slate-700">
                    {formatDate(selectedTask.dueDate)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-600">
                    Assignment Type
                  </p>
                  <p className="mt-2 font-bold text-slate-700">
                    {selectedTask.assignmentType || "-"}
                  </p>
                </div>

                {selectedTask.reviewNote && (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 md:col-span-2">
                    <p className="text-xs font-black uppercase tracking-wide text-rose-700">
                      Revision Note
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {selectedTask.reviewNote}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                {selectedTask.projectId && (
                  <button
                    onClick={() => {
                      setSelectedTask(null);
                      setProjectFilter(String(selectedTask.projectId));
                    }}
                    className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-700 hover:bg-cyan-100"
                  >
                    Filter This Project
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedTask(null);
                    router.push("/dashboard");
                  }}
                  className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-700 hover:bg-indigo-100"
                >
                  Open in Dashboard
                </button>

                <button
                  onClick={() => setSelectedTask(null)}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-black"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
