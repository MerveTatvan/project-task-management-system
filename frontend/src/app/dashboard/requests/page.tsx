// Target file: frontend/src/app/dashboard/requests/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type RequestItem = {
  id: number;
  type: string;
  description: string;
  createdBy: string;
  receiverEmail?: string;
  status: string;
  projectId?: number | null;
  taskId?: number | null;
  requestedValue?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
};

const requestTypes = [
  "ROLE_CHANGE",
  "TEAM_CHANGE",
  "TASK_HELP",
  "DEADLINE_EXTENSION",
  "PROJECT_JOIN",
  "PROJECT_LEAVE",
  "PROJECT_UPDATE",
  "PROJECT_DEADLINE",
  "KANBAN_APPROVAL",
  "BUG_REPORT",
  "GENERAL",
];

const roles = ["WORKER", "DEVELOPER", "MANAGER"];
const teams = ["Frontend", "Backend", "Database", "QA", "DevOps", "UI/UX", "IT", "ARGE"];
const defaultReceiverEmail = "admin@test.com";

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [type, setType] = useState("GENERAL");
  const [desc, setDesc] = useState("");
  const [targetRole, setTargetRole] = useState("DEVELOPER");
  const [targetTeam, setTargetTeam] = useState("Frontend");
  const [taskInfo, setTaskInfo] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [loading, setLoading] = useState(true);

  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");

  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [editType, setEditType] = useState("GENERAL");
  const [editDesc, setEditDesc] = useState("");
  const [editTargetRole, setEditTargetRole] = useState("DEVELOPER");
  const [editTargetTeam, setEditTargetTeam] = useState("Frontend");
  const [editTaskInfo, setEditTaskInfo] = useState("");
  const [editDeadlineDate, setEditDeadlineDate] = useState("");

  const router = useRouter();

  useEffect(() => {
    const storedRole = localStorage.getItem("role") || "";
    const storedEmail = localStorage.getItem("email") || "";

    if (!storedEmail) {
      router.push("/login");
      return;
    }

    setRole(storedRole);
    setEmail(storedEmail);
    fetchRequests(storedEmail);
  }, []);

  const fetchRequests = async (emailParam = email) => {
    try {
      const activeEmail = emailParam || localStorage.getItem("email") || "";

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests`);
      const data = await res.json();

      if (!Array.isArray(data)) {
        setRequests([]);
        return;
      }

      const filteredRequests = data.filter((r) => {
        const creator = (r.createdBy || "").trim().toLowerCase();
        const receiver = (r.receiverEmail || "").trim().toLowerCase();
        const me = activeEmail.trim().toLowerCase();

        return creator === me || receiver === me;
      });

      setRequests([...filteredRequests].sort((a, b) => b.id - a.id));
    } catch {
      toast.error("Requests could not be loaded");
    } finally {
      setLoading(false);
    }
  };

  const buildDescription = (
    selectedType = type,
    description = desc,
    selectedRole = targetRole,
    selectedTeam = targetTeam,
    selectedTaskInfo = taskInfo,
    selectedDeadlineDate = deadlineDate
  ) => {
    if (selectedType === "ROLE_CHANGE") {
      return `Requested Role: ${selectedRole}\n\n${description}`;
    }

    if (selectedType === "TEAM_CHANGE") {
      return `Requested Team: ${selectedTeam}\n\n${description}`;
    }

    if (selectedType === "TASK_HELP") {
      return `Task Info: ${selectedTaskInfo}\n\n${description}`;
    }

    if (selectedType === "DEADLINE_EXTENSION") {
      return `Requested Deadline: ${selectedDeadlineDate || "-"}\nTask Info: ${selectedTaskInfo || "-"}\n\n${description}`;
    }

    if (selectedType === "BUG_REPORT") {
      return `Bug Details:\n${description}`;
    }

    return description;
  };

  const resetCreateForm = () => {
    setDesc("");
    setTaskInfo("");
    setDeadlineDate("");
  };

  const createRequest = async () => {
    if (!desc.trim()) {
      toast.error("Description cannot be empty");
      return;
    }

    if ((type === "TASK_HELP" || type === "DEADLINE_EXTENSION") && !taskInfo.trim()) {
      toast.error("Task info is required");
      return;
    }

    if (type === "DEADLINE_EXTENSION" && !deadlineDate) {
      toast.error("Deadline date is required");
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        description: buildDescription(),
        createdBy: email,
        status: "PENDING",
      }),
    });

    if (!res.ok) {
      toast.error("Request could not be created");
      return;
    }

    resetCreateForm();
    fetchRequests(email);
    toast.success("Request created");
  };

  const updateStatus = async (id: number, status: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewedBy: email }),
    });

    if (!res.ok) {
      toast.error("Status could not be updated");
      return;
    }

    fetchRequests(email);
    toast.success(`Request ${status.toLowerCase()}`);
  };

  const extractMainDescription = (request: RequestItem) => {
    const description = request.description || "";

    if (request.type === "ROLE_CHANGE") return description.split("\n").slice(2).join("\n").trim();
    if (request.type === "TEAM_CHANGE") return description.split("\n").slice(2).join("\n").trim();
    if (request.type === "TASK_HELP") return description.split("\n").slice(2).join("\n").trim();
    if (request.type === "DEADLINE_EXTENSION") return description.split("\n").slice(3).join("\n").trim();
    if (request.type === "BUG_REPORT") return description.replace("Bug Details:", "").trim();

    return description;
  };

  const startEditRequest = (request: RequestItem) => {
    const description = request.description || "";
    const lines = description.split("\n");

    setEditingRequestId(request.id);
    setEditType(request.type || "GENERAL");
    setEditDesc(extractMainDescription(request));
    setEditTargetRole("DEVELOPER");
    setEditTargetTeam("Frontend");
    setEditTaskInfo("");
    setEditDeadlineDate("");

    if (request.type === "ROLE_CHANGE") {
      const roleLine = lines.find((line) => line.startsWith("Requested Role:"));
      setEditTargetRole(roleLine?.replace("Requested Role:", "").trim() || "DEVELOPER");
    }

    if (request.type === "TEAM_CHANGE") {
      const teamLine = lines.find((line) => line.startsWith("Requested Team:"));
      setEditTargetTeam(teamLine?.replace("Requested Team:", "").trim() || "Frontend");
    }

    if (request.type === "TASK_HELP") {
      const taskLine = lines.find((line) => line.startsWith("Task Info:"));
      setEditTaskInfo(taskLine?.replace("Task Info:", "").trim() || "");
    }

    if (request.type === "DEADLINE_EXTENSION") {
      const deadlineLine = lines.find((line) => line.startsWith("Requested Deadline:"));
      const taskLine = lines.find((line) => line.startsWith("Task Info:"));
      setEditDeadlineDate(deadlineLine?.replace("Requested Deadline:", "").trim() || "");
      setEditTaskInfo(taskLine?.replace("Task Info:", "").trim() || "");
    }
  };

  const cancelEditRequest = () => {
    setEditingRequestId(null);
    setEditType("GENERAL");
    setEditDesc("");
    setEditTargetRole("DEVELOPER");
    setEditTargetTeam("Frontend");
    setEditTaskInfo("");
    setEditDeadlineDate("");
  };

  const updateRequest = async (request: RequestItem) => {
    if (!editDesc.trim()) {
      toast.error("Description cannot be empty");
      return;
    }

    if ((editType === "TASK_HELP" || editType === "DEADLINE_EXTENSION") && !editTaskInfo.trim()) {
      toast.error("Task info is required");
      return;
    }

    if (editType === "DEADLINE_EXTENSION" && !editDeadlineDate) {
      toast.error("Deadline date is required");
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests/${request.id}/edit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: editType,
        description: buildDescription(
          editType,
          editDesc,
          editTargetRole,
          editTargetTeam,
          editTaskInfo,
          editDeadlineDate
        ),
      }),
    });

    if (!res.ok) {
      toast.error("Request could not be updated");
      return;
    }

    cancelEditRequest();
    fetchRequests(email);
    toast.success("Request updated");
  };

  const deleteRequest = async (request: RequestItem) => {
    if (!window.confirm("Delete this request?")) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests/${request.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      toast.error("Request could not be deleted");
      return;
    }

    fetchRequests(email);
    toast.success("Request deleted");
  };

  const goToProfile = (userEmail?: string | null) => {
    if (!userEmail) return;
    router.push(`/dashboard/profile/${encodeURIComponent(userEmail.trim())}`);
  };

  const getStatusClass = (status: string) => {
    if (status === "APPROVED") return "bg-green-100 text-green-700";
    if (status === "REJECTED") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  if (loading) {
    return <p className="p-6">Loading requests...</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-100 to-cyan-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Requests</h1>
            <p className="text-sm text-slate-500">
              Create role, team, task and support requests
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="bg-white/75 backdrop-blur-xl border-white/60 border px-4 py-2 rounded-xl shadow-sm"
          >
            Back
          </button>
        </div>

        <div className="bg-white/75 backdrop-blur-xl p-5 rounded-2xl shadow mb-6 space-y-4">
          <h2 className="font-bold text-lg">Create Request</h2>

          <select
            className="border border-white/60 bg-white/80 backdrop-blur p-3 w-full rounded-xl"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              resetCreateForm();
            }}
          >
            {requestTypes.map((rt) => (
              <option key={rt} value={rt}>{rt}</option>
            ))}
          </select>

          {type === "ROLE_CHANGE" && (
            <select className="border border-white/60 bg-white/80 backdrop-blur p-3 w-full rounded-xl" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}

          {type === "TEAM_CHANGE" && (
            <select className="border border-white/60 bg-white/80 backdrop-blur p-3 w-full rounded-xl" value={targetTeam} onChange={(e) => setTargetTeam(e.target.value)}>
              {teams.map((team) => <option key={team} value={team}>{team}</option>)}
            </select>
          )}

          {(type === "TASK_HELP" || type === "DEADLINE_EXTENSION") && (
            <input className="border border-white/60 bg-white/80 backdrop-blur p-3 w-full rounded-xl" placeholder="Task id" value={taskInfo} onChange={(e) => setTaskInfo(e.target.value)} />
          )}

          {type === "DEADLINE_EXTENSION" && (
            <input type="date" className="border border-white/60 bg-white/80 backdrop-blur p-3 w-full rounded-xl" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} />
          )}

          <textarea
            className="border border-white/60 bg-white/80 backdrop-blur p-3 w-full rounded-xl min-h-[120px]"
            placeholder="Explain your request..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />

          <button onClick={createRequest} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold">
            Create Request
          </button>
        </div>

        <div className="space-y-3">
          {requests.length === 0 ? (
            <p className="text-slate-500">No requests yet.</p>
          ) : (
            requests.map((r) => {
              const isOwnRequest = (r.createdBy || "").toLowerCase() === email.toLowerCase();
              const isReceiver = (r.receiverEmail || "").toLowerCase() === email.toLowerCase();

              const canEditOrDelete = isOwnRequest && r.status === "PENDING";
              const canApproveOrReject = isReceiver && r.status === "PENDING";

              return (
                <div key={r.id} className="bg-white/75 backdrop-blur-xl border-white/60 border p-5 rounded-2xl shadow-sm">
                  {editingRequestId === r.id ? (
                    <div className="space-y-3">
                      <select
                        className="border border-white/60 bg-white/80 backdrop-blur p-3 w-full rounded-xl"
                        value={editType}
                        onChange={(e) => {
                          setEditType(e.target.value);
                          setEditDesc("");
                          setEditTaskInfo("");
                          setEditDeadlineDate("");
                        }}
                      >
                        {requestTypes.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
                      </select>

                      {editType === "ROLE_CHANGE" && (
                        <select className="border border-white/60 bg-white/80 backdrop-blur p-3 w-full rounded-xl" value={editTargetRole} onChange={(e) => setEditTargetRole(e.target.value)}>
                          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      )}

                      {editType === "TEAM_CHANGE" && (
                        <select className="border border-white/60 bg-white/80 backdrop-blur p-3 w-full rounded-xl" value={editTargetTeam} onChange={(e) => setEditTargetTeam(e.target.value)}>
                          {teams.map((team) => <option key={team} value={team}>{team}</option>)}
                        </select>
                      )}

                      {(editType === "TASK_HELP" || editType === "DEADLINE_EXTENSION") && (
                        <input className="border border-white/60 bg-white/80 backdrop-blur p-3 w-full rounded-xl" placeholder="Task id" value={editTaskInfo} onChange={(e) => setEditTaskInfo(e.target.value)} />
                      )}

                      {editType === "DEADLINE_EXTENSION" && (
                        <input type="date" className="border border-white/60 bg-white/80 backdrop-blur p-3 w-full rounded-xl" value={editDeadlineDate} onChange={(e) => setEditDeadlineDate(e.target.value)} />
                      )}

                      <textarea className="border border-white/60 bg-white/80 backdrop-blur p-3 w-full rounded-xl min-h-[120px]" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />

                      <div className="flex gap-2">
                        <button onClick={() => updateRequest(r)} className="bg-green-500 text-white px-4 py-2 rounded-lg">
                          Save
                        </button>

                        <button onClick={cancelEditRequest} className="bg-gray-400 text-white px-4 py-2 rounded-lg">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">{r.type}</p>

                          <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">
                            {r.description}
                          </p>

                          <p className="text-xs text-slate-500 mt-3">
                            Created By:{" "}
                            <button onClick={() => goToProfile(r.createdBy)} className="text-blue-600 underline">
                              {r.createdBy}
                            </button>

                            {isOwnRequest && (
                              <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                You
                              </span>
                            )}
                          </p>

                          <p className="text-xs text-slate-500 mt-2">
                            Receiver:{" "}
                            {r.receiverEmail ? (
                              <button onClick={() => goToProfile(r.receiverEmail)} className="text-blue-600 underline">
                                {r.receiverEmail}
                              </button>
                            ) : (
                              <span className="text-slate-400">
                                Assigned by system
                              </span>
                            )}
                          </p>
                        </div>

                        <span className={`h-fit px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(r.status || "PENDING")}`}>
                          {r.status || "PENDING"}
                        </span>
                      </div>

                      <div className="flex gap-2 mt-4 flex-wrap">
                        {canApproveOrReject && (
                          <>
                            <button onClick={() => updateStatus(r.id, "APPROVED")} className="bg-green-500 text-white px-4 py-2 rounded-lg">
                              Approve
                            </button>

                            <button onClick={() => updateStatus(r.id, "REJECTED")} className="bg-red-500 text-white px-4 py-2 rounded-lg">
                              Reject
                            </button>
                          </>
                        )}

                        {canEditOrDelete && (
                          <>
                            <button onClick={() => startEditRequest(r)} className="bg-yellow-500 text-white px-4 py-2 rounded-lg">
                              Edit
                            </button>

                            <button onClick={() => deleteRequest(r)} className="bg-red-500 text-white px-4 py-2 rounded-lg">
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}