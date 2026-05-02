"use client";

import { useEffect, useState } from "react";

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [type, setType] = useState("");
  const [desc, setDesc] = useState("");

  const role =
    typeof window !== "undefined" ? localStorage.getItem("role") : "";

  const email =
    typeof window !== "undefined" ? localStorage.getItem("email") : "";

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests`);
    const data = await res.json();
    setRequests(Array.isArray(data) ? data : []);
  };

  const createRequest = async () => {
    if (!type.trim() || !desc.trim()) return;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        description: desc,
        createdBy: email,
      }),
    });

    setType("");
    setDesc("");
    fetchRequests();
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    fetchRequests();
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Requests</h1>

      <div className="bg-white p-4 rounded-xl shadow mb-4 space-y-2">
        <input
          className="border p-2 w-full rounded"
          placeholder="Request type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        />

        <textarea
          className="border p-2 w-full rounded"
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        <button
          onClick={createRequest}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Create Request
        </button>
      </div>

      <div className="space-y-2">
        {requests.length === 0 ? (
          <p className="text-gray-500">No requests yet.</p>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="bg-white border p-3 rounded-xl">
              <p className="font-semibold">{r.type}</p>
              <p className="text-sm">{r.description}</p>
              <p className="text-xs text-gray-500">
                Created by: {r.createdBy}
              </p>
              <p className="text-xs text-blue-500">Status: {r.status}</p>

              {(role === "ADMIN" || role === "MANAGER") && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => updateStatus(r.id, "APPROVED")}
                    className="bg-green-500 text-white px-3 py-1 rounded"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => updateStatus(r.id, "REJECTED")}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}