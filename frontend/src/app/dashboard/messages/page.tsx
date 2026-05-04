// Target file: frontend/src/app/dashboard/messages/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Message = {
  id: number;
  sender: string;
  receiver: string;
  text: string;
  timestamp: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
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

export default function MessagesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(
    null
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [messageFile, setMessageFile] = useState<{
    fileUrl: string;
    fileName: string;
    fileType: string;
  } | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [clearingChat, setClearingChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();

  const [currentEmail, setCurrentEmail] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("email") || "";

    if (!storedEmail) {
      router.push("/login");
      return;
    }

    setCurrentEmail(storedEmail);
    fetchUsers(storedEmail);
  }, []);

  useEffect(() => {
    if (!selectedUser?.email || !currentEmail) return;

    fetchMessages(selectedUser.email, true);

    const interval = window.setInterval(() => {
      fetchMessages(selectedUser.email, false);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [selectedUser, currentEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const currentUserInitial = useMemo(() => {
    if (currentUserProfile?.name || currentUserProfile?.surname) {
      return `${currentUserProfile?.name?.charAt(0) || ""}${
        currentUserProfile?.surname?.charAt(0) || ""
      }`.toUpperCase();
    }

    return currentEmail?.charAt(0)?.toUpperCase() || "U";
  }, [currentEmail, currentUserProfile]);

  const normalizeEmail = (email?: string | null) => {
    return (email || "").trim().toLowerCase();
  };

  const sortMessages = (list: Message[]) => {
    return [...list].sort((a, b) => {
      const aTime = new Date(a.timestamp || "").getTime() || a.id || 0;
      const bTime = new Date(b.timestamp || "").getTime() || b.id || 0;
      return aTime - bTime;
    });
  };

  const uniqueMessages = (list: Message[]) => {
    const map = new Map<number, Message>();

    list.forEach((message) => {
      map.set(message.id, message);
    });

    return sortMessages(Array.from(map.values()));
  };

  const fetchUsers = async (emailParam?: string) => {
    try {
      const activeEmail =
        emailParam || currentEmail || localStorage.getItem("email") || "";

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`);
      const data = await res.json();

      if (!Array.isArray(data)) {
        setUsers([]);
        return;
      }

      const me = data.find(
        (u) => normalizeEmail(u.email) === normalizeEmail(activeEmail)
      );
      setCurrentUserProfile(me || null);

      const filtered = data.filter(
        (u) => normalizeEmail(u.email) !== normalizeEmail(activeEmail)
      );
      setUsers(filtered);
    } catch {
      toast.error("Users could not be loaded");
    }
  };

  const fetchMessages = async (otherEmail: string, allowEmptyReplace = true) => {
    try {
      const activeEmail = currentEmail || localStorage.getItem("email") || "";

      if (!activeEmail || !otherEmail) {
        if (allowEmptyReplace) setMessages([]);
        return;
      }

      let combinedMessages: Message[] = [];

      const chatRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messages/chat?user1=${encodeURIComponent(
          activeEmail
        )}&user2=${encodeURIComponent(otherEmail)}`
      );

      if (chatRes.ok) {
        const chatData = await chatRes.json();

        if (Array.isArray(chatData)) {
          combinedMessages = [...combinedMessages, ...chatData];
        }
      }

      const allRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messages/${encodeURIComponent(
          activeEmail
        )}`
      );

      if (allRes.ok) {
        const allData = await allRes.json();

        const filtered = Array.isArray(allData)
          ? allData.filter(
              (m) =>
                (normalizeEmail(m.sender) === normalizeEmail(activeEmail) &&
                  normalizeEmail(m.receiver) === normalizeEmail(otherEmail)) ||
                (normalizeEmail(m.sender) === normalizeEmail(otherEmail) &&
                  normalizeEmail(m.receiver) === normalizeEmail(activeEmail))
            )
          : [];

        combinedMessages = [...combinedMessages, ...filtered];
      }

      const cleanedMessages = uniqueMessages(combinedMessages);

      setMessages((prev) => {
        const hasOnlyTempMessages = prev.some((m) => m.id > 1000000000000);

        if (cleanedMessages.length === 0 && !allowEmptyReplace && prev.length > 0) {
          return prev;
        }

        if (cleanedMessages.length === 0 && hasOnlyTempMessages) {
          return prev;
        }

        return cleanedMessages;
      });
    } catch {
      toast.error("Messages could not be loaded");
    }
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

  const handleMessageFileChange = (file?: File | null) => {
    if (!file) return;

    const MAX_FILE_SIZE = 500 * 1024;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File must be smaller than 500 KB");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setMessageFile({
        fileUrl: String(reader.result || ""),
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
      });
    };

    reader.readAsDataURL(file);
  };

  const clearMessageFile = () => {
    setMessageFile(null);
  };

  const UserAvatar = ({
    user,
    fallback,
    size = "md",
  }: {
    user?: User | null;
    fallback?: string;
    size?: "sm" | "md" | "lg";
  }) => {
    const image = getProfileImage(user);

    const sizeClass =
      size === "lg"
        ? "w-12 h-12 text-sm"
        : size === "sm"
        ? "w-8 h-8 text-xs"
        : "w-11 h-11 text-sm";

    return (
      <div
        className={`${sizeClass} shrink-0 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-700 flex items-center justify-center font-black overflow-hidden border-2 border-white shadow-sm`}
      >
        {image ? (
          <img
            src={image}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          fallback || "U"
        )}
      </div>
    );
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !messageFile) || !selectedUser) return;

    const activeEmail = currentEmail || localStorage.getItem("email") || "";

    if (!activeEmail) {
      toast.error("User session not found");
      router.push("/login");
      return;
    }

    const messageText = newMessage.trim();
    const selectedFile = messageFile;

    const tempMessage: Message = {
      id: Date.now(),
      sender: activeEmail,
      receiver: selectedUser.email,
      text: messageText,
      timestamp: new Date().toISOString(),
      fileUrl: selectedFile?.fileUrl || null,
      fileName: selectedFile?.fileName || null,
      fileType: selectedFile?.fileType || null,
    };

    setMessages((prev) => uniqueMessages([...prev, tempMessage]));
    setNewMessage("");
    clearMessageFile();

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: activeEmail,
        receiver: selectedUser.email,
        text: messageText,
        fileUrl: selectedFile?.fileUrl || null,
        fileName: selectedFile?.fileName || null,
        fileType: selectedFile?.fileType || null,
      }),
    });

    if (!res.ok) {
      toast.error("Message could not be sent");
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      return;
    }

    fetchMessages(selectedUser.email, false);
  };

  const deleteMessage = async (id: number) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/messages/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!res.ok) {
      toast.error("Message could not be deleted");
      return;
    }

    if (selectedUser) {
      fetchMessages(selectedUser.email, true);
    }
  };

  const clearChat = async () => {
    if (!selectedUser || !currentEmail) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the entire conversation with ${getDisplayName(
        selectedUser
      )}?`
    );

    if (!confirmed) return;

    setClearingChat(true);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/messages/chat?user1=${encodeURIComponent(
        currentEmail
      )}&user2=${encodeURIComponent(selectedUser.email)}`,
      {
        method: "DELETE",
      }
    );

    setClearingChat(false);

    if (!res.ok) {
      toast.error("Conversation could not be deleted");
      return;
    }

    setMessages([]);
    toast.success("Conversation deleted");
  };

  const updateMessage = async (id: number) => {
    if (!editingText.trim()) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/messages/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...messages.find((message) => message.id === id),
          text: editingText.trim(),
        }),
      }
    );

    if (!res.ok) {
      toast.error("Message could not be updated");
      return;
    }

    setEditingId(null);
    setEditingText("");

    if (selectedUser) {
      fetchMessages(selectedUser.email, true);
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
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-100 to-cyan-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-white/75 backdrop-blur rounded-3xl shadow-2xl shadow-blue-500/15 border border-indigo-100 p-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold mb-3 border border-indigo-100">
              Team Communication
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              Messages
            </h1>

            <p className="text-sm text-slate-500 mt-3 max-w-3xl">
              Communicate with teammates and managers in a focused workspace.
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="absolute right-6 top-6 bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-sm"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white/75 rounded-3xl shadow-2xl shadow-blue-500/15 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[720px] border border-indigo-100">
          <aside className="md:col-span-4 lg:col-span-3 border-r border-indigo-100 bg-gradient-to-b from-indigo-50/70 via-white to-blue-50/70">
            <div className="p-4 border-b border-indigo-100 bg-white">
              <p className="text-sm font-black text-slate-800">
                Conversations
              </p>
              <p className="text-xs text-slate-400">
                {users.length} users available
              </p>
            </div>

            <div className="p-3 space-y-2 overflow-y-auto max-h-[650px]">
              {users.length === 0 ? (
                <p className="text-sm text-slate-400 p-3">No users found.</p>
              ) : (
                users.map((u) => {
                  const selected = selectedUser?.email === u.email;

                  return (
                    <button
                      key={u.email}
                      onClick={() => {
                        setSelectedUser(u);
                        setMessages([]);
                        setEditingId(null);
                        setEditingText("");
                      }}
                      className={`w-full text-left p-3 rounded-2xl transition flex gap-3 items-center ${
                        selected
                          ? "bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 text-white shadow-xl shadow-blue-500/10 shadow-blue-500/10"
                          : "bg-white hover:bg-indigo-50 border border-slate-100 text-slate-700"
                      }`}
                    >
                      <UserAvatar
                        user={u}
                        fallback={getInitials(u)}
                        size="md"
                      />

                      <div className="min-w-0">
                        <p className="font-bold truncate">
                          {getDisplayName(u)}
                        </p>

                        <p
                          className={`text-xs truncate ${
                            selected ? "text-indigo-100" : "text-slate-400"
                          }`}
                        >
                          {u.role || "USER"} • {u.department || "No Team"}
                        </p>

                        <p
                          className={`text-[11px] truncate ${
                            selected ? "text-indigo-100" : "text-slate-400"
                          }`}
                        >
                          {u.email}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <main className="md:col-span-8 lg:col-span-9 flex flex-col bg-white">
            {selectedUser ? (
              <>
                <div className="p-5 border-b border-indigo-100 flex justify-between items-center bg-white">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      user={selectedUser}
                      fallback={getInitials(selectedUser)}
                      size="lg"
                    />

                    <div>
                      <p className="font-black text-slate-900">
                        {getDisplayName(selectedUser)}
                      </p>

                      <p className="text-xs text-slate-500">
                        {selectedUser.role || "USER"} • {" "}
                        {selectedUser.department || "No Team"}
                      </p>

                      <p className="text-[11px] text-slate-400">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <button
                      onClick={clearChat}
                      disabled={clearingChat || messages.length === 0}
                      className="bg-rose-50 hover:bg-rose-100 disabled:bg-white/60 disabled:text-slate-400 text-rose-600 px-4 py-2 rounded-2xl text-sm font-bold border border-rose-100"
                    >
                      {clearingChat ? "Deleting..." : "Clear Chat"}
                    </button>

                    <button
                      onClick={() => goToProfile(selectedUser.email)}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-2xl text-sm font-bold border border-indigo-100"
                    >
                      View Profile
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-5 overflow-y-auto bg-gradient-to-b from-indigo-50/70 via-slate-50 to-white space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                      <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl mb-3">
                        💬
                      </div>

                      <p className="font-bold text-slate-600">
                        No messages yet
                      </p>

                      <p className="text-sm">
                        Start the conversation below.
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = normalizeEmail(m.sender) === normalizeEmail(currentEmail);

                      return (
                        <div
                          key={m.id}
                          className={`flex items-end gap-2 ${
                            isMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!isMe && (
                            <button
                              onClick={() => goToProfile(selectedUser.email)}
                            >
                              <UserAvatar
                                user={selectedUser}
                                fallback={getInitials(selectedUser)}
                                size="sm"
                              />
                            </button>
                          )}

                          <div
                            className={`max-w-[75%] rounded-3xl px-4 py-3 shadow-sm ${
                              isMe
                                ? "bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 text-white rounded-br-md"
                                : "bg-white/75 backdrop-blur-xl border-white/60 border border-slate-200 text-slate-800 rounded-bl-md"
                            }`}
                          >
                            {editingId === m.id ? (
                              <div className="space-y-2">
                                <textarea
                                  className="text-slate-900 bg-white/75 backdrop-blur-xl border-white/60 border border-slate-200 p-2 w-full rounded-xl min-w-[260px]"
                                  value={editingText}
                                  onChange={(e) =>
                                    setEditingText(e.target.value)
                                  }
                                />

                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => updateMessage(m.id)}
                                    className="bg-emerald-500 text-white text-xs px-3 py-1 rounded-lg"
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
                                {m.text && (
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                    {m.text}
                                  </p>
                                )}

                                {m.fileUrl && (
                                  <div
                                    className={`mt-3 rounded-2xl p-3 ${
                                      isMe
                                        ? "bg-white/10 border border-white/20"
                                        : "bg-white/70 border border-slate-100"
                                    }`}
                                  >
                                    {m.fileType?.startsWith("image/") ? (
                                      <>
                                        <a
                                          href={m.fileUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="block"
                                        >
                                          <img
                                            src={m.fileUrl}
                                            alt={m.fileName || "message attachment"}
                                            className="max-h-56 rounded-xl border border-white/20 object-contain"
                                          />
                                        </a>

                                        <a
                                          href={m.fileUrl}
                                          download={m.fileName || "image"}
                                          className={`inline-flex items-center gap-2 mt-2 text-xs font-bold underline ${
                                            isMe ? "text-white" : "text-indigo-600"
                                          }`}
                                        >
                                          🖼 {m.fileName || "Download image"}
                                        </a>
                                      </>
                                    ) : (
                                      <a
                                        href={m.fileUrl}
                                        download={m.fileName || "attachment"}
                                        className={`inline-flex items-center gap-2 text-xs font-bold underline ${
                                          isMe ? "text-white" : "text-indigo-600"
                                        }`}
                                      >
                                        📎 {m.fileName || "Download attachment"}
                                      </a>
                                    )}
                                  </div>
                                )}

                                <div
                                  className={`flex items-center gap-2 mt-2 text-[11px] ${
                                    isMe ? "text-indigo-100" : "text-slate-400"
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
                            <UserAvatar
                              user={currentUserProfile}
                              fallback={currentUserInitial}
                              size="sm"
                            />
                          )}
                        </div>
                      );
                    })
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className="p-5 border-t border-indigo-100 bg-white">
                  {messageFile && (
                    <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-3 text-xs text-slate-600">
                      <div className="min-w-0">
                        <p className="font-black text-indigo-700">
                          Selected attachment
                        </p>
                        <p className="truncate">{messageFile.fileName}</p>
                      </div>

                      <button
                        onClick={clearMessageFile}
                        className="shrink-0 rounded-xl bg-white px-3 py-1 font-bold text-rose-600 border border-rose-100"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <div className="flex gap-3 items-end">
                    <textarea
                      className="border border-indigo-100 bg-white/75 backdrop-blur-xl p-3 flex-1 rounded-2xl resize-none min-h-[52px] max-h-32 focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder={`Message ${getDisplayName(selectedUser)}...`}
                    />

                    <label className="cursor-pointer bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-3 rounded-2xl font-black shadow-sm">
                      📎
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                        onChange={(e) =>
                          handleMessageFileChange(e.target.files?.[0] || null)
                        }
                      />
                    </label>

                    <button
                      onClick={sendMessage}
                      className="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 hover:opacity-90 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-blue-500/10 shadow-blue-500/10"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8 bg-gradient-to-b from-indigo-50/50 to-white">
                <div className="w-20 h-20 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-4xl mb-4">
                  ✉️
                </div>

                <h2 className="text-xl font-black text-slate-600">
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
