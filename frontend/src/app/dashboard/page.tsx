"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
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

type Comment = {
  id: number;
  taskId: number;
  authorEmail: string;
  text: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
};

type Notification = {
  id: number;
  receiverEmail: string;
  title: string;
  message: string;
  type: string;
  taskId?: number | null;
  readStatus: boolean;
  createdAt: string;
};

const quotes = [
  "Success is the sum of small efforts, repeated day in and day out. — Robert Collier",
  "Plans are nothing; planning is everything. — Dwight D. Eisenhower",
  "The secret of getting ahead is getting started. — Mark Twain",
  "Quality means doing it right when no one is looking. — Henry Ford",
  "It always seems impossible until it is done. — Nelson Mandela",
  "Great things are done by a series of small things brought together. — Vincent van Gogh",
  "What gets measured gets managed. — Peter Drucker",
];

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState("MEDIUM");
  const [newDueDate, setNewDueDate] = useState("");
  const [newProjectId, setNewProjectId] = useState("");

  const [assignedTo, setAssignedTo] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [assignMode, setAssignMode] = useState<"user" | "team">("user");
  const [assignUserSearch, setAssignUserSearch] = useState("");
  const [showAssignUserSuggestions, setShowAssignUserSuggestions] = useState(false);
  const [assignDropdownPosition, setAssignDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const [teamFilter, setTeamFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const [comments, setComments] = useState<{ [key: number]: Comment[] }>({});
  const [newComment, setNewComment] = useState<{ [key: number]: string }>({});
  const [commentFiles, setCommentFiles] = useState<{
    [key: number]: { fileUrl: string; fileName: string; fileType: string };
  }>({});
  const [mentionSuggestions, setMentionSuggestions] = useState<{
    [key: number]: any[];
  }>({});
  const [showMentionBox, setShowMentionBox] = useState<{
    [key: number]: boolean;
  }>({});
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskStatus, setEditTaskStatus] = useState("TODO");
  const [editTaskPriority, setEditTaskPriority] = useState("MEDIUM");
  const [editTaskDueDate, setEditTaskDueDate] = useState("");

  const [rejectNote, setRejectNote] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [dailyQuote, setDailyQuote] = useState(quotes[0]);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mounted, setMounted] = useState(false);

  const notificationPanelRef = useRef<HTMLDivElement | null>(null);
  const notificationButtonRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileButtonRef = useRef<HTMLDivElement | null>(null);
  const assignUserBoxRef = useRef<HTMLDivElement | null>(null);
  const assignUserInputRef = useRef<HTMLInputElement | null>(null);
  const assignUserDropdownRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();

  const role =
    typeof window !== "undefined" ? localStorage.getItem("role") : "";

  const currentEmail =
    typeof window !== "undefined" ? localStorage.getItem("email") : "";
  useEffect(() => {
    setMounted(true);

    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const randomIndex = Math.floor(Math.random() * quotes.length);
    setDailyQuote(quotes[randomIndex]);

    Promise.all([
      fetchUsers(),
      fetchProjects(),
      fetchTasks(),
      fetchNotifications(),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!showNotifications) return;

    const handleOutsideNotificationClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (notificationPanelRef.current?.contains(target)) return;
      if (notificationButtonRef.current?.contains(target)) return;

      setShowNotifications(false);
    };

    document.addEventListener("mousedown", handleOutsideNotificationClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideNotificationClick);
    };
  }, [showNotifications]);

  useEffect(() => {
    if (!showProfileMenu) return;

    const handleOutsideProfileMenuClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (profileMenuRef.current?.contains(target)) return;
      if (profileButtonRef.current?.contains(target)) return;

      setShowProfileMenu(false);
    };

    document.addEventListener("mousedown", handleOutsideProfileMenuClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideProfileMenuClick);
    };
  }, [showProfileMenu]);

  useEffect(() => {
    if (!showAssignUserSuggestions) return;

    const handleOutsideAssignUserClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (assignUserBoxRef.current?.contains(target)) return;
      if (assignUserDropdownRef.current?.contains(target)) return;

      setShowAssignUserSuggestions(false);
    };

    document.addEventListener("mousedown", handleOutsideAssignUserClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideAssignUserClick);
    };
  }, [showAssignUserSuggestions]);

  useEffect(() => {
    if (!showAssignUserSuggestions) return;

    const handleRepositionAssignDropdown = () => {
      updateAssignUserDropdownPosition();
    };

    window.addEventListener("scroll", handleRepositionAssignDropdown, true);
    window.addEventListener("resize", handleRepositionAssignDropdown);

    return () => {
      window.removeEventListener("scroll", handleRepositionAssignDropdown, true);
      window.removeEventListener("resize", handleRepositionAssignDropdown);
    };
  }, [showAssignUserSuggestions]);

  useEffect(() => {
    tasks.forEach((task) => {
      fetchComments(task.id);
    });
  }, [tasks]);

  const fetchUsers = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`);
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  };

  const fetchProjects = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`);
    const data = await res.json();
    setProjects(Array.isArray(data) ? data : []);
  };

  const fetchTasks = async () => {
    const userEmail = localStorage.getItem("email");
    const userRole = localStorage.getItem("role");

    if (!userEmail) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`);
    const data = await res.json();

    if (!Array.isArray(data)) {
      setTasks([]);
      return;
    }

    if (userRole === "ADMIN") {
      setTasks(data);
      return;
    }

    const visibleTasks = data.filter((task) => {
      const assignedToMe = (task.assignedTo || "").includes(userEmail);
      const createdByMe = task.createdBy === userEmail;

      return assignedToMe || createdByMe;
    });

    setTasks(visibleTasks);
  };

  const fetchComments = async (taskId: number) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/comments/task/${taskId}`,
    );

    const data = await res.json();

    setComments((prev) => ({
      ...prev,
      [taskId]: Array.isArray(data) ? data : [],
    }));
  };

  const fetchNotifications = async () => {
    const userEmail = localStorage.getItem("email");

    if (!userEmail) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${encodeURIComponent(
        userEmail,
      )}`,
    );

    const data = await res.json();
    setNotifications(Array.isArray(data) ? data : []);
  };

  const markNotificationAsRead = async (id: number) => {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}/read`,
      {
        method: "PUT",
      },
    );

    fetchNotifications();
  };

  const markAllNotificationsAsRead = async () => {
    const userEmail = localStorage.getItem("email");

    if (!userEmail) return;

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read-all/${encodeURIComponent(
        userEmail,
      )}`,
      {
        method: "PUT",
      },
    );

    fetchNotifications();
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markNotificationAsRead(notification.id);
    setShowNotifications(false);

    if (notification.type === "MESSAGE") {
      router.push("/dashboard/messages");
      return;
    }

    if (
      notification.type === "REQUEST_CREATED" ||
      notification.type === "REQUEST_APPROVED" ||
      notification.type === "REQUEST_REJECTED" ||
      notification.type === "PROJECT_REQUEST" ||
      notification.type === "KANBAN_REQUEST"
    ) {
      router.push("/dashboard/requests");
      return;
    }

    if (
      notification.type === "PROJECT" ||
      notification.type === "PROJECT_ASSIGNED" ||
      notification.type === "PROJECT_UPDATED" ||
      notification.type === "PROJECT_DELETED"
    ) {
      router.push("/projects");
      return;
    }

    if (notification.type === "COMMENT_MENTION") {
      router.push("/dashboard");

      setTimeout(() => {
        if (notification.taskId) {
          const element = document.getElementById(
            `task-${notification.taskId}`,
          );

          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }, 300);

      return;
    }

    if (notification.type === "DEADLINE") {
      router.push("/dashboard");

      setTimeout(() => {
        if (notification.taskId) {
          const element = document.getElementById(
            `task-${notification.taskId}`,
          );

          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }, 300);

      return;
    }

    if (notification.type?.includes("TASK")) {
      router.push("/dashboard");

      setTimeout(() => {
        if (notification.taskId) {
          const element = document.getElementById(
            `task-${notification.taskId}`,
          );

          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }, 300);

      return;
    }

    router.push("/dashboard");
  };
  const getUserByEmail = (email?: string | null) => {
    if (!email) return null;

    return users.find(
      (u) => (u.email || "").toLowerCase() === email.trim().toLowerCase(),
    );
  };

  const getUserFullName = (email?: string | null) => {
    const user = getUserByEmail(email);

    if (!user) return email || "-";

    const fullName = `${user.name || ""} ${user.surname || ""}`.trim();

    return fullName || user.email || "-";
  };

  const getProjectById = (projectId?: number | null) => {
    if (!projectId) return null;

    return projects.find((project) => project.id === projectId) || null;
  };

  const getProjectName = (projectId?: number | null) => {
    if (!projectId) return "No Project";

    const project = getProjectById(projectId);

    return project?.name || `Project #${projectId}`;
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

  const getProfileImage = (user: any) => {
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

  const formatNotificationDate = (dateText?: string) => {
    if (!dateText) return "";

    const date = new Date(dateText);

    if (Number.isNaN(date.getTime())) {
      return dateText;
    }

    return date.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.readStatus,
  ).length;

  const getNotificationVisual = (type?: string) => {
    if (!type) {
      return {
        icon: "🔔",
        label: "General",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
      };
    }

    if (type.includes("PROJECT")) {
      return {
        icon: "📁",
        label: "Project",
        badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-100",
      };
    }

    if (type.includes("REQUEST")) {
      return {
        icon: "📝",
        label: "Request",
        badgeClass: "bg-violet-50 text-violet-700 border-violet-100",
      };
    }

    if (type.includes("TASK") || type === "DEADLINE") {
      return {
        icon: type === "DEADLINE" ? "⏰" : "✅",
        label: type === "DEADLINE" ? "Deadline" : "Task",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-100",
      };
    }

    if (type === "MESSAGE") {
      return {
        icon: "💬",
        label: "Message",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-100",
      };
    }

    if (type === "COMMENT_MENTION") {
      return {
        icon: "@",
        label: "Mention",
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-100",
      };
    }

    return {
      icon: "🔔",
      label: type,
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    };
  };

  const logout = () => {
    localStorage.clear();
    router.replace("/login");
  };

  const goToProfile = (email?: string | null) => {
    if (!email) return;

    const cleanEmail = email.trim();

    if (!cleanEmail || cleanEmail === "-") return;

    router.push(`/dashboard/profile/${encodeURIComponent(cleanEmail)}`);
  };
  const UserHoverCard = ({ email }: { email?: string | null }) => {
    if (!email) return <span>-</span>;

    const cleanEmail = email.trim();
    const user = getUserByEmail(cleanEmail);

    if (!cleanEmail || cleanEmail === "-") return <span>-</span>;

    return (
      <span className="relative inline-block group mr-2 mb-1">
        <button
          onClick={() => goToProfile(cleanEmail)}
          className="inline-flex items-center gap-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full text-xs font-bold shadow-sm transition"
        >
          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black overflow-hidden">
            {getProfileImage(user) ? (
              <img
                src={getProfileImage(user)}
                alt={getUserFullName(cleanEmail)}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(cleanEmail)
            )}
          </span>

          {getUserFullName(cleanEmail)}
        </button>

        <div className="pointer-events-none absolute left-0 top-9 z-30 hidden w-72 rounded-2xl border border-blue-100 bg-white p-4 text-left shadow-xl group-hover:block">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black overflow-hidden">
              {getProfileImage(user) ? (
                <img
                  src={getProfileImage(user)}
                  alt={getUserFullName(cleanEmail)}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(cleanEmail)
              )}
            </div>

            <div>
              <p className="font-black text-blue-950">
                {getUserFullName(cleanEmail)}
              </p>
              <p className="text-[11px] text-indigo-600 font-bold">
                {user?.role || "-"}
              </p>
            </div>
          </div>

          <p className="mt-2 text-xs text-blue-700/70">
            <span className="font-bold text-blue-900">Mail:</span>{" "}
            {user?.email || cleanEmail}
          </p>

          <p className="mt-1 text-xs text-blue-700/70">
            <span className="font-bold text-blue-900">Department:</span>{" "}
            {user?.department || "-"}
          </p>

          <p className="mt-1 text-xs text-blue-700/70">
            <span className="font-bold text-blue-900">Role:</span>{" "}
            {user?.role || "-"}
          </p>
        </div>
      </span>
    );
  };
  const CurrentUserProfileBox = () => {
    const user = getUserByEmail(currentEmail);

    const profileAndNotificationButtons = (
      <div
        className="fixed right-10 top-5 flex items-center gap-3"
        style={{ zIndex: 40 }}
      >
        <div className="relative" ref={notificationButtonRef}>
          <button
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowProfileMenu(false);
              fetchNotifications();
            }}
            className="w-11 h-11 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 shadow-sm flex items-center justify-center text-xl transition"
            title="Notifications"
          >
            🔔
          </button>

          {unreadNotificationCount > 0 && (
            <span
              className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black min-w-5 h-5 px-1 rounded-full flex items-center justify-center"
              style={{ zIndex: 45 }}
            >
              {unreadNotificationCount}
            </span>
          )}
        </div>

        <div className="relative" ref={profileButtonRef}>
          <button
            onClick={() => {
              setShowProfileMenu((prev) => !prev);
              setShowNotifications(false);
            }}
            className="group relative w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black shadow-md border-4 border-white overflow-hidden hover:scale-105 transition"
            title="Profile menu"
          >
            {getProfileImage(user) ? (
              <img
                src={getProfileImage(user)}
                alt={getUserFullName(currentEmail)}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(currentEmail)
            )}
          </button>
        </div>
      </div>
    );

    const notificationPanel = showNotifications ? (
      <div
        ref={notificationPanelRef}
        className="fixed right-10 top-24 w-[calc(100vw-3rem)] max-w-96 bg-white/95 backdrop-blur-xl border border-blue-100 rounded-3xl shadow-2xl p-4"
        style={{ zIndex: 70 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-black text-blue-950">Notifications</p>
            <p className="text-xs text-blue-700/50">
              {unreadNotificationCount} unread notification
            </p>
          </div>

          <button
            onClick={() => setShowNotifications(false)}
            className="text-xs text-blue-700/50 hover:text-blue-900 font-bold"
          >
            Close
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
            <p className="text-sm font-bold text-blue-800">
              No notifications yet
            </p>
            <p className="text-xs text-blue-700/50 mt-1">
              Important task updates will appear here.
            </p>
          </div>
        ) : (
          <div>
            <button
              onClick={markAllNotificationsAsRead}
              className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl text-xs font-bold mb-3"
            >
              Mark all as read
            </button>

            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
              {notifications.map((notification) => {
                const visual = getNotificationVisual(notification.type);

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-3 rounded-2xl border transition hover:scale-[1.01] ${
                      notification.readStatus
                        ? "bg-white border-blue-100"
                        : "bg-indigo-50 border-indigo-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`mb-2 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black ${visual.badgeClass}`}
                        >
                          <span>{visual.icon}</span>
                          {visual.label}
                        </span>

                        <p className="text-sm font-black text-blue-950">
                          {notification.title}
                        </p>
                      </div>

                      {!notification.readStatus && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1"></span>
                      )}
                    </div>

                    <p className="text-xs text-blue-700/70 mt-1">
                      {notification.message}
                    </p>

                    <p className="text-[10px] text-blue-700/50 mt-2">
                      {formatNotificationDate(notification.createdAt)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    ) : null;

    const profileMenu = showProfileMenu ? (
      <div
        ref={profileMenuRef}
        className="fixed right-10 top-24 w-56 bg-white border border-blue-100 rounded-3xl shadow-2xl p-3"
        style={{ zIndex: 70 }}
      >
        <button
          onClick={() => {
            setShowProfileMenu(false);
            router.push("/dashboard/profile");
          }}
          className="w-full text-left px-4 py-3 rounded-2xl hover:bg-indigo-50 text-sm font-bold text-blue-900"
        >
          👤 View Profile
        </button>

        <button
          onClick={logout}
          className="w-full text-left px-4 py-3 rounded-2xl hover:bg-rose-50 text-sm font-bold text-rose-600"
        >
          🚪 Logout
        </button>
      </div>
    ) : null;

    if (!mounted) return null;

    return createPortal(
      <>
        {profileAndNotificationButtons}
        {notificationPanel}
        {profileMenu}
      </>,
      document.body,
    );
  };

  const handleCommentFileChange = (taskId: number, file?: File | null) => {
    if (!file) return;

    const MAX_FILE_SIZE = 500 * 1024;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File must be smaller than 500 KB");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setCommentFiles((prev) => ({
        ...prev,
        [taskId]: {
          fileUrl: String(reader.result || ""),
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
        },
      }));
    };

    reader.readAsDataURL(file);
  };

  const clearCommentFile = (taskId: number) => {
    setCommentFiles((prev) => {
      const copy = { ...prev };
      delete copy[taskId];
      return copy;
    });
  };

  const handleCommentTextChange = (taskId: number, value: string) => {
    setNewComment((prev) => ({
      ...prev,
      [taskId]: value,
    }));

    const words = value.split(/\s+/);
    const lastWord = words[words.length - 1] || "";

    if (lastWord.startsWith("@")) {
      const search = lastWord.substring(1).toLowerCase();

      const filteredUsers = users
        .filter((u) => {
          const fullName = `${u.name || ""} ${u.surname || ""}`.trim();
          const searchable = `${fullName} ${u.email || ""}`.toLowerCase();

          return (
            u.email !== currentEmail && fullName && searchable.includes(search)
          );
        })
        .slice(0, 6);

      setMentionSuggestions((prev) => ({
        ...prev,
        [taskId]: filteredUsers,
      }));

      setShowMentionBox((prev) => ({
        ...prev,
        [taskId]: filteredUsers.length > 0,
      }));
    } else {
      setShowMentionBox((prev) => ({
        ...prev,
        [taskId]: false,
      }));
    }
  };

  const selectMentionUser = (taskId: number, user: any) => {
    const currentText = newComment[taskId] || "";
    const parts = currentText.split(" ");
    const fullName = `${user.name || ""} ${user.surname || ""}`.trim();

    parts[parts.length - 1] = `@${fullName}`;

    setNewComment((prev) => ({
      ...prev,
      [taskId]: parts.join(" ") + " ",
    }));

    setShowMentionBox((prev) => ({
      ...prev,
      [taskId]: false,
    }));
  };

  const renderCommentTextWithMentions = (text?: string | null) => {
    if (!text) return null;

    const tokens = text.split(/(@[^\s]+(?:\s+[A-ZÇĞİÖŞÜa-zçğıöşü][^\s@]*)?)/g);

    return tokens.map((token, index) => {
      if (token.startsWith("@")) {
        return (
          <span
            key={`${token}-${index}`}
            className="inline-flex items-center bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black"
          >
            {token}
          </span>
        );
      }

      return <span key={`${token}-${index}`}>{token}</span>;
    });
  };

  const addComment = async (taskId: number) => {
    const text = newComment[taskId];
    const selectedFile = commentFiles[taskId];

    if ((!text || !text.trim()) && !selectedFile) {
      toast.error("Comment or attachment is required");
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId,
        text: text || "",
        authorEmail: localStorage.getItem("email"),
        fileUrl: selectedFile?.fileUrl || null,
        fileName: selectedFile?.fileName || null,
        fileType: selectedFile?.fileType || null,
      }),
    });

    if (!res.ok) {
      toast.error("Comment could not be added");
      return;
    }

    setNewComment((prev) => ({
      ...prev,
      [taskId]: "",
    }));

    clearCommentFile(taskId);
    fetchComments(taskId);
    toast.success("Comment added");
  };

  const updateComment = async (comment: Comment) => {
    if (!editingCommentText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/comments/${comment.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...comment,
          text: editingCommentText,
          fileUrl: comment.fileUrl || null,
          fileName: comment.fileName || null,
          fileType: comment.fileType || null,
        }),
      },
    );

    if (!res.ok) {
      toast.error("Comment could not be updated");
      return;
    }

    setEditingCommentId(null);
    setEditingCommentText("");
    fetchComments(comment.taskId);
    toast.success("Comment updated");
  };

  const deleteComment = async (comment: Comment) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/comments/${comment.id}?userEmail=${encodeURIComponent(
        currentEmail || "",
      )}`,
      {
        method: "DELETE",
      },
    );

    if (!res.ok) {
      toast.error("Comment could not be deleted");
      return;
    }

    fetchComments(comment.taskId);
    toast.success("Comment deleted");
  };
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

  const teams = Array.from(
    new Set([
      ...defaultTeams,
      ...users.map((u) => u.department).filter(Boolean),
    ]),
  );

  const currentUser = users.find(
    (u) => (u.email || "").toLowerCase() === (currentEmail || "").toLowerCase()
  );

  const currentUserDepartment = currentUser?.department || "";

  const updateAssignUserDropdownPosition = () => {
    if (assignUserInputRef.current) {
      const rect = assignUserInputRef.current.getBoundingClientRect();

      setAssignDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  const openAssignUserSuggestions = () => {
    updateAssignUserDropdownPosition();
    setShowAssignUserSuggestions(true);
  };

  const usersBySelectedTeam = users.filter((u) => {
    if (role === "ADMIN") {
      if (!selectedTeam) return true;
      return u.department === selectedTeam;
    }

    if (role === "MANAGER") {
      return u.department === currentUserDepartment;
    }

    if (!selectedTeam) return true;
    return u.department === selectedTeam;
  });

  const normalizeAssignSearch = (value: string) => {
    return value.toLowerCase().trim();
  };

  const filteredAssignUsers = usersBySelectedTeam
    .filter((u) => {
      const search = normalizeAssignSearch(assignUserSearch);

      if (!search) return true;

      const fullText = `${u.name || ""} ${u.surname || ""} ${u.email || ""} ${
        u.role || ""
      } ${u.department || ""}`.toLowerCase();

      return fullText.includes(search);
    })
    .slice(0, 10);

  const selectedAssignedUser = assignedTo
    ? users.find((u) => u.email === assignedTo)
    : null;

  const today = new Date().toISOString().split("T")[0];

  const filteredTasks = tasks.filter((task) => {
    const assignedUser = getUserByEmail(task.assignedTo);
    const taskTeam = task.teamName || assignedUser?.department;

    const assignedNames = (task.assignedTo || "")
      .split(",")
      .map((email) => getUserFullName(email.trim()))
      .join(" ");

    const matchesTeam = !teamFilter || taskTeam === teamFilter;
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesProject =
      !projectFilter || String(task.projectId || "") === projectFilter;
    const matchesSearch =
      !searchText ||
      task.title.toLowerCase().includes(searchText.toLowerCase()) ||
      (task.assignedTo || "")
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      (task.createdBy || "").toLowerCase().includes(searchText.toLowerCase()) ||
      assignedNames.toLowerCase().includes(searchText.toLowerCase()) ||
      getUserFullName(task.createdBy)
        .toLowerCase()
        .includes(searchText.toLowerCase());

    return matchesTeam && matchesStatus && matchesProject && matchesSearch;
  });

  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(
    (task) => task.status === "DONE",
  ).length;
  const inProgressTasks = filteredTasks.filter(
    (task) => task.status === "IN_PROGRESS",
  ).length;
  const testingTasks = filteredTasks.filter(
    (task) => task.status === "TEST",
  ).length;
  const waitingApprovalTasks = filteredTasks.filter(
    (task) => task.status === "WAITING_APPROVAL",
  ).length;
  const overdueTasks = filteredTasks.filter(
    (task) => task.dueDate && task.dueDate < today && task.status !== "DONE",
  ).length;

  const taskStatusChartData = [
    {
      name: "TODO",
      value: filteredTasks.filter((task) => (task.status || "TODO") === "TODO")
        .length,
    },
    {
      name: "IN_PROGRESS",
      value: filteredTasks.filter((task) => task.status === "IN_PROGRESS")
        .length,
    },
    {
      name: "TEST",
      value: filteredTasks.filter((task) => task.status === "TEST").length,
    },
    {
      name: "WAITING_APPROVAL",
      value: filteredTasks.filter((task) => task.status === "WAITING_APPROVAL")
        .length,
    },
    {
      name: "DONE",
      value: filteredTasks.filter((task) => task.status === "DONE").length,
    },
  ];

  const taskPriorityChartData = [
    {
      name: "LOW",
      value: filteredTasks.filter(
        (task) => (task.priority || "MEDIUM") === "LOW",
      ).length,
    },
    {
      name: "MEDIUM",
      value: filteredTasks.filter(
        (task) => (task.priority || "MEDIUM") === "MEDIUM",
      ).length,
    },
    {
      name: "HIGH",
      value: filteredTasks.filter((task) => task.priority === "HIGH").length,
    },
    {
      name: "URGENT",
      value: filteredTasks.filter((task) => task.priority === "URGENT").length,
    },
  ];

  const completedAssignedToMeTasks = [...tasks]
    .filter(
      (task) =>
        task.status === "DONE" &&
        (task.assignedTo || "").includes(currentEmail || ""),
    )
    .sort((a, b) => b.id - a.id);

  const completedCreatedByMeTasks = [...tasks]
    .filter(
      (task) =>
        task.status === "DONE" &&
        task.createdBy === currentEmail &&
        !(task.assignedTo || "").includes(currentEmail || ""),
    )
    .sort((a, b) => b.id - a.id);

  const addTask = async () => {
    const userRole = localStorage.getItem("role");
    const userEmail = localStorage.getItem("email");

    if (!newTask.trim()) {
      toast.error("Task title cannot be empty");
      return;
    }

    if (
      (userRole === "ADMIN" || userRole === "MANAGER") &&
      assignMode === "team" &&
      !selectedTeam
    ) {
      toast.error("Please select a team");
      return;
    }

    if (
      (userRole === "ADMIN" || userRole === "MANAGER") &&
      assignMode === "user" &&
      !assignedTo
    ) {
      toast.error("Please select a user");
      return;
    }
    if (
      (userRole === "ADMIN" || userRole === "MANAGER") &&
      assignMode === "team"
    ) {
      const teamUsers = users.filter((u) => u.department === selectedTeam);

      if (teamUsers.length === 0) {
        toast.error("No users found in this team");
        return;
      }

      const assignedEmails = teamUsers.map((u) => u.email).join(", ");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTask,
          description: "",
          assignedTo: assignedEmails,
          status: "TODO",
          createdBy: userEmail,
          assignmentType: "TEAM",
          teamName: role === "MANAGER" && !selectedTeam ? currentUserDepartment : selectedTeam,
          priority: newPriority,
          dueDate: newDueDate,
          projectId: newProjectId ? Number(newProjectId) : null,
        }),
      });

      if (!res.ok) {
        toast.error("Task could not be created");
        return;
      }

      setNewTask("");
      setNewPriority("MEDIUM");
      setNewDueDate("");
      setNewProjectId("");
      setAssignedTo("");
      setAssignUserSearch("");
      setShowAssignUserSuggestions(false);
      setSelectedTeam("");
      fetchTasks();
      fetchNotifications();
      toast.success("Task assigned to team 🎉");
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTask,
        description: "",
        assignedTo:
          userRole === "ADMIN" || userRole === "MANAGER"
            ? assignedTo
            : userEmail,
        status: "TODO",
        createdBy: userEmail,
        assignmentType: "USER",
        teamName: role === "MANAGER" && !selectedTeam ? currentUserDepartment : selectedTeam,
        priority: newPriority,
        dueDate: newDueDate,
        projectId: newProjectId ? Number(newProjectId) : null,
      }),
    });

    if (!res.ok) {
      toast.error("Task could not be created");
      return;
    }

    setNewTask("");
    setNewPriority("MEDIUM");
    setNewDueDate("");
    setAssignedTo("");
    setAssignUserSearch("");
    setShowAssignUserSuggestions(false);
    setSelectedTeam("");
    fetchTasks();
    fetchNotifications();
    toast.success("Task created 🎉");
  };

  const updateStatus = async (taskId: number, status: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}/status?status=${status}&userEmail=${encodeURIComponent(
        currentEmail || "",
      )}`,
      {
        method: "PUT",
      },
    );

    if (!res.ok) {
      toast.error("Status could not be updated");
      return;
    }

    fetchTasks();
    fetchNotifications();

    if (status === "DONE") {
      toast.success("Task submitted for approval");
    } else {
      toast.success("Status updated");
    }
  };

  const approveTask = async (taskId: number) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}/approve?reviewerEmail=${encodeURIComponent(
        currentEmail || "",
      )}`,
      {
        method: "PUT",
      },
    );

    if (!res.ok) {
      toast.error("Task could not be approved");
      return;
    }

    fetchTasks();
    fetchNotifications();
    toast.success("Task approved");
  };

  const rejectTask = async (taskId: number) => {
    const note = rejectNote[taskId];

    if (!note || !note.trim()) {
      toast.error("Please write a revision note");
      return;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}/reject?reviewerEmail=${encodeURIComponent(
        currentEmail || "",
      )}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(note.trim()),
      },
    );

    if (!res.ok) {
      toast.error("Task could not be sent back");
      return;
    }

    setRejectNote((prev) => ({
      ...prev,
      [taskId]: "",
    }));

    fetchTasks();
    fetchNotifications();
    toast.success("Revision requested");
  };
  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title || "");
    setEditTaskDescription(task.description || "");
    setEditTaskStatus(task.status || "TODO");
    setEditTaskPriority(task.priority || "MEDIUM");
    setEditTaskDueDate(task.dueDate || "");
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditTaskTitle("");
    setEditTaskDescription("");
    setEditTaskStatus("TODO");
    setEditTaskPriority("MEDIUM");
    setEditTaskDueDate("");
  };

  const updateTaskFull = async (task: Task) => {
    const isCreator = task.createdBy === currentEmail;

    if (editTaskStatus === "DONE" && !isCreator) {
      toast.error("Only the task creator can mark this task as done");
      return;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${task.id}?userEmail=${encodeURIComponent(
        currentEmail || "",
      )}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...task,
          title: editTaskTitle,
          description: editTaskDescription,
          status: editTaskStatus === "DONE" ? task.status : editTaskStatus,
          priority: editTaskPriority,
          dueDate: editTaskDueDate,
        }),
      },
    );

    if (!res.ok) {
      toast.error("Task could not be updated");
      return;
    }

    if (editTaskStatus === "DONE" && isCreator) {
      await updateStatus(task.id, "DONE");
      cancelEditTask();
      return;
    }

    cancelEditTask();
    fetchTasks();
    fetchNotifications();
    toast.success("Task updated");
  };

  const deleteTask = async (task: Task) => {
    if (role !== "ADMIN" && task.createdBy !== currentEmail) {
      toast.error("Only creator or admin can delete this task");
      return;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${task.id}?userEmail=${encodeURIComponent(
        currentEmail || "",
      )}`,
      {
        method: "DELETE",
      },
    );

    if (!res.ok) {
      toast.error("Task could not be deleted");
      return;
    }

    fetchTasks();
    fetchNotifications();
    toast.success("Task deleted");
  };

  const getStatusClass = (status?: string | null) => {
    if (status === "DONE")
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "WAITING_APPROVAL")
      return "bg-purple-50 text-purple-700 border-purple-200";
    if (status === "IN_PROGRESS")
      return "bg-blue-50 text-blue-700 border-blue-200";
    if (status === "TEST")
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  const getPriorityClass = (priority?: string | null) => {
    if (priority === "URGENT")
      return "bg-rose-50 text-rose-700 border-rose-200";
    if (priority === "HIGH")
      return "bg-orange-50 text-orange-700 border-orange-200";
    if (priority === "MEDIUM")
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-teal-50 text-teal-700 border-teal-200";
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-blue-100 to-cyan-100">
        <div className="bg-white/80 backdrop-blur-2xl px-8 py-5 rounded-3xl shadow-2xl border border-white/60">
          <p className="text-lg font-bold animate-pulse text-blue-800">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-sky-100 via-blue-100 to-cyan-100 p-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-300/35 blur-3xl" />
        <div className="absolute right-[-8rem] top-20 h-[28rem] w-[28rem] rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-indigo-300/25 blur-3xl" />
        <div className="absolute left-16 top-40 hidden w-64 rotate-[-8deg] rounded-3xl border border-white/50 bg-white/35 p-4 shadow-2xl backdrop-blur-xl lg:block">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-black text-blue-700">
              Sprint Board
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">
              Live
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["Todo", "Doing", "Done"].map((item) => (
              <div key={item} className="rounded-2xl bg-white/45 p-2">
                <p className="mb-2 text-[10px] font-black text-slate-500">
                  {item}
                </p>
                <div className="space-y-2">
                  <div className="h-7 rounded-xl bg-blue-200/70" />
                  <div className="h-5 rounded-xl bg-cyan-200/70" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute right-20 bottom-24 hidden w-72 rotate-[6deg] rounded-3xl border border-white/50 bg-white/35 p-5 shadow-2xl backdrop-blur-xl xl:block">
          <p className="text-xs font-black text-slate-500">Project progress</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-3xl font-black text-blue-700">76%</p>
            <p className="text-xs font-bold text-cyan-700">On track</p>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white/70">
            <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
          </div>
        </div>
      </div>
      <div className="relative z-10 w-full max-w-[1600px] mx-auto">
        <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/75 p-6 mb-6 min-h-[230px] shadow-2xl backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-400/10 to-indigo-500/10" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-cyan-300/35 blur-3xl" />
          <CurrentUserProfileBox />

          <div className="pr-44">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold mb-3 border border-blue-100">
              Project Management Workspace
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-blue-950">
              Task Dashboard
            </h1>

            <p className="text-sm text-blue-700/70 mt-3 max-w-3xl italic">
              “{dailyQuote}”
            </p>

            <div className="flex gap-2 flex-wrap mt-10">
              <button
                onClick={() => router.push("/dashboard/messages")}
                className="bg-white/70 hover:bg-white text-blue-700 px-4 py-2 rounded-2xl font-semibold shadow-sm border border-white/60 backdrop-blur"
              >
                💬 Messages
              </button>

              <button
                onClick={() => router.push("/dashboard/requests")}
                className="bg-violet-100/75 hover:bg-violet-100 text-violet-700 px-4 py-2 rounded-2xl font-semibold shadow-sm border border-white/60 backdrop-blur"
              >
                📝 Requests
              </button>

              <button
                onClick={() => router.push("/projects")}
                className="bg-cyan-100/75 hover:bg-cyan-100 text-cyan-700 px-4 py-2 rounded-2xl font-semibold shadow-sm border border-white/60 backdrop-blur"
              >
                📁 Projects
              </button>

              <button
                onClick={() => router.push("/kanban")}
                className="bg-emerald-100/75 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-2xl font-semibold shadow-sm border border-white/60 backdrop-blur"
              >
                🧩 Kanban Board
              </button>

              {role === "ADMIN" && (
                <button
                  onClick={() => router.push("/admin")}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-[1.02] text-white px-4 py-2 rounded-2xl font-semibold shadow-lg shadow-blue-500/20 transition"
                >
                  🛠 Role Update
                </button>
              )}
            </div>
          </div>
        </div>

        {(role === "ADMIN" || role === "MANAGER") && (
          <div className="bg-white/75 backdrop-blur-2xl p-6 rounded-3xl shadow-xl mb-6 space-y-4 border border-white/60">
            <div>
              <h2 className="font-black text-xl text-blue-950 lg:pr-80">
                Create and Assign Task
              </h2>
              <p className="text-xs text-blue-700/70">
                Create work items and assign them to people or teams.
              </p>
            </div>

            <input
              className="border border-white/70 bg-white/80 p-3 w-full rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-300"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Task title"
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-black text-blue-800 mb-1 ml-1">
                  Priority
                </label>
                <select
                  className="border border-white/70 bg-amber-50/80 p-3 w-full rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-amber-200"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-blue-800 mb-1 ml-1">
                  Due Date / Deadline
                </label>
                <input
                  type="date"
                  className="border border-white/70 bg-blue-50/80 p-3 w-full rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-200"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-blue-800 mb-1 ml-1">
                  Project
                </label>
                <select
                  className="border border-white/70 bg-cyan-50/80 p-3 w-full rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-cyan-200"
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                >
                  <option value="">No Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={String(project.id)}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-blue-800 mb-1 ml-1">
                  Assignment Type
                </label>
                <select
                  className="border border-white/70 bg-indigo-50/80 p-3 w-full rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-200"
                  value={assignMode}
                  onChange={(e) => {
                    setAssignMode(e.target.value as "user" | "team");
                    setAssignedTo("");
                    setAssignUserSearch("");
                    setShowAssignUserSuggestions(false);
                  }}
                >
                  <option value="user">Assign to User</option>
                  <option value="team">Assign to Team</option>
                </select>
              </div>
            </div>

            <select
              className="border border-white/70 bg-teal-50/80 p-3 w-full rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-teal-200"
              value={selectedTeam}
              onChange={(e) => {
                setSelectedTeam(e.target.value);
                setAssignedTo("");
                setAssignUserSearch("");
                setShowAssignUserSuggestions(false);
              }}
            >
              <option value="">
                {role === "ADMIN" ? "All departments / optional for user assignment" : "Your department users only"}
              </option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>

            {assignMode === "user" && (
              <div ref={assignUserBoxRef} className="relative">
                <input
                  ref={assignUserInputRef}
                  className="border border-white/70 bg-blue-50/80 p-3 w-full rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-200"
                  value={assignUserSearch}
                  onFocus={openAssignUserSuggestions}
                  onChange={(e) => {
                    setAssignUserSearch(e.target.value);
                    setAssignedTo("");
                    openAssignUserSuggestions();
                  }}
                  placeholder={
                    selectedTeam
                      ? "Search user in selected department..."
                      : role === "ADMIN"
                      ? "Search any user by name, email, role or department..."
                      : "Search user in your department..."
                  }
                />

                {selectedAssignedUser && (
                  <div className="mt-2 flex items-center justify-between rounded-2xl border border-blue-100 bg-white/90 px-4 py-3 text-sm shadow-sm">
                    <div>
                      <p className="font-black text-blue-950">
                        {selectedAssignedUser.name} {selectedAssignedUser.surname}
                      </p>
                      <p className="text-xs text-blue-700/60">
                        {selectedAssignedUser.email} • {selectedAssignedUser.role || "-"} •{" "}
                        {selectedAssignedUser.department || "No Team"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAssignedTo("");
                        setAssignUserSearch("");
                        openAssignUserSuggestions();
                      }}
                      className="rounded-xl bg-rose-50 px-3 py-1 text-xs font-black text-rose-600 hover:bg-rose-100"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {mounted &&
                  showAssignUserSuggestions &&
                  !assignedTo &&
                  createPortal(
                    <div
                      ref={assignUserDropdownRef}
                      className="fixed max-h-80 overflow-y-auto rounded-3xl border border-blue-100 bg-white shadow-2xl"
                      style={{
                        top: assignDropdownPosition.top,
                        left: assignDropdownPosition.left,
                        width: assignDropdownPosition.width,
                        zIndex: 999999,
                      }}
                    >
                      {filteredAssignUsers.length === 0 ? (
                        <div className="px-4 py-4 text-sm font-semibold text-slate-400">
                          No user found.
                        </div>
                      ) : (
                        filteredAssignUsers.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setAssignedTo(u.email);
                              setAssignUserSearch(
                                `${u.name || ""} ${u.surname || ""}`.trim() || u.email
                              );
                              setShowAssignUserSuggestions(false);
                            }}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-blue-50"
                          >
                            <div>
                              <p className="font-black text-blue-950">
                                {u.name} {u.surname}
                              </p>
                              <p className="text-xs text-blue-700/60">{u.email}</p>
                            </div>

                            <div className="text-right text-xs text-slate-500">
                              <p className="font-bold">{u.role || "-"}</p>
                              <p>{u.department || "No Team"}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>,
                    document.body
                  )}
              </div>
            )}

            <button
              onClick={addTask}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-[1.02] text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-blue-500/25 transition"
            >
              {assignMode === "team" ? "Assign Task to Team 🚀" : "Add Task 🚀"}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
          <div className="bg-white/70 backdrop-blur-2xl p-5 rounded-3xl shadow-xl border border-white/60 border-l-8 border-indigo-300">
            <p className="text-sm text-blue-700/70">Total Tasks</p>
            <p className="text-3xl font-black text-indigo-600">{totalTasks}</p>
          </div>

          <div className="bg-white/70 backdrop-blur-2xl p-5 rounded-3xl shadow-xl border border-white/60 border-l-8 border-emerald-300">
            <p className="text-sm text-blue-700/70">Completed</p>
            <p className="text-3xl font-black text-emerald-600">
              {completedTasks}
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-2xl p-5 rounded-3xl shadow-xl border border-white/60 border-l-8 border-blue-300">
            <p className="text-sm text-blue-700/70">In Progress</p>
            <p className="text-3xl font-black text-blue-600">
              {inProgressTasks}
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-2xl p-5 rounded-3xl shadow-xl border border-white/60 border-l-8 border-violet-300">
            <p className="text-sm text-blue-700/70">Testing</p>
            <p className="text-3xl font-black text-violet-600">
              {testingTasks}
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-2xl p-5 rounded-3xl shadow-xl border border-white/60 border-l-8 border-purple-300">
            <p className="text-sm text-blue-700/70">Waiting Approval</p>
            <p className="text-3xl font-black text-purple-600">
              {waitingApprovalTasks}
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-2xl p-5 rounded-3xl shadow-xl border border-white/60 border-l-8 border-rose-300">
            <p className="text-sm text-blue-700/70">Overdue</p>
            <p className="text-3xl font-black text-rose-600">{overdueTasks}</p>
          </div>

          <div className="bg-white/70 backdrop-blur-2xl p-5 rounded-3xl shadow-xl border border-white/60 border-l-8 border-cyan-300">
            <p className="text-sm text-blue-700/70">Projects</p>
            <p className="text-3xl font-black text-cyan-600">
              {projects.length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/75 backdrop-blur-2xl p-6 rounded-3xl shadow-xl border border-white/60">
            <div className="mb-4">
              <h2 className="font-black text-xl text-blue-950">
                Task Status Distribution
              </h2>
              <p className="text-xs text-blue-700/70">
                Jira-like overview of visible tasks by workflow status.
              </p>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusChartData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label
                  >
                    {taskStatusChartData.map((entry, index) => (
                      <Cell
                        key={`status-cell-${entry.name}`}
                        fill={
                          [
                            "#f59e0b",
                            "#3b82f6",
                            "#6366f1",
                            "#a855f7",
                            "#10b981",
                          ][index % 5]
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

          <div className="bg-white/75 backdrop-blur-2xl p-6 rounded-3xl shadow-xl border border-white/60">
            <div className="mb-4">
              <h2 className="font-black text-xl text-blue-950">
                Task Priority Overview
              </h2>
              <p className="text-xs text-blue-700/70">
                Workload split by priority level.
              </p>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskPriorityChartData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="value"
                    name="Tasks"
                    fill="#2563eb"
                    radius={[12, 12, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/75 backdrop-blur-2xl p-5 rounded-3xl shadow-xl border border-white/60">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-black text-lg text-blue-950">
                    My Completed Assigned Tasks
                  </h2>
                  <p className="text-xs text-blue-700/70">
                    Tasks assigned to me and approved as done.
                  </p>
                </div>

                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-xs font-black">
                  {completedAssignedToMeTasks.length}
                </span>
              </div>

              {completedAssignedToMeTasks.length === 0 ? (
                <p className="text-sm text-blue-700/50 bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  No completed assigned tasks yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {completedAssignedToMeTasks.map((task) => (
                    <button
                      key={`assigned-done-${task.id}`}
                      onClick={() => {
                        const element = document.getElementById(
                          `task-${task.id}`,
                        );
                        if (element) {
                          element.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }
                      }}
                      className="w-full text-left bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-100 rounded-2xl p-3 transition"
                    >
                      <p className="font-black text-sm text-blue-950">
                        {task.title}
                      </p>
                      <p className="text-xs text-blue-700/70 mt-1">
                        Created by {getUserFullName(task.createdBy)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white/75 backdrop-blur-2xl p-5 rounded-3xl shadow-xl border border-white/60">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-black text-lg text-blue-950">
                    Completed Tasks I Assigned
                  </h2>
                  <p className="text-xs text-blue-700/70">
                    Tasks I created and my team completed.
                  </p>
                </div>

                <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full text-xs font-black">
                  {completedCreatedByMeTasks.length}
                </span>
              </div>

              {completedCreatedByMeTasks.length === 0 ? (
                <p className="text-sm text-blue-700/50 bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  No completed assigned-by-me tasks yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {completedCreatedByMeTasks.map((task) => (
                    <button
                      key={`created-done-${task.id}`}
                      onClick={() => {
                        const element = document.getElementById(
                          `task-${task.id}`,
                        );
                        if (element) {
                          element.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }
                      }}
                      className="w-full text-left bg-blue-50/70 hover:bg-blue-100 border border-blue-100 rounded-2xl p-3 transition"
                    >
                      <p className="font-black text-sm text-blue-950">
                        {task.title}
                      </p>
                      <p className="text-xs text-blue-700/70 mt-1">
                        Assigned to{" "}
                        {(task.assignedTo || "-")
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
      
        <div className="bg-white/75 backdrop-blur-2xl p-6 rounded-3xl shadow-xl mb-6 space-y-4 border border-white/60">
          <div>
            <h2 className="font-black text-xl text-blue-950 lg:pr-80">
              Filters
            </h2>
            <p className="text-xs text-blue-700/70">
              Filter tasks by title, team, project or workflow status.
            </p>
          </div>

          <input
            className="border border-white/70 bg-white/80 p-3 w-full rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-300"
            placeholder="Search by task title, person name or creator..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              className="border border-white/70 bg-teal-50/80 p-3 w-full rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-teal-200"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
            >
              <option value="">All Teams</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>

            <select
              className="border border-white/70 bg-cyan-50/80 p-3 w-full rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-cyan-200"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={String(project.id)}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              className="border border-white/70 bg-indigo-50/80 p-3 w-full rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-200"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="TEST">TEST</option>
              <option value="WAITING_APPROVAL">WAITING_APPROVAL</option>
              <option value="DONE">DONE</option>
            </select>
          </div>
        </div>

        <div className="space-y-5">
          {filteredTasks.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-xl p-10 text-center text-slate-600">
              <div className="text-5xl mb-3">🗂️</div>
              <p className="font-bold">No tasks yet</p>
              <p className="text-sm">Your workspace is clean and ready.</p>
            </div>
          ) : (
            [...filteredTasks]
              .sort((a, b) => b.id - a.id)
              .map((task) => {
                const assignedUser = getUserByEmail(task.assignedTo);

                const isAssignedToMe = (task.assignedTo || "").includes(
                  currentEmail || "",
                );

                const isCreator = task.createdBy === currentEmail;
                const canSubmitForApproval =
                  isAssignedToMe &&
                  !isCreator &&
                  task.status !== "WAITING_APPROVAL" &&
                  task.status !== "DONE";

                const canDeleteTask =
                  role === "ADMIN" || task.createdBy === currentEmail;

                const canEditTask =
                  role === "ADMIN" || task.createdBy === currentEmail;

                return (
                  <div
                    id={`task-${task.id}`}
                    key={task.id}
                    className="relative overflow-hidden bg-white/75 backdrop-blur-2xl p-6 rounded-3xl shadow-xl border border-white/60 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-500/0 via-cyan-400/0 to-indigo-500/0 opacity-0 transition duration-300 hover:opacity-100" />
                    <div className="pointer-events-none absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />
                    <div className="relative">
                      <div className="w-full">
                        {editingTaskId === task.id ? (
                          <div className="space-y-3">
                            <input
                              className="border p-3 w-full rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                              value={editTaskTitle}
                              onChange={(e) => setEditTaskTitle(e.target.value)}
                            />

                            <textarea
                              className="border p-3 w-full rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                              placeholder="Description"
                              value={editTaskDescription}
                              onChange={(e) =>
                                setEditTaskDescription(e.target.value)
                              }
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-black text-blue-800 mb-1 ml-1">
                                  Status
                                </label>
                                <select
                                  className="border p-3 rounded-2xl w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                                  value={editTaskStatus}
                                  onChange={(e) =>
                                    setEditTaskStatus(e.target.value)
                                  }
                                >
                                  <option value="TODO">TODO</option>
                                  <option value="IN_PROGRESS">
                                    IN_PROGRESS
                                  </option>
                                  <option value="TEST">TEST</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-black text-blue-800 mb-1 ml-1">
                                  Priority
                                </label>
                                <select
                                  className="border p-3 rounded-2xl w-full focus:outline-none focus:ring-2 focus:ring-amber-300"
                                  value={editTaskPriority}
                                  onChange={(e) =>
                                    setEditTaskPriority(e.target.value)
                                  }
                                >
                                  <option value="LOW">LOW</option>
                                  <option value="MEDIUM">MEDIUM</option>
                                  <option value="HIGH">HIGH</option>
                                  <option value="URGENT">URGENT</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-black text-blue-800 mb-1 ml-1">
                                  Due Date / Deadline
                                </label>
                                <input
                                  type="date"
                                  className="border p-3 rounded-2xl w-full focus:outline-none focus:ring-2 focus:ring-violet-300"
                                  value={editTaskDueDate}
                                  onChange={(e) =>
                                    setEditTaskDueDate(e.target.value)
                                  }
                                />
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => updateTaskFull(task)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-2xl font-bold"
                              >
                                Save
                              </button>

                              <button
                                onClick={cancelEditTask}
                                className="bg-slate-400 hover:bg-blue-500 text-white px-4 py-2 rounded-2xl font-bold"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap gap-2 mb-3 lg:pr-80">
                              <span
                                className={`px-3 py-1 text-xs rounded-full font-black border ${getStatusClass(
                                  task.status,
                                )}`}
                              >
                                {task.status || "TODO"}
                              </span>

                              <span
                                className={`px-3 py-1 text-xs rounded-full font-black border ${getPriorityClass(
                                  task.priority,
                                )}`}
                              >
                                {task.priority || "MEDIUM"}
                              </span>

                              <span className="px-3 py-1 text-xs rounded-full font-black bg-blue-50 text-blue-900 border border-blue-100">
                                {task.assignmentType || "-"}
                              </span>
                            </div>

                            <p className="font-black text-xl text-blue-950 lg:pr-80">
                              {task.title}
                            </p>

                            {task.description && (
                              <p className="text-sm text-blue-700/70 mt-1 lg:pr-80">
                                {task.description}
                              </p>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4 text-sm text-blue-800 w-full">
                              <div className="bg-indigo-50 rounded-2xl p-3 border border-indigo-100 min-h-[88px] w-full">
                                <span className="font-black text-indigo-700">
                                  Assigned To:
                                </span>{" "}
                                <div className="mt-2">
                                  {(task.assignedTo || "-")
                                    .split(",")
                                    .map((email) => {
                                      const cleanEmail = email.trim();

                                      return (
                                        <UserHoverCard
                                          key={cleanEmail || "empty-assigned"}
                                          email={cleanEmail}
                                        />
                                      );
                                    })}
                                </div>
                              </div>

                              <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100 min-h-[88px] w-full">
                                <span className="font-black text-blue-700">
                                  Created By:
                                </span>{" "}
                                <div className="mt-2">
                                  {task.createdBy ? (
                                    <UserHoverCard email={task.createdBy} />
                                  ) : (
                                    "-"
                                  )}
                                </div>
                              </div>

                              <div className="bg-cyan-50 rounded-2xl p-3 border border-cyan-100">
                                <span className="font-black text-cyan-700">
                                  Project:
                                </span>{" "}
                                {getProjectName(task.projectId)}
                                {getProjectById(task.projectId)?.githubUrl && (
                                  <a
                                    href={
                                      getProjectById(task.projectId)
                                        ?.githubUrl || "#"
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ml-2 inline-flex text-xs font-black text-cyan-700 underline"
                                  >
                                    GitHub
                                  </a>
                                )}
                              </div>

                              <p className="bg-teal-50 rounded-2xl p-3 border border-teal-100">
                                <span className="font-black text-teal-700">
                                  Team:
                                </span>{" "}
                                {task.teamName ||
                                  assignedUser?.department ||
                                  "-"}
                              </p>

                              <p className="bg-violet-50 rounded-2xl p-3 border border-violet-100">
                                <span className="font-black text-violet-700">
                                  Due Date / Deadline:
                                </span>{" "}
                                {task.dueDate || "-"}
                              </p>

                              {task.reviewNote && (
                                <p className="bg-rose-50 rounded-2xl p-3 border border-rose-100 md:col-span-2">
                                  <span className="font-black text-rose-700">
                                    Revision Note:
                                  </span>{" "}
                                  {task.reviewNote}
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2 items-center flex-wrap mt-4 lg:mt-0 lg:absolute lg:right-0 lg:top-0 lg:justify-end">
                        {isAssignedToMe &&
                          editingTaskId !== task.id &&
                          !isCreator &&
                          task.status !== "WAITING_APPROVAL" &&
                          task.status !== "DONE" && (
                            <select
                              value={task.status || "TODO"}
                              onChange={(e) =>
                                updateStatus(task.id, e.target.value)
                              }
                              className="border p-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                              <option value="TODO">TODO</option>
                              <option value="IN_PROGRESS">IN_PROGRESS</option>
                              <option value="TEST">TEST</option>
                            </select>
                          )}

                        {canSubmitForApproval && editingTaskId !== task.id && (
                          <button
                            onClick={() => updateStatus(task.id, "DONE")}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-sm"
                          >
                            Submit for Approval
                          </button>
                        )}

                        {isAssignedToMe &&
                          !isCreator &&
                          task.status === "WAITING_APPROVAL" &&
                          editingTaskId !== task.id && (
                            <span className="bg-purple-50 text-purple-700 border border-purple-200 px-4 py-2 rounded-2xl text-sm font-bold">
                              Waiting for creator approval
                            </span>
                          )}

                        {task.status === "DONE" &&
                          editingTaskId !== task.id && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-2xl text-sm font-bold">
                              Closed / Approved
                            </span>
                          )}

                        {isCreator &&
                          editingTaskId !== task.id &&
                          task.status !== "WAITING_APPROVAL" &&
                          task.status !== "DONE" && (
                            <select
                              value={task.status || "TODO"}
                              onChange={(e) =>
                                updateStatus(task.id, e.target.value)
                              }
                              className="border p-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                              <option value="TODO">TODO</option>
                              <option value="IN_PROGRESS">IN_PROGRESS</option>
                              <option value="TEST">TEST</option>
                              <option value="DONE">DONE</option>
                            </select>
                          )}

                        {canEditTask &&
                          editingTaskId !== task.id &&
                          task.status !== "DONE" && (
                            <button
                              onClick={() => startEditTask(task)}
                              className="bg-amber-400 hover:bg-amber-500 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-sm"
                            >
                              Edit
                            </button>
                          )}

                        {canDeleteTask && editingTaskId !== task.id && (
                          <button
                            onClick={() => deleteTask(task)}
                            className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-sm"
                          >
                            Delete
                          </button>
                        )}

                        {task.status === "WAITING_APPROVAL" &&
                          isCreator &&
                          editingTaskId !== task.id && (
                            <div className="w-full lg:w-72 bg-purple-50 border border-purple-100 rounded-2xl p-3 space-y-2">
                              <p className="text-xs font-black text-purple-700">
                                This task is waiting for your review.
                              </p>

                              <button
                                onClick={() => approveTask(task.id)}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                              >
                                Approve Task
                              </button>

                              <textarea
                                className="w-full border border-rose-100 bg-white p-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-300"
                                placeholder="Write revision note..."
                                value={rejectNote[task.id] || ""}
                                onChange={(e) =>
                                  setRejectNote((prev) => ({
                                    ...prev,
                                    [task.id]: e.target.value,
                                  }))
                                }
                              />

                              <button
                                onClick={() => rejectTask(task.id)}
                                className="w-full bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                              >
                                Request Revision
                              </button>
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="mt-5 border-t border-blue-100 pt-4">
                      <p className="text-xs font-black text-blue-900 mb-3">
                        💭 Comments
                      </p>

                      {(comments[task.id] || []).length === 0 ? (
                        <p className="text-xs text-blue-700/50 mb-3">
                          No comments yet.
                        </p>
                      ) : (
                        <div className="space-y-2 mb-3">
                          {[...(comments[task.id] || [])]
                            .sort((a, b) => b.id - a.id)
                            .map((comment) => {
                              const isCommentOwner =
                                comment.authorEmail === currentEmail;
                              const canDeleteComment =
                                role === "ADMIN" || isCommentOwner;
                              const canEditComment = isCommentOwner;

                              return (
                                <div
                                  key={comment.id}
                                  className="text-xs text-blue-800 flex justify-between gap-2 bg-blue-50 border border-blue-100 rounded-2xl p-3"
                                >
                                  <div className="flex-1">
                                    <UserHoverCard
                                      email={comment.authorEmail}
                                    />{" "}
                                    {editingCommentId === comment.id ? (
                                      <input
                                        className="border p-2 ml-1 rounded-xl w-full mt-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        value={editingCommentText}
                                        onChange={(e) =>
                                          setEditingCommentText(e.target.value)
                                        }
                                      />
                                    ) : (
                                      <span className="whitespace-pre-wrap leading-relaxed">
                                        {renderCommentTextWithMentions(
                                          comment.text,
                                        )}
                                      </span>
                                    )}
                                    {comment.fileUrl && (
                                      <div className="mt-3 rounded-2xl border border-blue-100 bg-white p-3">
                                        {comment.fileType?.startsWith(
                                          "image/",
                                        ) ? (
                                          <>
                                            <a
                                              href={comment.fileUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="block"
                                            >
                                              <img
                                                src={comment.fileUrl}
                                                alt={
                                                  comment.fileName ||
                                                  "comment attachment"
                                                }
                                                className="max-h-56 rounded-xl border border-blue-100 object-contain"
                                              />
                                            </a>

                                            <a
                                              href={comment.fileUrl}
                                              download={
                                                comment.fileName || "image"
                                              }
                                              className="inline-flex items-center gap-2 mt-2 text-indigo-600 font-bold underline"
                                            >
                                              🖼{" "}
                                              {comment.fileName ||
                                                "Download image"}
                                            </a>
                                          </>
                                        ) : (
                                          <a
                                            href={comment.fileUrl}
                                            download={
                                              comment.fileName || "attachment"
                                            }
                                            className="inline-flex items-center gap-2 text-indigo-600 font-bold underline"
                                          >
                                            📎{" "}
                                            {comment.fileName ||
                                              "Download attachment"}
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex gap-2">
                                    {canEditComment &&
                                      editingCommentId !== comment.id && (
                                        <button
                                          onClick={() => {
                                            setEditingCommentId(comment.id);
                                            setEditingCommentText(comment.text);
                                          }}
                                          className="text-blue-500 font-bold"
                                        >
                                          Edit
                                        </button>
                                      )}

                                    {canEditComment &&
                                      editingCommentId === comment.id && (
                                        <button
                                          onClick={() => updateComment(comment)}
                                          className="text-emerald-600 font-bold"
                                        >
                                          Save
                                        </button>
                                      )}

                                    {canEditComment &&
                                      editingCommentId === comment.id && (
                                        <button
                                          onClick={() => {
                                            setEditingCommentId(null);
                                            setEditingCommentText("");
                                          }}
                                          className="text-blue-700/70 font-bold"
                                        >
                                          Cancel
                                        </button>
                                      )}

                                    {canDeleteComment && (
                                      <button
                                        onClick={() => deleteComment(comment)}
                                        className="text-rose-500 font-bold"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}

                      <div className="space-y-2">
                        {commentFiles[task.id] && (
                          <div className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-3 text-xs text-blue-800">
                            <div className="min-w-0">
                              <p className="font-black text-indigo-700">
                                Selected attachment
                              </p>
                              <p className="truncate">
                                {commentFiles[task.id].fileName}
                              </p>
                            </div>

                            <button
                              onClick={() => clearCommentFile(task.id)}
                              className="shrink-0 rounded-xl bg-white px-3 py-1 font-bold text-rose-600 border border-rose-100"
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        <div className="relative flex gap-2 items-center">
                          <div className="relative flex-1">
                            <input
                              className="border border-blue-100 bg-blue-50 p-3 text-xs w-full rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                              placeholder="Add a comment... Use @Name to mention someone"
                              value={newComment[task.id] || ""}
                              onChange={(e) =>
                                handleCommentTextChange(task.id, e.target.value)
                              }
                            />

                            {showMentionBox[task.id] &&
                              mentionSuggestions[task.id]?.length > 0 && (
                                <div className="absolute left-0 bottom-12 z-50 w-full max-w-sm rounded-2xl border border-indigo-100 bg-white shadow-2xl overflow-hidden">
                                  <div className="px-3 py-2 bg-indigo-50 text-[11px] font-black text-indigo-700">
                                    Mention teammate
                                  </div>

                                  <div className="max-h-56 overflow-y-auto">
                                    {mentionSuggestions[task.id].map((user) => (
                                      <button
                                        key={user.email}
                                        type="button"
                                        onClick={() =>
                                          selectMentionUser(task.id, user)
                                        }
                                        className="w-full text-left px-3 py-3 hover:bg-indigo-50 flex items-center gap-3 transition"
                                      >
                                        <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black overflow-hidden">
                                          {getProfileImage(user) ? (
                                            <img
                                              src={getProfileImage(user)}
                                              alt={getUserFullName(user.email)}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            getInitials(user.email)
                                          )}
                                        </span>

                                        <span className="min-w-0">
                                          <span className="block text-xs font-black text-blue-950 truncate">
                                            {user.name} {user.surname}
                                          </span>
                                          <span className="block text-[10px] text-blue-700/50 truncate">
                                            {user.role || "-"} •{" "}
                                            {user.department || "-"}
                                          </span>
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>

                          <label className="cursor-pointer bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-3 text-xs rounded-2xl font-black shadow-sm">
                            📎
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                              onChange={(e) =>
                                handleCommentFileChange(
                                  task.id,
                                  e.target.files?.[0] || null,
                                )
                              }
                            />
                          </label>

                          <button
                            onClick={() => addComment(task.id)}
                            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-[1.02] text-white px-5 py-2 text-xs rounded-2xl font-black shadow-md transition"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
