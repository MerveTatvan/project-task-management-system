"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Message = {
  id: number;
  sender: string;
  receiver: string;
  text: string;
  timestamp: string;
};

type User = {
  id?: number;
  email: string;
  name?: string;
  surname?: string;
  role?: string;
  department?: string;
};

export default function MessagesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const router = useRouter();

  const currentEmail =
    typeof window !== "undefined" ? localStorage.getItem("email") : "";

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser?.email) {
      fetchMessages(selectedUser.email);
    }
  }, [selectedUser]);

  const currentUserInitial = useMemo(() => {
    return currentEmail?.charAt(0)?.toUpperCase() || "U";
  }, [currentEmail]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`);
      const data = await res.json();

      const filtered = Array.isArray(data)
        ? data.filter((u) => u.email !== currentEmail)
        : [];

      setUsers(filtered);
    } catch {
      toast.error("Users could not be loaded");
    }
  };

  const fetchMessages = async (otherEmail: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messages/chat?user1=${encodeURIComponent(
          currentEmail || ""
        )}&user2=${encodeURIComponent(otherEmail)}`
      );

      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Messages could not be loaded");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: currentEmail,
        receiver: selectedUser.email,
        text: newMessage.trim(),
      }),
    });

    if (!res.ok) {
      toast.error("Message could not be sent");
      return;
    }

    setNewMessage("");
    fetchMessages(selectedUser.email);
  };

  const deleteMessage = async (id: number) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      toast.error("Message could not be deleted");
      return;
    }

    if (selectedUser) {
      fetchMessages(selectedUser.email);
    }
  };

  const updateMessage = async (id: number) => {
    if (!editingText.trim()) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: editingText.trim(),
      }),
    });

    if (!res.ok) {
      toast.error("Message could not be updated");
      return;
    }

    setEditingId(null);
    setEditingText("");

    if (selectedUser) {
      fetchMessages(selectedUser.email);
    }
  };

  const goToProfile = (email: string) => {
    router.push(`/dashboard/profile/${encodeURIComponent(email)}`);
  };

  const getDisplayName = (user: User) => {
    const fullName = `${user.name || ""} ${user.surname || ""}`.trim();
    return fullName || user.email;
  };

  const getInitials = (user: User) => {
    const nameInitial = user.name?.charAt(0) || "";
    const surnameInitial = user.surname?.charAt(0) || "";

    const initials = `${nameInitial}${surnameInitial}`.trim();

    if (initials) return initials.toUpperCase();

    return user.email?.charAt(0)?.toUpperCase() || "U";
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return timestamp;
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
    return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
            <p className="text-sm text-slate-500">
              Communicate with teammates and managers
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="bg-white hover:bg-slate-50 border text-slate-700 px-4 py-2 rounded-xl shadow-sm"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[720px] border">
          <aside className="md:col-span-4 lg:col-span-3 border-r bg-slate-50">
            <div className="p-4 border-b bg-white">
              <p className="text-sm font-bold text-slate-800">Conversations</p>
              <p className="text-xs text-slate-400">{users.length} users available</p>
            </div>

            <div className="p-3 space-y-2 overflow-y-auto max-h-[650px]">
              {users.length === 0 ? (
                <p className="text-sm text-slate-400 p-3">No users found.</p>
              ) : (
                users.map((u) => (
                  <button
                    key={u.email}
                    onClick={() => {
                      setSelectedUser(u);
                      setEditingId(null);
                      setEditingText("");
                    }}
                    className={`w-full text-left p-3 rounded-2xl transition flex gap-3 items-center ${
                      selectedUser?.email === u.email
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white hover:bg-slate-100 border text-slate-700"
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-bold ${
                        selectedUser?.email === u.email
                          ? "bg-white text-blue-600"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {getInitials(u)}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold truncate">{getDisplayName(u)}</p>
                      <p
                        className={`text-xs truncate ${
                          selectedUser?.email === u.email
                            ? "text-blue-100"
                            : "text-slate-400"
                        }`}
                      >
                        {u.role || "USER"} • {u.department || "No Team"}
                      </p>
                      <p
                        className={`text-[11px] truncate ${
                          selectedUser?.email === u.email
                            ? "text-blue-100"
                            : "text-slate-400"
                        }`}
                      >
                        {u.email}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          <main className="md:col-span-8 lg:col-span-9 flex flex-col bg-white">
            {selectedUser ? (
              <>
                <div className="p-5 border-b flex justify-between items-center bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      {getInitials(selectedUser)}
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">
                        {getDisplayName(selectedUser)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => goToProfile(selectedUser.email)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm"
                  >
                    View Profile
                  </button>
                </div>

                <div className="flex-1 p-5 overflow-y-auto bg-gradient-to-b from-slate-50 to-white space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl mb-3">
                        💬
                      </div>
                      <p className="font-semibold">No messages yet</p>
                      <p className="text-sm">Start the conversation below.</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender === currentEmail;

                      return (
                        <div
                          key={m.id}
                          className={`flex items-end gap-2 ${
                            isMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                              {getInitials(selectedUser)}
                            </div>
                          )}

                          <div
                            className={`max-w-[75%] rounded-3xl px-4 py-3 shadow-sm ${
                              isMe
                                ? "bg-blue-600 text-white rounded-br-md"
                                : "bg-white border text-slate-800 rounded-bl-md"
                            }`}
                          >
                            {editingId === m.id ? (
                              <div className="space-y-2">
                                <textarea
                                  className="text-slate-900 bg-white border p-2 w-full rounded-xl min-w-[260px]"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                />

                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => updateMessage(m.id)}
                                    className="bg-green-500 text-white text-xs px-3 py-1 rounded-lg"
                                  >
                                    Save
                                  </button>

                                  <button
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditingText("");
                                    }}
                                    className="bg-slate-200 text-slate-700 text-xs px-3 py-1 rounded-lg"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {m.text}
                                </p>

                                <div
                                  className={`flex items-center gap-2 mt-2 text-[11px] ${
                                    isMe ? "text-blue-100" : "text-slate-400"
                                  }`}
                                >
                                  <span>{formatTime(m.timestamp)}</span>

                                  {isMe && (
                                    <>
                                      <span>•</span>
                                      <button
                                        onClick={() => {
                                          setEditingId(m.id);
                                          setEditingText(m.text);
                                        }}
                                        className="underline"
                                      >
                                        Edit
                                      </button>

                                      <button
                                        onClick={() => deleteMessage(m.id)}
                                        className="underline"
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>

                          {isMe && (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                              {currentUserInitial}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-5 border-t bg-white">
                  <div className="flex gap-3 items-end">
                    <textarea
                      className="border p-3 flex-1 rounded-2xl resize-none min-h-[52px] max-h-32 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                    />

                    <button
                      onClick={sendMessage}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-sm"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-4xl mb-4">
                  ✉️
                </div>
                <h2 className="text-xl font-bold text-slate-600">
                  Select a conversation
                </h2>
                <p className="text-sm max-w-sm">
                  Choose a teammate from the left panel to start messaging.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
