"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@repo/ui/layout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Zap,
  Play,
  MoreHorizontal,
  BookOpen,
  ListVideo,
  Users,
  Award,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";

interface Reel {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  pdfUrl?: string;
  certificationUrl?: string;
  creator: {
    id: string;
    username: string;
    userProfile?: { avatarUrl?: string; displayName?: string };
  };
  skill?: { name: string; slug: string };
  subskill?: { name: string; slug: string };
  _count: { likes: number; comments: number; saves: number };
  isLiked: boolean; // From backend
  isSaved?: boolean; // From backend
}

export default function HomePage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReelId, setActiveReelId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  const { accessToken } = useAuthStore();

  useEffect(() => {
    async function fetchFeed() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) return setLoading(false);

      try {
        const res = await fetch(`${apiUrl}/videos`, {
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
        });
        if (!res.ok) throw new Error(`Failed to fetch`);
        const data = await res.json();
        setReels(data);
        if (data.length > 0) setActiveReelId(data[0].id);
      } catch (err) {
        console.error("❌ Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeed();
  }, [accessToken]);

  // ── Intersection Observer to find the center-most reel ──
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setActiveReelId(entry.target.getAttribute("data-id"));
          }
        });
      },
      { threshold: 0.6 },
    );

    const elements = document.querySelectorAll(".reel-section");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [reels]);

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
          <Zap
            size={48}
            className="animate-pulse"
            color="rgba(255,255,255,0.2)"
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
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
        }}
        className="no-scrollbar"
      >
        {reels.length > 0 ? (
          reels.map((reel) => (
            <div key={reel.id} className="reel-section" data-id={reel.id}>
              <ReelSection
                reel={reel}
                isActive={activeReelId === reel.id}
                isMuted={isMuted}
                onToggleMute={() => setIsMuted(!isMuted)}
              />
            </div>
          ))
        ) : (
          <div
            style={{
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#000",
              gap: 16,
            }}
          >
            <Zap size={64} color="rgba(255,255,255,0.05)" />
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
              No reels found. Start uploading!
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function ReelSection({
  reel,
  isActive,
  isMuted,
  onToggleMute,
}: {
  reel: Reel;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}) {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const [liked, setLiked] = useState(reel.isLiked);
  const [saved, setSaved] = useState(reel.isSaved || false);
  const [watchLater, setWatchLater] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const API = process.env.NEXT_PUBLIC_API_URL;

  // ── RULE: Synchronize Play/Pause with isActive ──
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {}); // Catch play-block errors
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0; // Optional: Reset to start
      }
    }
  }, [isActive]);

  // ── RULE 1: Speed — optimistic UI for likes ──
  const handleLike = async () => {
    if (!accessToken) return;
    setLiked(!liked);
    try {
      await fetch(`${API}/videos/${reel.id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (err) {
      console.error("Like failed:", err);
      setLiked(liked); // Rollback
    }
  };

  // ── Optimistic UI for saving ──
  const handleSave = async () => {
    if (!accessToken) return;
    setSaved(!saved);
    try {
      await fetch(`${API}/videos/${reel.id}/save`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (err) {
      console.error("Save failed:", err);
      setSaved(saved); // Rollback
    }
  };

  const fetchComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    setShowComments(true);
    setLoadingComments(true);
    try {
      const res = await fetch(`${API}/videos/${reel.id}/comments`);
      if (res.ok) setComments(await res.json());
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !accessToken) return;
    const content = newComment;
    setNewComment("");
    try {
      const res = await fetch(`${API}/videos/${reel.id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const added = await res.json();
        setComments((prev) => [added, ...prev]);
      }
    } catch (err) {
      console.error("Comment failed:", err);
    }
  };

  const creatorName =
    reel.creator.userProfile?.displayName || reel.creator.username;

  return (
    <section
      style={{
        height: "100vh",
        width: "100%",
        scrollSnapAlign: "start",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Video Player */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.thumbnailUrl}
        loop
        muted={isMuted}
        playsInline
        style={{
          height: "100%",
          width: "100%",
          objectFit: "cover",
          opacity: isActive ? 1 : 0.6,
          transition: "opacity 0.4s",
        }}
      />

      {/* Volume Toggle */}
      <button
        onClick={onToggleMute}
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 30,
        }}
      >
        {isMuted ? (
          <VolumeX size={18} color="#fff" />
        ) : (
          <Volume2 size={18} color="#fff" />
        )}
      </button>

      {/* Content overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "40px 48px",
          background:
            "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)",
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 480,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {reel.skill && (
              <span
                style={{
                  background: "#fff",
                  color: "#000",
                  padding: "3px 10px",
                  borderRadius: 6,
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                {reel.skill.name}
              </span>
            )}
          </div>
          <h2
            style={{
              fontSize: "clamp(20px, 3vw, 28px)",
              fontWeight: 800,
              lineHeight: 1.25,
              color: "#fff",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            {reel.title}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(255,255,255,0.1)",
                overflow: "hidden",
              }}
            >
              {reel.creator.userProfile?.avatarUrl && (
                <img
                  src={reel.creator.userProfile.avatarUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                @{reel.creator.username}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.35)",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                {creatorName}
              </div>
            </div>
          </div>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.6,
              maxWidth: 360,
              margin: 0,
            }}
          >
            {reel.description}
          </p>
        </div>
      </div>

      {/* Action sidebar */}
      <div
        style={{
          position: "absolute",
          right: 24,
          bottom: 120,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          zIndex: 30,
        }}
      >
        <ActionBtn
          icon={
            <Heart
              size={18}
              fill={liked ? "#ef4444" : "none"}
              color={liked ? "#ef4444" : "rgba(255,255,255,0.6)"}
            />
          }
          count={String(
            Number(reel._count.likes || 0) +
              (liked && !reel.isLiked ? 1 : !liked && reel.isLiked ? -1 : 0),
          )}
          onClick={handleLike}
        />
        <ActionBtn
          icon={
            <MessageCircle
              size={18}
              color={showComments ? "#fff" : "rgba(255,255,255,0.6)"}
            />
          }
          count={String(reel._count.comments)}
          onClick={fetchComments}
        />
        <ActionBtn
          icon={
            <Bookmark
              size={18}
              fill={saved ? "#fff" : "none"}
              color="rgba(255,255,255,0.6)"
            />
          }
          count={saved ? "Saved" : "Save"}
          onClick={handleSave}
        />

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: menuOpen ? "#fff" : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <MoreHorizontal
              size={18}
              color={menuOpen ? "#000" : "rgba(255,255,255,0.6)"}
            />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 10 }}
                style={{
                  position: "absolute",
                  right: 60,
                  bottom: 0,
                  width: 200,
                  background: "#0d0d0d",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {reel.pdfUrl && (
                  <button
                    onClick={() =>
                      window.open(
                        `${API}/videos/${reel.id}/pdf-proxy`,
                        "_blank",
                      )
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.05)",
                      border: "none",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{ color: "#4ade80" }}>
                      <BookOpen size={14} />
                    </span>
                    View PDF
                  </button>
                )}

                <button
                  onClick={() =>
                    router.push(
                      `/app/profile/${reel.creator.username}?tab=By Category&cat=${reel.skill?.name}&sub=${reel.subskill?.name}`,
                    )
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    fontFamily: "inherit",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>
                    <Play size={14} />
                  </span>
                  View Series
                </button>

                <button
                  onClick={async () => {
                    if (!accessToken) return;
                    setWatchLater(!watchLater);
                    try {
                      await fetch(`${API}/videos/${reel.id}/watch-later`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${accessToken}` },
                      });
                    } catch (err) {
                      setWatchLater(watchLater);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "none",
                    border: "none",
                    color: watchLater ? "#fff" : "rgba(255,255,255,0.7)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    fontFamily: "inherit",
                  }}
                >
                  <span
                    style={{
                      color: watchLater ? "#4ade80" : "rgba(255,255,255,0.35)",
                    }}
                  >
                    <ListVideo size={14} />
                  </span>
                  {watchLater ? "In Watch Later" : "Watch Later"}
                </button>

                <button
                  onClick={() =>
                    router.push(
                      `/app/community?creator=${reel.creator.username}`,
                    )
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    fontFamily: "inherit",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>
                    <Users size={14} />
                  </span>
                  Community
                </button>

                {reel.certificationUrl && (
                  <button
                    onClick={() => window.open(reel.certificationUrl, "_blank")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "none",
                      border: "none",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{ color: "#fbbf24" }}>
                      <Award size={14} />
                    </span>
                    Certification
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── COMMENTS OVERLAY ── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: "min(400px, 90vw)",
              background: "#000",
              borderLeft: "1px solid rgba(255,255,255,0.1)",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: 24,
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#fff",
                }}
              >
                Comments
              </h3>
              <button
                onClick={() => setShowComments(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Close
              </button>
            </div>

            <div
              style={{ flex: 1, overflowY: "auto", padding: 24 }}
              className="no-scrollbar"
            >
              {loadingComments ? (
                <div
                  style={{
                    color: "rgba(255,255,255,0.2)",
                    textAlign: "center",
                    padding: 40,
                  }}
                >
                  Loading...
                </div>
              ) : comments.length === 0 ? (
                <div
                  style={{
                    color: "rgba(255,255,255,0.2)",
                    textAlign: "center",
                    padding: 40,
                  }}
                >
                  No comments yet.
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 24 }}
                >
                  {comments.map((c) => (
                    <div key={c.id} style={{ display: "flex", gap: 12 }}>
                      {c.user.userProfile?.avatarUrl ? (
                        <img
                          src={c.user.userProfile.avatarUrl}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "#111",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "rgba(255,255,255,0.05)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 800,
                            color: "rgba(255,255,255,0.2)",
                          }}
                        >
                          {c.user.username[0].toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#fff",
                            }}
                          >
                            @{c.user.username}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              color: "rgba(255,255,255,0.3)",
                            }}
                          >
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            color: "rgba(255,255,255,0.7)",
                            lineHeight: 1.5,
                          }}
                        >
                          {c.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={handlePostComment}
              style={{
                padding: 24,
                borderTop: "1px solid rgba(255,255,255,0.05)",
                background: "#050505",
              }}
            >
              <div style={{ display: "flex", gap: 12 }}>
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    color: "#fff",
                    fontSize: 13,
                    fontFamily: "inherit",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: "0 20px",
                    background: "#fff",
                    color: "#000",
                    border: "none",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Post
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ActionBtn({
  icon,
  count,
  onClick,
}: {
  icon: React.ReactNode;
  count: string;
  onClick: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <button
        onClick={onClick}
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
      >
        {icon}
      </button>
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {count}
      </span>
    </div>
  );
}
