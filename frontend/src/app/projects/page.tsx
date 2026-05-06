// Target file: frontend/src/app/projects/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
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
  description?: string;
  githubUrl?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  memberEmails?: string[];
  createdBy?: string;
};

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
  projectId?: number | null;
};

type User = {
  id: number;
  name?: string;
  surname?: string;
  email: string;
  role?: string;
  department?: string;
};

export default function ProjectsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();

  const currentUserEmail =
    typeof window !== "undefined" ? localStorage.getItem("email") || "" : "";

  const currentUserRole =
    typeof window !== "undefined" ? localStorage.getItem("role") || "" : "";

  const memberDropdownRef = useRef<HTMLDivElement | null>(null);
  const memberInputRef = useRef<HTMLInputElement | null>(null);
  const editMemberDropdownRef = useRef<HTMLDivElement | null>(null);
  const editMemberInputRef = useRef<HTMLInputElement | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [status, setStatus] = useState("Active");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [showMemberSuggestions, setShowMemberSuggestions] = useState(false);
  const [memberDropdownPosition, setMemberDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editGithubUrl, setEditGithubUrl] = useState("");
  const [editStatus, setEditStatus] = useState("Active");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editMemberSearch, setEditMemberSearch] = useState("");
  const [editSelectedMembers, setEditSelectedMembers] = useState<User[]>([]);
  const [editSelectedDepartment, setEditSelectedDepartment] = useState("");
  const [showEditMemberSuggestions, setShowEditMemberSuggestions] =
    useState(false);
  const [editMemberDropdownPosition, setEditMemberDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("ALL");
  const [projectOwnershipFilter, setProjectOwnershipFilter] = useState("ALL");

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects`);
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setMessage("Projects could not be loaded.");
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tasks`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      setTasks([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setMessage("Users could not be loaded.");
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchTasks();
    fetchUsers();
  }, []);

  const updateMemberDropdownPosition = () => {
    if (memberInputRef.current) {
      const rect = memberInputRef.current.getBoundingClientRect();

      setMemberDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  const updateEditMemberDropdownPosition = () => {
    if (editMemberInputRef.current) {
      const rect = editMemberInputRef.current.getBoundingClientRect();

      setEditMemberDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  const openMemberSuggestions = () => {
    updateMemberDropdownPosition();
    setShowMemberSuggestions(true);
  };

  const openEditMemberSuggestions = () => {
    updateEditMemberDropdownPosition();
    setShowEditMemberSuggestions(true);
  };

  useEffect(() => {
    if (!showMemberSuggestions) return;

    const handleOutsideMemberClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (memberInputRef.current?.contains(target)) return;
      if (memberDropdownRef.current?.contains(target)) return;

      setShowMemberSuggestions(false);
    };

    document.addEventListener("mousedown", handleOutsideMemberClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideMemberClick);
    };
  }, [showMemberSuggestions]);

  useEffect(() => {
    if (!showEditMemberSuggestions) return;

    const handleOutsideEditMemberClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (editMemberInputRef.current?.contains(target)) return;
      if (editMemberDropdownRef.current?.contains(target)) return;

      setShowEditMemberSuggestions(false);
    };

    document.addEventListener("mousedown", handleOutsideEditMemberClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideEditMemberClick);
    };
  }, [showEditMemberSuggestions]);

  useEffect(() => {
    if (!showMemberSuggestions) return;

    const handleRepositionMemberDropdown = () => {
      updateMemberDropdownPosition();
    };

    window.addEventListener("scroll", handleRepositionMemberDropdown, true);
    window.addEventListener("resize", handleRepositionMemberDropdown);

    return () => {
      window.removeEventListener("scroll", handleRepositionMemberDropdown, true);
      window.removeEventListener("resize", handleRepositionMemberDropdown);
    };
  }, [showMemberSuggestions]);

  useEffect(() => {
    if (!showEditMemberSuggestions) return;

    const handleRepositionEditMemberDropdown = () => {
      updateEditMemberDropdownPosition();
    };

    window.addEventListener("scroll", handleRepositionEditMemberDropdown, true);
    window.addEventListener("resize", handleRepositionEditMemberDropdown);

    return () => {
      window.removeEventListener("scroll", handleRepositionEditMemberDropdown, true);
      window.removeEventListener("resize", handleRepositionEditMemberDropdown);
    };
  }, [showEditMemberSuggestions]);



  const normalizeSearchText = (value: string) => {
    return value.replace("@", "").toLowerCase().trim();
  };

  const filteredUsers = useMemo(() => {
    const search = normalizeSearchText(memberSearch);

    if (!search) {
      return users
        .filter((user) => {
          const alreadySelected = selectedMembers.some(
            (member) => member.email === user.email,
          );

          return !alreadySelected;
        })
        .slice(0, 8);
    }

    return users
      .filter((user) => {
        const alreadySelected = selectedMembers.some(
          (member) => member.email === user.email,
        );

        if (alreadySelected) return false;

        return (
          user.name?.toLowerCase().includes(search) ||
          user.surname?.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search) ||
          user.role?.toLowerCase().includes(search) ||
          user.department?.toLowerCase().includes(search)
        );
      })
      .slice(0, 6);
  }, [memberSearch, users, selectedMembers]);

  const departments = useMemo(() => {
    return Array.from(
      new Set(users.map((user) => user.department).filter(Boolean)),
    ) as string[];
  }, [users]);

  const filteredEditUsers = useMemo(() => {
    const search = normalizeSearchText(editMemberSearch);

    if (!search) {
      return users
        .filter((user) => {
          const alreadySelected = editSelectedMembers.some(
            (member) => member.email === user.email,
          );

          return !alreadySelected;
        })
        .slice(0, 8);
    }

    return users
      .filter((user) => {
        const alreadySelected = editSelectedMembers.some(
          (member) => member.email === user.email,
        );

        if (alreadySelected) return false;

        return (
          user.name?.toLowerCase().includes(search) ||
          user.surname?.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search) ||
          user.role?.toLowerCase().includes(search) ||
          user.department?.toLowerCase().includes(search)
        );
      })
      .slice(0, 6);
  }, [editMemberSearch, users, editSelectedMembers]);

  const getFinalMemberEmails = (
    directMembers: User[],
    departmentName: string,
  ) => {
    const directEmails = directMembers.map((member) => member.email);

    const departmentEmails = departmentName
      ? users
          .filter((user) => user.department === departmentName)
          .map((user) => user.email)
      : [];

    return Array.from(new Set([...directEmails, ...departmentEmails]));
  };

  const isProjectCreator = (project: Project) => {
    return (
      (project.createdBy || "").toLowerCase() ===
      (currentUserEmail || "").toLowerCase()
    );
  };

  const isProjectAssignedToMe = (project: Project) => {
    return (project.memberEmails || [])
      .map((email) => email.toLowerCase())
      .includes((currentUserEmail || "").toLowerCase());
  };

  const myProjects = projects.filter((project) => isProjectCreator(project));

  const assignedProjects = projects.filter(
    (project) => isProjectAssignedToMe(project) && !isProjectCreator(project),
  );

  const visibleProjects =
    currentUserRole === "ADMIN"
      ? projects
      : projects.filter(
          (project) =>
            isProjectCreator(project) || isProjectAssignedToMe(project),
        );

  const completedAssignedToMeTasks = [...tasks]
    .filter(
      (task) =>
        task.status === "DONE" &&
        (task.assignedTo || "")
          .toLowerCase()
          .includes((currentUserEmail || "").toLowerCase()),
    )
    .sort((a, b) => b.id - a.id);

  const completedCreatedByMeTasks = [...tasks]
    .filter(
      (task) =>
        task.status === "DONE" &&
        (task.createdBy || "").toLowerCase() ===
          (currentUserEmail || "").toLowerCase() &&
        !(task.assignedTo || "")
          .toLowerCase()
          .includes((currentUserEmail || "").toLowerCase()),
    )
    .sort((a, b) => b.id - a.id);

  const filteredVisibleProjects = visibleProjects.filter((project) => {
    const search = projectSearch.toLowerCase().trim();

    const memberText = (project.memberEmails || [])
      .map((email) => `${email} ${getUserFullName(email)}`)
      .join(" ")
      .toLowerCase();

    const taskText = getProjectTasks(project.id)
      .map(
        (task) =>
          `${task.title || ""} ${task.status || ""} ${task.priority || ""}`,
      )
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !search ||
      project.name.toLowerCase().includes(search) ||
      (project.description || "").toLowerCase().includes(search) ||
      (project.githubUrl || "").toLowerCase().includes(search) ||
      memberText.includes(search) ||
      taskText.includes(search);

    const matchesStatus =
      projectStatusFilter === "ALL" ||
      (project.status || "Active") === projectStatusFilter;

    const matchesOwnership =
      projectOwnershipFilter === "ALL" ||
      (projectOwnershipFilter === "CREATED_BY_ME" &&
        isProjectCreator(project)) ||
      (projectOwnershipFilter === "ASSIGNED_TO_ME" &&
        isProjectAssignedToMe(project)) ||
      (projectOwnershipFilter === "OVERDUE" && isProjectOverdue(project));

    return matchesSearch && matchesStatus && matchesOwnership;
  });

  const adminProjects = currentUserRole === "ADMIN" ? projects : [];

  const canEditProject = (project: Project) => {
    return currentUserRole !== "ADMIN" && isProjectCreator(project);
  };

  const canDeleteProject = (project: Project) => {
    return currentUserRole === "ADMIN" || isProjectCreator(project);
  };

  const addMember = (user: User) => {
    setSelectedMembers((prev) => [...prev, user]);
    setMemberSearch("");
    setShowMemberSuggestions(false);
  };

  const removeMember = (email: string) => {
    setSelectedMembers((prev) =>
      prev.filter((member) => member.email !== email),
    );
  };

  const addEditMember = (user: User) => {
    setEditSelectedMembers((prev) => [...prev, user]);
    setEditMemberSearch("");
    setShowEditMemberSuggestions(false);
  };

  const removeEditMember = (email: string) => {
    setEditSelectedMembers((prev) =>
      prev.filter((member) => member.email !== email),
    );
  };

  const createProject = async () => {
    setMessage("");

    if (!name.trim()) {
      setMessage("Please enter a project name.");
      return;
    }

    const finalMemberEmails = getFinalMemberEmails(
      selectedMembers,
      selectedDepartment,
    );

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          githubUrl,
          status,
          startDate: startDate || null,
          endDate: endDate || null,
          memberEmails: finalMemberEmails,
          createdBy: currentUserEmail,
        }),
      });

      if (!res.ok) {
        setMessage("Project could not be created.");
        return;
      }

      setName("");
      setDescription("");
      setGithubUrl("");
      setStatus("Active");
      setStartDate("");
      setEndDate("");
      setSelectedMembers([]);
      setSelectedDepartment("");
      setMemberSearch("");
      setShowMemberSuggestions(false);

      setMessage("Project created successfully.");
      fetchProjects();
    } catch {
      setMessage("Server error while creating project.");
    } finally {
      setLoading(false);
    }
  };

  const startEditProject = (project: Project) => {
    setEditingProject(project);
    setSelectedProject(null);
    setEditName(project.name || "");
    setEditDescription(project.description || "");
    setEditGithubUrl(project.githubUrl || "");
    setEditStatus(project.status || "Active");
    setEditStartDate(project.startDate || "");
    setEditEndDate(project.endDate || "");
    setEditSelectedMembers(
      (project.memberEmails || [])
        .map((email) => getUserByEmail(email))
        .filter(Boolean) as User[],
    );
    setEditSelectedDepartment("");
    setEditMemberSearch("");
    setShowEditMemberSuggestions(false);
  };

  const cancelEditProject = () => {
    setEditingProject(null);
    setEditName("");
    setEditDescription("");
    setEditGithubUrl("");
    setEditStatus("Active");
    setEditStartDate("");
    setEditEndDate("");
    setEditSelectedMembers([]);
    setEditSelectedDepartment("");
    setEditMemberSearch("");
    setShowEditMemberSuggestions(false);
  };

  const updateProject = async () => {
    if (!editingProject) return;

    if (!canEditProject(editingProject)) {
      setMessage("Only the project creator can edit this project.");
      return;
    }

    setMessage("");

    if (!editName.trim()) {
      setMessage("Please enter a project name.");
      return;
    }

    const finalEditMemberEmails = getFinalMemberEmails(
      editSelectedMembers,
      editSelectedDepartment,
    );

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/projects/${editingProject.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editingProject,
          name: editName,
          description: editDescription,
          githubUrl: editGithubUrl,
          status: editStatus,
          startDate: editStartDate || null,
          endDate: editEndDate || null,
          memberEmails: finalEditMemberEmails,
          createdBy: editingProject.createdBy || currentUserEmail,
        }),
      });

      if (!res.ok) {
        setMessage("Project could not be updated.");
        return;
      }

      cancelEditProject();
      setMessage("Project updated successfully.");
      fetchProjects();
    } catch {
      setMessage("Server error while updating project.");
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (project: Project) => {
    if (!canDeleteProject(project)) {
      setMessage("You do not have permission to delete this project.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?`,
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setMessage("Project could not be deleted.");
        return;
      }

      if (selectedProject?.id === project.id) {
        setSelectedProject(null);
      }

      if (editingProject?.id === project.id) {
        cancelEditProject();
      }

      setMessage("Project deleted successfully.");
      fetchProjects();
      fetchTasks();
    } catch {
      setMessage("Server error while deleting project.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-100 text-emerald-700";
      case "In Progress":
        return "bg-blue-100 text-blue-700";
      case "Completed":
        return "bg-slate-200 text-slate-700";
      case "Pending":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatProjectDate = (dateText?: string) => {
    if (!dateText) return "Not set";

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

  function getUserByEmail(email?: string | null) {
    if (!email) return null;

    return users.find(
      (user) => user.email.toLowerCase() === email.trim().toLowerCase(),
    );
  }

  function getUserFullName(email?: string | null) {
    const user = getUserByEmail(email);

    if (!user) return email || "-";

    const fullName = `${user.name || ""} ${user.surname || ""}`.trim();

    return fullName || user.email;
  }

  function getProjectById(projectId?: number | null) {
    if (!projectId) return null;

    return projects.find((project) => project.id === projectId) || null;
  }

  function getProjectTasks(projectId: number) {
    return tasks.filter((task) => task.projectId === projectId);
  }

  function getProjectStats(projectId: number) {
    const projectTasks = getProjectTasks(projectId);

    const total = projectTasks.length;
    const todo = projectTasks.filter((task) => task.status === "TODO").length;
    const inProgress = projectTasks.filter(
      (task) => task.status === "IN_PROGRESS",
    ).length;
    const testing = projectTasks.filter(
      (task) => task.status === "TEST",
    ).length;
    const waitingApproval = projectTasks.filter(
      (task) => task.status === "WAITING_APPROVAL",
    ).length;
    const done = projectTasks.filter((task) => task.status === "DONE").length;

    const progress = total === 0 ? 0 : Math.round((done / total) * 100);

    return {
      total,
      todo,
      inProgress,
      testing,
      waitingApproval,
      done,
      progress,
    };
  }

  function isProjectOverdue(project: Project) {
    if (!project.endDate || project.status === "Completed") return false;

    const today = new Date().toISOString().split("T")[0];

    return project.endDate < today;
  }

  const projectStatusChartData = [
    {
      name: "Active",
      value: filteredVisibleProjects.filter(
        (project) => project.status === "Active",
      ).length,
    },
    {
      name: "In Progress",
      value: filteredVisibleProjects.filter(
        (project) => project.status === "In Progress",
      ).length,
    },
    {
      name: "Pending",
      value: filteredVisibleProjects.filter(
        (project) => project.status === "Pending",
      ).length,
    },
    {
      name: "Completed",
      value: filteredVisibleProjects.filter(
        (project) => project.status === "Completed",
      ).length,
    },
  ];

  const projectTaskChartData = filteredVisibleProjects.map((project) => ({
    name: project.name,
    tasks: getProjectTasks(project.id).length,
  }));

  const projectProgressChartData = filteredVisibleProjects.map((project) => ({
    name: project.name,
    progress: getProjectStats(project.id).progress,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-100 to-cyan-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 p-8 text-white shadow-xl shadow-blue-500/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-4xl font-bold">Projects</h1>
              <p className="mt-2 text-sm text-blue-50">
                Create projects, add team members and manage project-based work.
              </p>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="w-fit rounded-2xl bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
            >
              ← Back to Dashboard
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase text-blue-50">
                Total Projects
              </p>
              <p className="mt-1 text-3xl font-black">
                {filteredVisibleProjects.length}
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase text-blue-50">
                Project Tasks
              </p>
              <p className="mt-1 text-3xl font-black">{tasks.length}</p>
            </div>

            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase text-blue-50">
                Team Members
              </p>
              <p className="mt-1 text-3xl font-black">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-white/60 bg-white/75 p-5 shadow-xl shadow-blue-500/10 backdrop-blur-2xl">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Project Filters
              </h2>
              <p className="text-sm text-slate-500">
                Search and filter projects without losing your project
                management data.
              </p>
            </div>

            {(projectSearch ||
              projectStatusFilter !== "ALL" ||
              projectOwnershipFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setProjectSearch("");
                  setProjectStatusFilter("ALL");
                  setProjectOwnershipFilter("ALL");
                }}
                className="w-fit rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="rounded-2xl border border-white/70 bg-white/85 p-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-200"
              placeholder="Search by project, member, task or GitHub..."
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
            />

            <select
              className="rounded-2xl border border-white/70 bg-blue-50/80 p-3 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-blue-200"
              value={projectStatusFilter}
              onChange={(e) => setProjectStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              className="rounded-2xl border border-white/70 bg-cyan-50/80 p-3 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-cyan-200"
              value={projectOwnershipFilter}
              onChange={(e) => setProjectOwnershipFilter(e.target.value)}
            >
              <option value="ALL">All Visible Projects</option>
              <option value="CREATED_BY_ME">Created by Me</option>
              <option value="ASSIGNED_TO_ME">Assigned to Me</option>
              <option value="OVERDUE">Overdue Projects</option>
            </select>
          </div>

          <p className="mt-3 text-xs font-semibold text-slate-500">
            Showing {filteredVisibleProjects.length} of {visibleProjects.length}{" "}
            visible projects
          </p>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-blue-100 bg-white/75 backdrop-blur-xl p-6 shadow-xl shadow-blue-500/10 shadow-blue-500/10">
            <div className="mb-4">
              <h2 className="text-xl font-black text-slate-800">
                Project Status Overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Overview of visible projects by current status.
              </p>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusChartData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label
                  >
                    {projectStatusChartData.map((entry, index) => (
                      <Cell
                        key={`project-status-${entry.name}`}
                        fill={
                          ["#10b981", "#3b82f6", "#f59e0b", "#64748b"][
                            index % 4
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-100 bg-white/75 backdrop-blur-xl p-6 shadow-xl shadow-blue-500/10 shadow-blue-500/10">
            <div className="mb-4">
              <h2 className="text-xl font-black text-slate-800">
                Tasks per Project
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Jira-like workload chart showing how many tasks each project
                has.
              </p>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectTaskChartData}>
                  <XAxis dataKey="name" hide />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="tasks"
                    name="Tasks"
                    fill="#2563eb"
                    radius={[12, 12, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-indigo-100 bg-white/75 backdrop-blur-xl p-6 shadow-xl shadow-blue-500/10 shadow-blue-500/10 lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-xl font-black text-slate-800">
                Project Progress Comparison
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Completion percentage calculated from DONE tasks inside each
                project.
              </p>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectProgressChartData}>
                  <XAxis dataKey="name" hide />
                  <YAxis allowDecimals={false} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="progress"
                    name="Progress %"
                    fill="#0891b2"
                    radius={[12, 12, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white/75 backdrop-blur-xl p-6 shadow-xl shadow-blue-500/10 shadow-blue-500/10">
          <h2 className="mb-4 text-xl font-bold text-slate-800">
            Create New Project
          </h2>

          <p className="mb-4 text-sm text-slate-500">
            Create a project for selected teammates or assign it to an entire
            department.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <select
              className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Active">Active</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Project Start Date
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Project End Date / Deadline
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <textarea
            className="mt-4 w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder="Project description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            className="mt-4 w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder="GitHub repository link"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />

          <div className="relative mt-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Add Project Members
            </label>

            <input
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Search by name, email, role or department..."
              ref={memberInputRef}
              value={memberSearch}
              onFocus={openMemberSuggestions}
              onChange={(e) => {
                setMemberSearch(e.target.value);
                openMemberSuggestions();
              }}
            />

            {showMemberSuggestions &&
              createPortal(
                <div
                  ref={memberDropdownRef}
                  className="fixed max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-blue-500/15"
                  style={{
                    top: memberDropdownPosition.top,
                    left: memberDropdownPosition.left,
                    width: memberDropdownPosition.width,
                    zIndex: 999999,
                  }}
                >
                  {filteredUsers.length === 0 ? (
                    <div className="px-4 py-4 text-sm font-semibold text-slate-400">
                      No user found.
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                    <button
                      key={user.email}
                      type="button"
                      onClick={() => addMember(user)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-blue-50"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {user.name} {user.surname}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>

                      <div className="text-right text-xs text-slate-500">
                        <p>{user.role || "No role"}</p>
                        <p>{user.department || "No department"}</p>
                      </div>
                    </button>
                  )))}
                </div>,
                document.body
              )}
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Assign Project to Department
            </label>

            <select
              className="w-full rounded-xl border border-cyan-100 bg-cyan-50/60 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="">No department selected</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>

            {selectedDepartment && (
              <p className="mt-2 rounded-xl bg-cyan-50 px-4 py-3 text-xs font-semibold text-cyan-700">
                All users in {selectedDepartment} department will be added to
                this project.
              </p>
            )}
          </div>

          {selectedMembers.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedMembers.map((member) => (
                <span
                  key={member.email}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-2 text-xs font-medium text-blue-700"
                >
                  {member.name} {member.surname}
                  <button
                    type="button"
                    onClick={() => removeMember(member.email)}
                    className="rounded-full bg-blue-200 px-2 text-blue-800 hover:bg-blue-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <button
            onClick={createProject}
            disabled={loading}
            className="mt-5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-xl shadow-blue-500/10 shadow-blue-500/25 transition hover:scale-[1.01] disabled:opacity-60"
          >
            {loading ? "Creating..." : "+ Create Project"}
          </button>

          {message && (
            <p className="mt-4 rounded-xl bg-white/60 px-4 py-3 text-sm text-slate-700">
              {message}
            </p>
          )}
        </div>

        {editingProject && canEditProject(editingProject) && (
          <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50/70 p-6 shadow-xl shadow-blue-500/10 shadow-blue-500/10">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Edit Project
                </h2>
                <p className="text-sm text-slate-500">
                  Update project details without removing its members or linked
                  tasks.
                </p>
              </div>

              <button
                type="button"
                onClick={cancelEditProject}
                className="w-fit rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm hover:bg-white/60"
              >
                Cancel Edit
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                placeholder="Project name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />

              <select
                className="rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Project Start Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Project End Date / Deadline
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                />
              </div>
            </div>

            <textarea
              className="mt-4 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
              placeholder="Project description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />

            <input
              className="mt-4 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
              placeholder="GitHub repository link"
              value={editGithubUrl}
              onChange={(e) => setEditGithubUrl(e.target.value)}
            />

            <div className="relative mt-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Update Project Members
              </label>

              <input
                className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                placeholder="Search by name, email, role or department..."
                ref={editMemberInputRef}
                value={editMemberSearch}
                onFocus={openEditMemberSuggestions}
                onChange={(e) => {
                  setEditMemberSearch(e.target.value);
                  openEditMemberSuggestions();
                }}
              />

              {showEditMemberSuggestions &&
                createPortal(
                  <div
                    ref={editMemberDropdownRef}
                    className="fixed max-h-64 overflow-y-auto rounded-2xl border border-amber-200 bg-white shadow-2xl shadow-blue-500/15"
                    style={{
                      top: editMemberDropdownPosition.top,
                      left: editMemberDropdownPosition.left,
                      width: editMemberDropdownPosition.width,
                      zIndex: 999999,
                    }}
                  >
                    {filteredEditUsers.length === 0 ? (
                      <div className="px-4 py-4 text-sm font-semibold text-slate-400">
                        No user found.
                      </div>
                    ) : (
                      filteredEditUsers.map((user) => (
                      <button
                        key={`edit-${user.email}`}
                        type="button"
                        onClick={() => addEditMember(user)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-amber-50"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">
                            {user.name} {user.surname}
                          </p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>

                        <div className="text-right text-xs text-slate-500">
                          <p>{user.role || "No role"}</p>
                          <p>{user.department || "No department"}</p>
                        </div>
                      </button>
                    )))}
                  </div>,
                  document.body
                )}
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Add Department to Project
              </label>

              <select
                className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                value={editSelectedDepartment}
                onChange={(e) => setEditSelectedDepartment(e.target.value)}
              >
                <option value="">No department selected</option>
                {departments.map((department) => (
                  <option
                    key={`edit-department-${department}`}
                    value={department}
                  >
                    {department}
                  </option>
                ))}
              </select>
            </div>

            {editSelectedMembers.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {editSelectedMembers.map((member) => (
                  <span
                    key={`edit-member-${member.email}`}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-2 text-xs font-medium text-amber-700"
                  >
                    {member.name} {member.surname}
                    <button
                      type="button"
                      onClick={() => removeEditMember(member.email)}
                      className="rounded-full bg-amber-200 px-2 text-amber-800 hover:bg-amber-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={updateProject}
                disabled={loading}
                className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white shadow-xl shadow-blue-500/10 shadow-amber-500/25 transition hover:bg-amber-600 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Project Changes"}
              </button>

              <button
                onClick={cancelEditProject}
                className="rounded-xl bg-white px-6 py-3 font-semibold text-slate-600 shadow-sm transition hover:bg-white/60"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-emerald-100 bg-white/75 p-5 shadow-xl shadow-emerald-500/10 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  Completed Tasks Assigned to Me
                </h2>
                <p className="text-xs text-slate-500">
                  Tasks assigned to me and approved as done.
                </p>
              </div>

              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                {completedAssignedToMeTasks.length}
              </span>
            </div>

            {completedAssignedToMeTasks.length === 0 ? (
              <p className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-700/70">
                No completed assigned tasks yet.
              </p>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {completedAssignedToMeTasks.map((task) => (
                  <button
                    key={`project-assigned-done-${task.id}`}
                    onClick={() => router.push(`/kanban?projectId=${task.projectId || ""}`)}
                    className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-left transition hover:bg-emerald-100"
                  >
                    <p className="text-sm font-black text-slate-800">
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Project: {getProjectById(task.projectId)?.name || "No Project"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Created by {getUserFullName(task.createdBy)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white/75 p-5 shadow-xl shadow-blue-500/10 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  Completed Tasks I Created
                </h2>
                <p className="text-xs text-slate-500">
                  Tasks I created and my team completed.
                </p>
              </div>

              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                {completedCreatedByMeTasks.length}
              </span>
            </div>

            {completedCreatedByMeTasks.length === 0 ? (
              <p className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-700/70">
                No completed tasks created by me yet.
              </p>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {completedCreatedByMeTasks.map((task) => (
                  <button
                    key={`project-created-done-${task.id}`}
                    onClick={() => router.push(`/kanban?projectId=${task.projectId || ""}`)}
                    className="w-full rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-left transition hover:bg-blue-100"
                  >
                    <p className="text-sm font-black text-slate-800">
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Project: {getProjectById(task.projectId)?.name || "No Project"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Assigned to {(task.assignedTo || "-")
                        .split(",")
                        .map((mail) => getUserFullName(mail.trim()))
                        .join(", ")}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-2xl font-bold text-slate-800">
            {currentUserRole === "ADMIN" ? "All Projects" : "Project List"}
          </h2>
          <p className="text-sm text-slate-500">
            {currentUserRole === "ADMIN"
              ? "Admins can view all projects and delete them when needed."
              : "Projects are separated as projects you created and projects assigned to you."}
          </p>
        </div>

        {currentUserRole !== "ADMIN" && (
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5 shadow-sm">
              <p className="text-sm font-bold text-blue-700">My Projects</p>
              <p className="mt-1 text-3xl font-black text-blue-700">
                {myProjects.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Projects created by me.
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-100 bg-cyan-50/70 p-5 shadow-sm">
              <p className="text-sm font-bold text-cyan-700">
                Assigned Projects
              </p>
              <p className="mt-1 text-3xl font-black text-cyan-700">
                {assignedProjects.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Projects where I am a member.
              </p>
            </div>
          </div>
        )}

        {filteredVisibleProjects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-white/70 p-10 text-center shadow-xl backdrop-blur-xl">
            <div className="mb-3 text-5xl">🔎</div>
            <p className="text-lg font-black text-slate-800">
              No projects match these filters
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try changing the search text, status or ownership filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...filteredVisibleProjects]
              .sort((a, b) => b.id - a.id)
              .map((project) => {
                const stats = getProjectStats(project.id);
                const projectOverdue = isProjectOverdue(project);

                return (
                  <div
                    key={project.id}
                    className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/75 backdrop-blur-xl p-6 shadow-xl shadow-blue-500/10 shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl shadow-blue-500/15"
                  >
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/0 to-cyan-400/0 transition group-hover:from-blue-500/10 group-hover:to-cyan-400/10" />

                    <div className="relative z-10">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {project.name}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {project.description || "No description added."}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {currentUserRole !== "ADMIN" && (
                            <span className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-100">
                              {isProjectCreator(project)
                                ? "My Project"
                                : "Assigned"}
                            </span>
                          )}

                          {currentUserRole === "ADMIN" && (
                            <span className="whitespace-nowrap rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                              Admin View
                            </span>
                          )}

                          <span
                            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                              project.status,
                            )}`}
                          >
                            {project.status}
                          </span>

                          {projectOverdue && (
                            <span className="whitespace-nowrap rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 text-sm text-slate-500">
                        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">
                            Project Start Date
                          </p>
                          <p className="mt-1 font-semibold text-slate-700">
                            {formatProjectDate(project.startDate)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-700">
                            Project End Date / Deadline
                          </p>
                          <p className="mt-1 font-semibold text-slate-700">
                            {formatProjectDate(project.endDate)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl border border-slate-100 bg-white/70 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Project Progress
                          </p>
                          <p className="text-sm font-black text-slate-700">
                            {stats.progress}%
                          </p>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 transition-all"
                            style={{ width: `${stats.progress}%` }}
                          />
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="rounded-xl bg-white/75 backdrop-blur-xl p-2">
                            <p className="font-black text-slate-800">
                              {stats.total}
                            </p>
                            <p className="text-slate-400">Total</p>
                          </div>
                          <div className="rounded-xl bg-white/75 backdrop-blur-xl p-2">
                            <p className="font-black text-blue-700">
                              {stats.inProgress + stats.testing}
                            </p>
                            <p className="text-slate-400">Active</p>
                          </div>
                          <div className="rounded-xl bg-white/75 backdrop-blur-xl p-2">
                            <p className="font-black text-emerald-700">
                              {stats.done}
                            </p>
                            <p className="text-slate-400">Done</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5">
                        <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                          Members
                        </p>

                        {project.memberEmails &&
                        project.memberEmails.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {project.memberEmails.map((email) => (
                              <span
                                key={email}
                                className="rounded-full bg-white/60 px-3 py-1 text-xs text-slate-600"
                                title={email}
                              >
                                {getUserFullName(email)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">
                            No members added.
                          </p>
                        )}
                      </div>

                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-black"
                        >
                          🔗 GitHub Repo
                        </a>
                      )}

                      <div className="mt-8 flex items-center justify-between text-sm">
                        <span className="text-slate-500">
                          Project ID: #{project.id}
                        </span>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedProject(project)}
                            className="rounded-xl bg-white/60 px-3 py-1 font-medium text-slate-600 transition hover:bg-slate-200"
                          >
                            Details
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/projects/${project.id}`)
                            }
                            className="rounded-xl bg-cyan-50 px-3 py-1 font-medium text-cyan-600 transition hover:bg-cyan-100"
                          >
                            Page
                          </button>

                          {canEditProject(project) && (
                            <button
                              type="button"
                              onClick={() => startEditProject(project)}
                              className="rounded-xl bg-amber-50 px-3 py-1 font-medium text-amber-600 transition hover:bg-amber-100"
                            >
                              Edit
                            </button>
                          )}

                          {canDeleteProject(project) && (
                            <button
                              type="button"
                              onClick={() => deleteProject(project)}
                              className="rounded-xl bg-rose-50 px-3 py-1 font-medium text-rose-600 transition hover:bg-rose-100"
                            >
                              Delete
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/kanban?projectId=${project.id}`)
                            }
                            className="rounded-xl bg-blue-50 px-3 py-1 font-medium text-blue-600 transition hover:bg-blue-100 group-hover:underline"
                          >
                            Kanban →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl rounded-3xl bg-white/75 backdrop-blur-xl p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                        selectedProject.status,
                      )}`}
                    >
                      {selectedProject.status}
                    </span>

                    {isProjectOverdue(selectedProject) && (
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                        Overdue
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-black text-slate-900">
                    {selectedProject.name}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {selectedProject.description || "No description added."}
                  </p>

                  {selectedProject.githubUrl && (
                    <a
                      href={selectedProject.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-blue-600 underline"
                    >
                      🔗 View GitHub Repository
                    </a>
                  )}
                </div>

                <button
                  onClick={() => setSelectedProject(null)}
                  className="rounded-2xl bg-white/60 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                    Project Start Date
                  </p>
                  <p className="mt-2 font-bold text-slate-700">
                    {formatProjectDate(selectedProject.startDate)}
                  </p>
                </div>

                <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-cyan-700">
                    Project End Date / Deadline
                  </p>
                  <p className="mt-2 font-bold text-slate-700">
                    {formatProjectDate(selectedProject.endDate)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white/70 p-4 md:col-span-2">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Members
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedProject.memberEmails &&
                    selectedProject.memberEmails.length > 0 ? (
                      selectedProject.memberEmails.map((email) => (
                        <span
                          key={`modal-${email}`}
                          className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600"
                          title={email}
                        >
                          {getUserFullName(email)}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">
                        No members added.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 md:col-span-2">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-wide text-indigo-700">
                      Task Summary
                    </p>
                    <p className="text-sm font-black text-indigo-700">
                      {getProjectStats(selectedProject.id).progress}%
                    </p>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500"
                      style={{
                        width: `${getProjectStats(selectedProject.id).progress}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs md:grid-cols-6">
                    <div className="rounded-xl bg-white/75 backdrop-blur-xl p-2">
                      <p className="font-black text-slate-800">
                        {getProjectStats(selectedProject.id).total}
                      </p>
                      <p className="text-slate-400">Total</p>
                    </div>
                    <div className="rounded-xl bg-white/75 backdrop-blur-xl p-2">
                      <p className="font-black text-amber-700">
                        {getProjectStats(selectedProject.id).todo}
                      </p>
                      <p className="text-slate-400">TODO</p>
                    </div>
                    <div className="rounded-xl bg-white/75 backdrop-blur-xl p-2">
                      <p className="font-black text-blue-700">
                        {getProjectStats(selectedProject.id).inProgress}
                      </p>
                      <p className="text-slate-400">Progress</p>
                    </div>
                    <div className="rounded-xl bg-white/75 backdrop-blur-xl p-2">
                      <p className="font-black text-indigo-700">
                        {getProjectStats(selectedProject.id).testing}
                      </p>
                      <p className="text-slate-400">Test</p>
                    </div>
                    <div className="rounded-xl bg-white/75 backdrop-blur-xl p-2">
                      <p className="font-black text-purple-700">
                        {getProjectStats(selectedProject.id).waitingApproval}
                      </p>
                      <p className="text-slate-400">Approval</p>
                    </div>
                    <div className="rounded-xl bg-white/75 backdrop-blur-xl p-2">
                      <p className="font-black text-emerald-700">
                        {getProjectStats(selectedProject.id).done}
                      </p>
                      <p className="text-slate-400">Done</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="rounded-2xl bg-white/60 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
                >
                  Close
                </button>

                {canEditProject(selectedProject) && (
                  <button
                    onClick={() => startEditProject(selectedProject)}
                    className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600"
                  >
                    Edit Project
                  </button>
                )}

                {canDeleteProject(selectedProject) && (
                  <button
                    onClick={() => deleteProject(selectedProject)}
                    className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-bold text-white hover:bg-rose-600"
                  >
                    Delete Project
                  </button>
                )}

                <button
                  onClick={() => router.push(`/projects/${selectedProject.id}`)}
                  className="rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700"
                >
                  Open Project Page
                </button>

                <button
                  onClick={() =>
                    router.push(`/kanban?projectId=${selectedProject.id}`)
                  }
                  className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                >
                  Open Kanban
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
