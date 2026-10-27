"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@repo/ui/layout";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import {
  MessageCircle,
  Plus,
  Loader2,
  X,
  Globe,
  Shield,
  Users,
  Sparkles,
  Check,
  Trash,
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { useSocket } from "../../../store/socket-context";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  skill?: { name: string };
  _count?: { members: number };
  isJoined?: boolean;
  isOwner?: boolean;
}

interface Post {
  id: string;
  content: string;
  createdAt: string;
  user: { username: string; userProfile?: { avatarUrl?: string } };
  likesCount: number;
  commentsCount: number;
}

function CommunitiesInner() {
  const { user, accessToken } = useAuthStore();
  const { socket, isConnected } = useSocket();
  const searchParams = useSearchParams();
  const creatorFilter = searchParams.get("creator");

  const [communities, setCommunities] = useState<Community[]>([]);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(
    null,
  );
  const [posts, setPosts] = useState<Post[]>([]);
  const [postInput, setPostInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [postLoading, setPostLoading] = useState(false);

  // Create Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Load all communities
  const fetchCommunities = () => {
    setLoading(true);
    const url = creatorFilter
      ? `${API}/communities?creator=${creatorFilter}`
      : `${API}/communities`;
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined;
    fetch(url, { headers })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCommunities(data);
          const joinedIds = new Set(
            data.filter((c) => c.isJoined).map((c) => c.id),
          );
          setJoined(joinedIds);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCommunities();
  }, [creatorFilter]);

  // Load posts when active community changes
  useEffect(() => {
    if (!activeCommunity) return;
    fetch(`${API}/communities/${activeCommunity.id}/posts`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPosts(data);
      })
      .catch(console.error);

    // Join the Socket.IO room for live community messages
    if (socket) {
      socket.emit("joinCommunity", { communityId: activeCommunity.id });
    }
  }, [activeCommunity?.id, socket]);

  // Listen for real-time community messages
  useEffect(() => {
    if (!socket) return;
    const onNewPost = (post: Post) => {
      setPosts((prev) => [post, ...prev]);
    };
    socket.on("newCommunityMessage", onNewPost);
    return () => {
      socket.off("newCommunityMessage", onNewPost);
    };
  }, [socket]);

  const joinCommunity = async (community: Community) => {
    if (!accessToken) return;
    try {
      await fetch(`${API}/communities/${community.id}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setJoined((prev) => new Set([...prev, community.id]));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCommunity = async (communityId: string) => {
    if (!accessToken) return;
    if (!confirm("Are you sure you want to delete this community?")) return;
    try {
      const res = await fetch(`${API}/communities/${communityId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setCommunities((prev) => prev.filter((c) => c.id !== communityId));
        if (activeCommunity?.id === communityId) setActiveCommunity(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !accessToken) return;
    setCreateLoading(true);
    try {
      const res = await fetch(`${API}/communities`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewName("");
        setNewDesc("");
        fetchCommunities();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreateLoading(false);
    }
  };

  const submitPost = async () => {
    if (!postInput.trim() || !activeCommunity || !accessToken) return;
    setPostLoading(true);
    try {
      // Use Socket.IO for real-time post (Rule 2: saves to DB first)
      if (socket && isConnected) {
        socket.emit("communityMessage", {
          communityId: activeCommunity.id,
          content: postInput.trim(),
          tempId: `temp-${Date.now()}`,
        });
      } else {
        // Fallback to REST API if socket not connected
        await fetch(`${API}/communities/${activeCommunity.id}/posts`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: postInput.trim() }),
        });
      }
      setPostInput("");
    } catch (err) {
      console.error(err);
    } finally {
      setPostLoading(false);
    }
  };

  return (
    <MainLayout>
      <div
        style={{
          padding: "40px 32px",
          maxWidth: 1100,
          margin: "0 auto",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 48,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "clamp(36px, 6vw, 64px)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                color: "#fff",
                margin: 0,
              }}
            >
              YOUR
              <br />
              <span style={{ color: "rgba(255,255,255,0.2)" }}>
                COMMUNITIES.
              </span>
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.35)",
                marginTop: 12,
                maxWidth: 380,
                lineHeight: 1.6,
              }}
            >
              Collaborate, share knowledge, and build skills together with
              thousands of experts.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                fontSize: 11,
                color: "rgba(255,255,255,0.3)",
                marginRight: 12,
              }}
            >
              {isConnected ? "Live" : "Offline"}
            </span>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#fff",
                color: "#000",
                border: "none",
                borderRadius: 99,
                padding: "13px 24px",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Plus size={15} /> Create Hub
            </button>
          </div>
        </div>

        {loading && communities.length === 0 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "80px 0",
            }}
          >
            <Loader2
              size={32}
              color="rgba(255,255,255,0.2)"
              className="animate-spin"
            />
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: activeCommunity ? "1fr 380px" : "1fr",
              gap: 32,
            }}
          >
            {/* Communities grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                  margin: 0,
                }}
              >
                {communities.length > 0
                  ? `${communities.length} Communities`
                  : "No Communities Yet"}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                {communities.map((hub) => (
                  <motion.div
                    key={hub.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() =>
                      setActiveCommunity(
                        activeCommunity?.id === hub.id ? null : hub,
                      )
                    }
                    style={{
                      background:
                        activeCommunity?.id === hub.id
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(255,255,255,0.03)",
                      border: `1px solid ${activeCommunity?.id === hub.id ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: 24,
                      padding: 24,
                      minHeight: 160,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: "#4ade80",
                          }}
                        />
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.3)",
                          }}
                        >
                          {hub.skill?.name || "Community"}
                        </span>
                      </div>
                      <h4
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          letterSpacing: "-0.02em",
                          color: "#fff",
                          margin: "0 0 6px",
                        }}
                      >
                        {hub.name}
                      </h4>
                      {hub.description && (
                        <p
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.3)",
                            margin: 0,
                            lineHeight: 1.5,
                          }}
                        >
                          {hub.description}
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 16,
                      }}
                    >
                      <span
                        style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}
                      >
                        {hub._count?.members ?? 0} Members
                      </span>
                      <div style={{ display: "flex", gap: 8 }}>
                        {hub.isOwner && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCommunity(hub.id);
                            }}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 12,
                              background: "rgba(255,100,100,0.1)",
                              border: "1px solid rgba(255,100,100,0.2)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                            title="Delete Community"
                          >
                            <Trash size={15} color="#f87171" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCommunity(hub);
                          }}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <MessageCircle
                            size={15}
                            color="rgba(255,255,255,0.5)"
                          />
                        </button>
                        {user && !joined.has(hub.id) && !hub.isOwner && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              joinCommunity(hub);
                            }}
                            style={{
                              background: "#fff",
                              color: "#000",
                              border: "none",
                              borderRadius: 99,
                              padding: "6px 14px",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            Join
                          </button>
                        )}
                        {joined.has(hub.id) && !hub.isOwner && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#4ade80",
                              padding: "6px 0",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Check size={12} /> Joined
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {communities.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "64px 0",
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 14,
                  }}
                >
                  No communities yet. Be the first to create one!
                </div>
              )}
            </div>

            {/* Live Chat Panel */}
            {activeCommunity && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 24,
                  display: "flex",
                  flexDirection: "column",
                  height: "calc(100vh - 200px)",
                  position: "sticky",
                  top: 20,
                }}
              >
                <div
                  style={{
                    padding: "20px 20px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#fff",
                      margin: "0 0 4px",
                    }}
                  >
                    {activeCommunity.name}
                  </h3>
                  <p
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.3)",
                      margin: 0,
                    }}
                  >
                    Live Community Chat
                  </p>
                </div>

                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {posts.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "32px 0",
                        color: "rgba(255,255,255,0.2)",
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      No posts yet. Say something! <Sparkles size={14} />
                    </div>
                  ) : (
                    posts.map((post) => (
                      <div
                        key={post.id}
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          borderRadius: 16,
                          padding: 14,
                          border: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: "rgba(255,255,255,0.08)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "rgba(255,255,255,0.4)",
                            }}
                          >
                            {post.user.username.charAt(0).toUpperCase()}
                          </div>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#fff",
                            }}
                          >
                            @{post.user.username}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              color: "rgba(255,255,255,0.2)",
                              marginLeft: "auto",
                            }}
                          >
                            {new Date(post.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 13,
                            color: "rgba(255,255,255,0.7)",
                            margin: 0,
                            lineHeight: 1.5,
                          }}
                        >
                          {post.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {user ? (
                  <div
                    style={{
                      padding: 16,
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      gap: 10,
                    }}
                  >
                    <input
                      value={postInput}
                      onChange={(e) => setPostInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submitPost()}
                      placeholder="Share something..."
                      style={{
                        flex: 1,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 12,
                        padding: "10px 14px",
                        fontSize: 13,
                        color: "#fff",
                        outline: "none",
                        fontFamily: "inherit",
                      }}
                    />
                    <button
                      onClick={submitPost}
                      disabled={postLoading || !postInput.trim()}
                      style={{
                        background: postInput.trim()
                          ? "#fff"
                          : "rgba(255,255,255,0.06)",
                        color: postInput.trim()
                          ? "#000"
                          : "rgba(255,255,255,0.3)",
                        border: "none",
                        borderRadius: 12,
                        padding: "10px 16px",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 13,
                      }}
                    >
                      {postLoading ? "..." : "Post"}
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: 16,
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      textAlign: "center",
                      fontSize: 12,
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    Login to participate in the community
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* ── CREATE HUB MODAL ── */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.85)",
                backdropFilter: "blur(12px)",
                zIndex: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "min(480px, 100%)",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  background: "#0d0d0d",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 32,
                  padding: 40,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 32,
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: "#fff",
                        margin: 0,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      Create a Hub
                    </h2>
                    <p
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.4)",
                        marginTop: 6,
                      }}
                    >
                      Build your own community of learners.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreate(false)}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "none",
                      borderRadius: 12,
                      width: 36,
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X size={18} color="rgba(255,255,255,0.3)" />
                  </button>
                </div>

                <form
                  onSubmit={handleCreateCommunity}
                  style={{ display: "flex", flexDirection: "column", gap: 20 }}
                >
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      Community Name
                    </label>
                    <input
                      autoFocus
                      placeholder="e.g. Next.js Masters"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 14,
                        padding: "14px 16px",
                        fontSize: 14,
                        color: "#fff",
                        outline: "none",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      Description (Optional)
                    </label>
                    <textarea
                      placeholder="What is this community about?"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      rows={3}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 14,
                        padding: "14px 16px",
                        fontSize: 14,
                        color: "#fff",
                        outline: "none",
                        fontFamily: "inherit",
                        resize: "none",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 12,
                      marginTop: 8,
                    }}
                  >
                    {[
                      { icon: <Globe size={14} />, label: "Public" },
                      { icon: <Users size={14} />, label: "Unlimited" },
                      { icon: <Shield size={14} />, label: "Moderated" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          borderRadius: 12,
                          padding: "12px 8px",
                          textAlign: "center",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "rgba(255,255,255,0.25)",
                        }}
                      >
                        <div
                          style={{
                            marginBottom: 6,
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          {item.icon}
                        </div>
                        {item.label}
                      </div>
                    ))}
                  </div>

                  <button
                    disabled={createLoading || !newName.trim()}
                    style={{
                      marginTop: 12,
                      width: "100%",
                      padding: "16px",
                      background: "#fff",
                      color: "#000",
                      border: "none",
                      borderRadius: 16,
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontFamily: "inherit",
                      transition: "opacity 0.2s",
                    }}
                  >
                    {createLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      "Create Community"
                    )}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}

export default function CommunitiesPage() {
  return (
    <React.Suspense
      fallback={
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
              className="animate-spin"
              color="rgba(255,255,255,0.2)"
            />
          </div>
        </MainLayout>
      }
    >
      <CommunitiesInner />
    </React.Suspense>
  );
}
