"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
};

type Comment = {
  id: number;
  taskId: number;
  authorEmail: string;
  text: string;
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState("MEDIUM");
  const [newDueDate, setNewDueDate] = useState("");

  const [assignedTo, setAssignedTo] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [assignMode, setAssignMode] = useState<"user" | "team">("user");

  const [teamFilter, setTeamFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const [comments, setComments] = useState<{ [key: number]: Comment[] }>({});
  const [newComment, setNewComment] = useState<{ [key: number]: string }>({});
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskStatus, setEditTaskStatus] = useState("TODO");
  const [editTaskPriority, setEditTaskPriority] = useState("MEDIUM");
  const [editTaskDueDate, setEditTaskDueDate] = useState("");

  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const role =
    typeof window !== "undefined" ? localStorage.getItem("role") : "";

  const currentEmail =
    typeof window !== "undefined" ? localStorage.getItem("email") : "";

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    Promise.all([fetchUsers(), fetchTasks()]).finally(() =>
      setLoading(false)
    );
  }, []);

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
      `${process.env.NEXT_PUBLIC_API_URL}/api/comments/task/${taskId}`
    );

    const data = await res.json();

    setComments((prev) => ({
      ...prev,
      [taskId]: Array.isArray(data) ? data : [],
    }));
  };
    const addComment = async (taskId: number) => {
    const text = newComment[taskId];

    if (!text || !text.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId,
        text,
        authorEmail: localStorage.getItem("email"),
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
        }),
      }
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
      `${process.env.NEXT_PUBLIC_API_URL}/api/comments/${comment.id}`,
      {
        method: "DELETE",
      }
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
    ])
  );

  const usersBySelectedTeam = users.filter((u) => {
    if (!selectedTeam) return false;
    return u.department === selectedTeam;
  });

  const today = new Date().toISOString().split("T")[0];

  const filteredTasks = tasks.filter((task) => {
    const assignedUser = users.find((u) => u.email === task.assignedTo);
    const taskTeam = task.teamName || assignedUser?.department;

    const matchesTeam = !teamFilter || taskTeam === teamFilter;
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesSearch =
      !searchText ||
      task.title.toLowerCase().includes(searchText.toLowerCase()) ||
      (task.assignedTo || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (task.createdBy || "").toLowerCase().includes(searchText.toLowerCase());

    return matchesTeam && matchesStatus && matchesSearch;
  });

  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(
    (task) => task.status === "DONE"
  ).length;
  const inProgressTasks = filteredTasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;
  const testingTasks = filteredTasks.filter(
    (task) => task.status === "TEST"
  ).length;
  const overdueTasks = filteredTasks.filter(
    (task) => task.dueDate && task.dueDate < today && task.status !== "DONE"
  ).length;

  const addTask = async () => {
    const userRole = localStorage.getItem("role");
    const userEmail = localStorage.getItem("email");

    if (!newTask.trim()) {
      toast.error("Task title cannot be empty");
      return;
    }

    if ((userRole === "ADMIN" || userRole === "MANAGER") && !selectedTeam) {
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
          teamName: selectedTeam,
          priority: newPriority,
          dueDate: newDueDate,
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
      setSelectedTeam("");
      fetchTasks();
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
        teamName: selectedTeam,
        priority: newPriority,
        dueDate: newDueDate,
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
    setSelectedTeam("");
    fetchTasks();
    toast.success("Task created 🎉");
  };

  const updateStatus = async (taskId: number, status: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}/status?status=${status}`,
      {
        method: "PUT",
      }
    );

    if (!res.ok) {
      toast.error("Status could not be updated");
      return;
    }

    fetchTasks();
    toast.success("Status updated");
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
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${task.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...task,
          title: editTaskTitle,
          description: editTaskDescription,
          status: editTaskStatus,
          priority: editTaskPriority,
          dueDate: editTaskDueDate,
        }),
      }
    );

    if (!res.ok) {
      toast.error("Task could not be updated");
      return;
    }

    cancelEditTask();
    fetchTasks();
    toast.success("Task updated");
  };

  const deleteTask = async (task: Task) => {
    if (role !== "ADMIN" && task.createdBy !== currentEmail) {
      toast.error("Only creator or admin can delete this task");
      return;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${task.id}`,
      {
        method: "DELETE",
      }
    );

    if (!res.ok) {
      toast.error("Task could not be deleted");
      return;
    }

    fetchTasks();
    toast.success("Task deleted");
  };

  const logout = () => {
    localStorage.clear();
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
    <div className="min-h-screen bg-gray-50 p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Task Dashboard</h1>
          <p className="text-sm text-gray-500">Manage tasks and teams</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="bg-gray-200 px-4 py-2 rounded-lg"
          >
            Profile
          </button>

          <button
            onClick={() => router.push("/dashboard/messages")}
            className="bg-gray-200 px-4 py-2 rounded-lg"
          >
            Messages
          </button>

          <button
            onClick={() => router.push("/dashboard/requests")}
            className="bg-gray-200 px-4 py-2 rounded-lg"
          >
            Requests
          </button>

          {role === "ADMIN" && (
            <button
              onClick={() => router.push("/admin")}
              className="bg-black text-white px-4 py-2 rounded-lg"
            >
              Role Update
            </button>
          )}

          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>

      {(role === "ADMIN" || role === "MANAGER") && (
        <div className="bg-white p-4 rounded-xl shadow mb-6 space-y-3">
          <h2 className="font-bold">Create and Assign Task</h2>

          <input
            className="border p-2 w-full rounded-lg"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Task title"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select
              className="border p-2 w-full rounded-lg"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>

            <input
              type="date"
              className="border p-2 w-full rounded-lg"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />

            <select
              className="border p-2 w-full rounded-lg"
              value={assignMode}
              onChange={(e) => {
                setAssignMode(e.target.value as "user" | "team");
                setAssignedTo("");
              }}
            >
              <option value="user">Assign to User</option>
              <option value="team">Assign to Team</option>
            </select>
          </div>
                    <select
            className="border p-2 w-full rounded-lg"
            value={selectedTeam}
            onChange={(e) => {
              setSelectedTeam(e.target.value);
              setAssignedTo("");
            }}
          >
            <option value="">Select team</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>

          {assignMode === "user" && (
            <select
              className="border p-2 w-full rounded-lg"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              disabled={!selectedTeam}
            >
              <option value="">
                {selectedTeam ? "Select user" : "Select a team first"}
              </option>

              {usersBySelectedTeam.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.name} {u.surname} - {u.role} - {u.department || "No Team"}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={addTask}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            {assignMode === "team" ? "Assign Task to Team" : "Add Task"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Total Tasks</p>
          <p className="text-2xl font-bold">{totalTasks}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold">{completedTasks}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold">{inProgressTasks}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Testing</p>
          <p className="text-2xl font-bold">{testingTasks}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-bold">{overdueTasks}</p>
        </div>
      </div>

      {(role === "ADMIN" || role === "MANAGER") && (
        <div className="bg-white p-4 rounded-xl shadow mb-6 space-y-3">
          <h2 className="font-bold">Filters</h2>

          <input
            className="border p-2 w-full rounded-lg"
            placeholder="Search by task title, assigned email or creator..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <select
            className="border p-2 w-full rounded-lg"
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
            className="border p-2 w-full rounded-lg"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="TEST">TEST</option>
            <option value="DONE">DONE</option>
          </select>
        </div>
      )}

      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <p className="text-gray-500">No tasks yet 🚀</p>
        ) : (
          filteredTasks.map((task) => {
            const assignedUser = users.find((u) => u.email === task.assignedTo);

            const isAssignedToMe = (task.assignedTo || "").includes(
              currentEmail || ""
            );

            const canDeleteTask =
              role === "ADMIN" || task.createdBy === currentEmail;

            const canEditTask =
              role === "ADMIN" || task.createdBy === currentEmail;

            return (
              <div key={task.id} className="p-4 border rounded-xl bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {editingTaskId === task.id ? (
                      <div className="space-y-2">
                        <input
                          className="border p-2 w-full rounded"
                          value={editTaskTitle}
                          onChange={(e) => setEditTaskTitle(e.target.value)}
                        />

                        <textarea
                          className="border p-2 w-full rounded"
                          placeholder="Description"
                          value={editTaskDescription}
                          onChange={(e) =>
                            setEditTaskDescription(e.target.value)
                          }
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <select
                            className="border p-2 rounded"
                            value={editTaskStatus}
                            onChange={(e) => setEditTaskStatus(e.target.value)}
                          >
                            <option value="TODO">TODO</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="TEST">TEST</option>
                            <option value="DONE">DONE</option>
                          </select>

                          <select
                            className="border p-2 rounded"
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

                          <input
                            type="date"
                            className="border p-2 rounded"
                            value={editTaskDueDate}
                            onChange={(e) =>
                              setEditTaskDueDate(e.target.value)
                            }
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => updateTaskFull(task)}
                            className="bg-green-600 text-white px-3 py-1 rounded"
                          >
                            Save
                          </button>

                          <button
                            onClick={cancelEditTask}
                            className="bg-gray-400 text-white px-3 py-1 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold">{task.title}</p>

                        {task.description && (
                          <p className="text-sm text-gray-500">
                            {task.description}
                          </p>
                        )}

                        <p className="text-sm text-gray-500">
                          Assigned To: {task.assignedTo}
                        </p>

                        <p className="text-sm text-gray-500">
                          Created By: {task.createdBy || "-"}
                        </p>

                        <p className="text-sm text-gray-500">
                          Assignment Type: {task.assignmentType || "-"}
                        </p>

                        <p className="text-sm text-gray-500">
                          Team: {task.teamName || assignedUser?.department || "-"}
                        </p>

                        <p className="text-sm text-gray-500">
                          Priority: {task.priority || "MEDIUM"}
                        </p>

                        <p className="text-sm text-gray-500">
                          Due Date: {task.dueDate || "-"}
                        </p>

                        <p className="text-sm text-blue-500">
                          Status: {task.status || "TODO"}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2 items-center">
                    {isAssignedToMe && editingTaskId !== task.id && (
                      <select
                        value={task.status || "TODO"}
                        onChange={(e) => updateStatus(task.id, e.target.value)}
                        className="border p-2 rounded"
                      >
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="TEST">TEST</option>
                        <option value="DONE">DONE</option>
                      </select>
                    )}

                    {canEditTask && editingTaskId !== task.id && (
                      <button
                        onClick={() => startEditTask(task)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                    )}

                    {canDeleteTask && editingTaskId !== task.id && (
                      <button
                        onClick={() => deleteTask(task)}
                        className="bg-red-500 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                                <div className="mt-3 border-t pt-3">
                  <p className="text-xs font-semibold mb-2">Comments</p>

                  {(comments[task.id] || []).length === 0 ? (
                    <p className="text-xs text-gray-400 mb-2">
                      No comments yet.
                    </p>
                  ) : (
                    <div className="space-y-2 mb-2">
                      {(comments[task.id] || []).map((comment) => {
                        const isCommentOwner =
                          comment.authorEmail === currentEmail;
                        const canDeleteComment =
                          role === "ADMIN" || isCommentOwner;
                        const canEditComment = isCommentOwner;

                        return (
                          <div
                            key={comment.id}
                            className="text-xs text-gray-600 flex justify-between gap-2 border-b pb-1"
                          >
                            <div className="flex-1">
                              <span className="font-semibold">
                                {comment.authorEmail}:
                              </span>{" "}
                              {editingCommentId === comment.id ? (
                                <input
                                  className="border p-1 ml-1 rounded w-full mt-1"
                                  value={editingCommentText}
                                  onChange={(e) =>
                                    setEditingCommentText(e.target.value)
                                  }
                                />
                              ) : (
                                comment.text
                              )}
                            </div>

                            <div className="flex gap-1">
                              {canEditComment &&
                                editingCommentId !== comment.id && (
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(comment.id);
                                      setEditingCommentText(comment.text);
                                    }}
                                    className="text-blue-500"
                                  >
                                    Edit
                                  </button>
                                )}

                              {canEditComment &&
                                editingCommentId === comment.id && (
                                  <button
                                    onClick={() => updateComment(comment)}
                                    className="text-green-600"
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
                                    className="text-gray-500"
                                  >
                                    Cancel
                                  </button>
                                )}

                              {canDeleteComment && (
                                <button
                                  onClick={() => deleteComment(comment)}
                                  className="text-red-500"
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

                  <div className="flex gap-2">
                    <input
                      className="border p-2 text-xs flex-1 rounded"
                      placeholder="Add comment..."
                      value={newComment[task.id] || ""}
                      onChange={(e) =>
                        setNewComment((prev) => ({
                          ...prev,
                          [task.id]: e.target.value,
                        }))
                      }
                    />

                    <button
                      onClick={() => addComment(task.id)}
                      className="bg-blue-500 text-white px-3 py-1 text-xs rounded"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

