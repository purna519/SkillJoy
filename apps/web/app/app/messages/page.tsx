"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MainLayout } from "@repo/ui/layout";
import {
  Search,
  Send,
  Smile,
  Loader2,
  AlertCircle,
  Plus,
  X,
  User,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../../store/authStore";
import { useSocket } from "../../../store/socket-context";

interface Conversation {
  id: string;
  type: string;
  members: Array<{
    user: {
      id: string;
      username: string;
      userProfile?: { avatarUrl?: string; displayName?: string };
    };
  }>;
  messages: Message[];
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  tempId?: string;
  status?: "sending" | "delivered" | "failed";
  sender?: { username: string; userProfile?: { avatarUrl?: string } };
}

interface UserSearchResult {
  id: string;
  username: string;
  fullName: string;
  userProfile?: { avatarUrl?: string; displayName?: string };
}

export default function MessagesPage() {
  const { user, accessToken } = useAuthStore();
  const { socket, isConnected, emitWithAck } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [loading, setLoading] = useState(true);

  // New Message Modal State
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversations
  const fetchConversations = useCallback(() => {
    if (!accessToken) return;
    fetch(`${API}/messages/conversations`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setConversations(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken, API]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Set active if not set
  useEffect(() => {
    if (conversations.length > 0 && !active) {
      setActive(conversations[0] || null);
    }
  }, [conversations, active]);

  // Join conversation room + load messages when conversation changes
  useEffect(() => {
    if (!active || !socket) return;

    socket.emit("joinConversation", { conversationId: active.id });

    // Load message history
    fetch(`${API}/messages/${active.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(console.error);
  }, [active?.id, socket, accessToken, API]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket) return;

    // RULE 3: New message from server (with tempId for optimistic UI matching)
    const onNewMessage = (msg: Message) => {
      setMessages((prev) => {
        // Replace optimistic message if tempId matches
        const idx = prev.findIndex((m) => m.tempId === msg.tempId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...msg, status: "delivered" };
          return updated;
        }
        return [...prev, msg];
      });
      // Also update conversations list with last message
      fetchConversations();
    };

    // RULE 3: Ack — our message was confirmed
    const onMessageAck = ({
      tempId,
      messageId,
    }: {
      tempId: string;
      messageId: string;
    }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === tempId
            ? { ...m, id: messageId, status: "delivered" }
            : m,
        ),
      );
    };

    // RULE 3: Failed — show ❗ retry indicator
    const onMessageFailed = ({ tempId }: { tempId: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, status: "failed" } : m)),
      );
    };

    const onUserTyping = ({
      username,
      isTyping,
    }: {
      username: string;
      isTyping: boolean;
    }) => {
      setTypingUser(isTyping ? username : "");
    };

    socket.on("newMessage", onNewMessage);
    socket.on("messageAck", onMessageAck);
    socket.on("messageFailed", onMessageFailed);
    socket.on("userTyping", onUserTyping);

    return () => {
      socket.off("newMessage", onNewMessage);
      socket.off("messageAck", onMessageAck);
      socket.off("messageFailed", onMessageFailed);
      socket.off("userTyping", onUserTyping);
    };
  }, [socket, fetchConversations]);

  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !active || !socket || !user) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      tempId,
      senderId: user.id,
      content: messageInput.trim(),
      createdAt: new Date().toISOString(),
      status: "sending",
      sender: { username: user.username },
    };

    // Optimistic UI — show immediately
    setMessages((prev) => [...prev, optimisticMsg]);
    setMessageInput("");

    // RULE 3: Use emitWithAck for reliable delivery
    try {
      await emitWithAck("sendMessage", {
        conversationId: active.id,
        content: optimisticMsg.content,
        tempId,
      });
    } catch {
      // Rule 3: Server didn't ack — mark as failed, show ❗
      setMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, status: "failed" } : m)),
      );
    }
  }, [messageInput, active, socket, user, emitWithAck]);

  const handleTyping = (val: string) => {
    setMessageInput(val);
    if (!socket || !active) return;
    socket.emit("typing", { conversationId: active.id, isTyping: true });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("typing", { conversationId: active.id, isTyping: false });
    }, 1500);
  };

  // User Search Logic
  useEffect(() => {
    if (!searchQuery.trim() || !accessToken) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `${API}/users/search?q=${encodeURIComponent(searchQuery)}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        const data = await res.json();
        if (Array.isArray(data)) setSearchResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, accessToken, API]);

  const startNewConversation = async (targetUserId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API}/messages/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setShowNewMessage(false);
        setSearchQuery("");
        setSearchResults([]);
        // Refresh conversations and set active
        await fetchConversations();
        setActive(data);
      } else {
        alert(
          data.message ||
            "Failed to start conversation. Ensure you are following this user.",
        );
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while trying to start a conversation.");
    }
  };

  // Get the other person's name from conversation
  const getConvName = (conv: Conversation) => {
    const other = conv.members?.find((m) => m.user.id !== user?.id);
    return (
      other?.user.userProfile?.displayName || other?.user.username || "Unknown"
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#000",
          }}
        >
          <Loader2
            size={32}
            color="rgba(255,255,255,0.2)"
            className="animate-spin"
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div
        style={{
          height: "100vh",
          display: "flex",
          fontFamily: "'DM Sans', sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Sidebar: Conversations */}
        <div style={s.sidebar}>
          <div style={{ padding: "20px 16px 12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#fff",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Messages
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => setShowNewMessage(true)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: "#fff",
                    color: "#000",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <Search
                size={15}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.25)",
                  pointerEvents: "none",
                }}
              />
              <input
                placeholder="Search conversations..."
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  padding: "10px 10px 10px 36px",
                  fontSize: 13,
                  color: "#fff",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {conversations.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 13,
                }}
              >
                No conversations yet.
                <br />
                Click the plus icon to start chatting!
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActive(conv)}
                  style={{
                    ...s.convItem,
                    background:
                      active?.id === conv.id
                        ? "rgba(255,255,255,0.06)"
                        : "transparent",
                  }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: "rgba(255,255,255,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        fontWeight: 800,
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      {getConvName(conv).charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div
                    style={{ flex: 1, textAlign: "left", overflow: "hidden" }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#fff",
                        marginBottom: 3,
                      }}
                    >
                      {getConvName(conv)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.3)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {conv.messages?.[conv.messages.length - 1]?.content ||
                        "Start a conversation"}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: isConnected ? "#4ade80" : "#f87171",
              }}
            />
            <span
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.2)",
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {isConnected ? "Connection Live" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Chat window */}
        {active ? (
          <div style={s.chatWindow}>
            {/* Header */}
            <div style={s.chatHeader}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                {getConvName(active).charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                  {getConvName(active)}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: typingUser ? "#4ade80" : "rgba(255,255,255,0.3)",
                  }}
                >
                  {typingUser ? `${typingUser} is typing...` : "Online"}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={s.messagesArea}>
              {messages.map((msg, i) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id || i}
                    style={{
                      display: "flex",
                      justifyContent: isMe ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "65%",
                        background: isMe ? "#fff" : "rgba(255,255,255,0.06)",
                        color: isMe ? "#000" : "#fff",
                        borderRadius: isMe
                          ? "18px 18px 4px 18px"
                          : "18px 18px 18px 4px",
                        padding: "12px 16px",
                        fontSize: 14,
                        lineHeight: 1.5,
                        border: isMe
                          ? "none"
                          : "1px solid rgba(255,255,255,0.07)",
                        opacity: msg.status === "sending" ? 0.6 : 1,
                        position: "relative",
                      }}
                    >
                      {msg.content}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 4,
                          justifyContent: "flex-end",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            color: isMe
                              ? "rgba(0,0,0,0.35)"
                              : "rgba(255,255,255,0.25)",
                          }}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {/* RULE 3: Status indicators */}
                        {isMe && msg.status === "failed" && (
                          <span title="Failed to send">
                            <AlertCircle size={12} color="#f87171" />
                          </span>
                        )}
                        {isMe && msg.status === "sending" && (
                          <Loader2
                            size={10}
                            color="rgba(0,0,0,0.3)"
                            className="animate-spin"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={s.chatInput}>
              <button style={s.inputAction}>
                <Smile size={18} color="rgba(255,255,255,0.3)" />
              </button>
              <input
                value={messageInput}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && sendMessage()
                }
                placeholder={
                  isConnected ? "Send a message..." : "Connecting..."
                }
                disabled={!isConnected}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  color: "#fff",
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim() || !isConnected}
                style={{
                  ...s.inputAction,
                  background:
                    messageInput.trim() && isConnected
                      ? "#fff"
                      : "rgba(255,255,255,0.06)",
                  opacity: !isConnected ? 0.4 : 1,
                }}
              >
                <Send
                  size={16}
                  color={messageInput.trim() ? "#000" : "rgba(255,255,255,0.3)"}
                />
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#000",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ opacity: 0.2 }}>
              <MessageCircle size={48} />
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.2)",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Select a conversation to start chatting
            </p>
            <button
              onClick={() => setShowNewMessage(true)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Start New Chat
            </button>
          </div>
        )}
      </div>

      {/* ── NEW MESSAGE MODAL ── */}
      <AnimatePresence>
        {showNewMessage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewMessage(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.85)",
                backdropFilter: "blur(12px)",
                zIndex: 100,
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                position: "fixed",
                top: "15%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "min(460px, 95vw)",
                background: "#0d0d0d",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 28,
                padding: 24,
                zIndex: 101,
                maxHeight: "70vh",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#fff",
                    margin: 0,
                  }}
                >
                  New Message
                </h2>
                <button
                  onClick={() => setShowNewMessage(false)}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "none",
                    borderRadius: 10,
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={16} color="rgba(255,255,255,0.3)" />
                </button>
              </div>

              <div style={{ position: "relative", marginBottom: 16 }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(255,255,255,0.25)",
                  }}
                />
                <input
                  autoFocus
                  placeholder="Search by username or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    padding: "14px 14px 14px 44px",
                    fontSize: 14,
                    color: "#fff",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ flex: 1, overflowY: "auto", minHeight: 200 }}>
                {searchLoading ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      padding: 40,
                    }}
                  >
                    <Loader2
                      size={24}
                      color="rgba(255,255,255,0.2)"
                      className="animate-spin"
                    />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => startNewConversation(result.id)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px",
                          background: "none",
                          border: "none",
                          borderRadius: 16,
                          cursor: "pointer",
                          transition: "background 0.2s",
                          textAlign: "left",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(255,255,255,0.03)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: "rgba(255,255,255,0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {result.userProfile?.avatarUrl ? (
                            <img
                              src={result.userProfile.avatarUrl}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: 12,
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <User size={20} color="rgba(255,255,255,0.2)" />
                          )}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#fff",
                            }}
                          >
                            {result.userProfile?.displayName || result.fullName}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "rgba(255,255,255,0.3)",
                            }}
                          >
                            @{result.username}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.trim() ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "rgba(255,255,255,0.2)",
                      fontSize: 13,
                    }}
                  >
                    No users found matching &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "rgba(255,255,255,0.15)",
                      fontSize: 13,
                    }}
                  >
                    Type a name to search for users
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}

const s: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 300,
    background: "#080808",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  convItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    border: "none",
    cursor: "pointer",
    borderRadius: 0,
    fontFamily: "inherit",
    transition: "background 0.2s",
  },
  chatWindow: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#000",
  },
  chatHeader: {
    padding: "16px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexShrink: 0,
  },
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  chatInput: {
    padding: "16px 20px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#080808",
    flexShrink: 0,
  },
  inputAction: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "rgba(255,255,255,0.06)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background 0.2s",
  },
};
