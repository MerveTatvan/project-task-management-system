"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type RequestItem = {
  id: number;
  type: string;
  description: string;
  createdBy: string;
  status: string;
};

const requestTypes = [
  "ROLE_CHANGE",
  "TEAM_CHANGE",
  "TASK_HELP",
  "DEADLINE_EXTENSION",
  "BUG_REPORT",
  "GENERAL",
];

const roles = ["WORKER", "DEVELOPER", "MANAGER"];
const teams = ["Frontend", "Backend", "Database", "QA", "DevOps", "UI/UX", "IT", "ARGE"];

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [type, setType] = useState("GENERAL");
  const [desc, setDesc] = useState("");
  const [targetRole, setTargetRole] = useState("DEVELOPER");
  const [targetTeam, setTargetTeam] = useState("Frontend");
  const [taskInfo, setTaskInfo] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const role =
    typeof window !== "undefined" ? localStorage.getItem("role") : "";

  const email =
    typeof window !== "undefined" ? localStorage.getItem("email") : "";

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Requests could not be loaded");
    } finally {
      setLoading(false);
    }
  };

  const buildDescription = () => {
    if (type === "ROLE_CHANGE") {
      return `Requested Role: ${targetRole}\n\n${desc}`;
    }

    if (type === "TEAM_CHANGE") {
      return `Requested Team: ${targetTeam}\n\n${desc}`;
    }

    if (type === "TASK_HELP") {
      return `Task Info: ${taskInfo}\n\n${desc}`;
    }

    if (type === "DEADLINE_EXTENSION") {
      return `Requested Deadline: ${deadlineDate || "-"}\nTask Info: ${taskInfo || "-"}\n\n${desc}`;
    }

    if (type === "BUG_REPORT") {
      return `Bug Details:\n${desc}`;
    }

    return desc;
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

    setDesc("");
    setTaskInfo("");
    setDeadlineDate("");
    fetchRequests();
    toast.success("Request created");
  };

  const updateStatus = async (id: number, status: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      toast.error("Status could not be updated");
      return;
    }

    fetchRequests();
    toast.success(`Request ${status.toLowerCase()}`);
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
    <div className="min-h-screen bg-slate-100 p-6">
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
            className="bg-white border px-4 py-2 rounded-xl shadow-sm"
          >
            Back
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow mb-6 space-y-4">
          <h2 className="font-bold text-lg">Create Request</h2>

          <select
            className="border p-3 w-full rounded-xl"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setDesc("");
              setTaskInfo("");
              setDeadlineDate("");
            }}
          >
            {requestTypes.map((rt) => (
              <option key={rt} value={rt}>
                {rt}
              </option>
            ))}
          </select>

          {type === "ROLE_CHANGE" && (
            <select
              className="border p-3 w-full rounded-xl"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}

          {type === "TEAM_CHANGE" && (
            <select
              className="border p-3 w-full rounded-xl"
              value={targetTeam}
              onChange={(e) => setTargetTeam(e.target.value)}
            >
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          )}

          {(type === "TASK_HELP" || type === "DEADLINE_EXTENSION") && (
            <input
              className="border p-3 w-full rounded-xl"
              placeholder="Task title or task id"
              value={taskInfo}
              onChange={(e) => setTaskInfo(e.target.value)}
            />
          )}

          {type === "DEADLINE_EXTENSION" && (
            <input
              type="date"
              className="border p-3 w-full rounded-xl"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
            />
          )}

          <textarea
            className="border p-3 w-full rounded-xl min-h-[120px]"
            placeholder="Explain your request..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />

          <button
            onClick={createRequest}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold"
          >
            Create Request
          </button>
        </div>

        <div className="space-y-3">
          {requests.length === 0 ? (
            <p className="text-slate-500">No requests yet.</p>
          ) : (
            requests.map((r) => {
              const isOwnRequest = r.createdBy === email;

              return (
                <div key={r.id} className="bg-white border p-5 rounded-2xl shadow-sm">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{r.type}</p>
                      <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">
                        {r.description}
                      </p>

                      <p className="text-xs text-slate-500 mt-3">
                        Created By:{" "}
                        <button
                          onClick={() => goToProfile(r.createdBy)}
                          className="text-blue-600 underline"
                        >
                          {r.createdBy}
                        </button>

                        {isOwnRequest && (
                          <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </p>
                    </div>

                    <span
                      className={`h-fit px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(
                        r.status || "PENDING"
                      )}`}
                    >
                      {r.status || "PENDING"}
                    </span>
                  </div>

                  {(role === "ADMIN" || role === "MANAGER") && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => updateStatus(r.id, "APPROVED")}
                        disabled={r.status === "APPROVED"}
                        className="bg-green-500 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => updateStatus(r.id, "REJECTED")}
                        disabled={r.status === "REJECTED"}
                        className="bg-red-500 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
                      >
                        Reject
                      </button>
                    </div>
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