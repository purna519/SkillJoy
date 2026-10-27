"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@repo/ui/layout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  BookOpen,
  Clock,
  Bookmark,
  TrendingUp,
  Play,
  Sparkles,
  Award,
  Target,
  MessageSquare,
  ShieldAlert,
  Ban,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";

interface Take {
  id: string;
  content: string;
  createdAt: string;
  video?: {
    id: string;
    title: string;
    thumbnailUrl?: string;
    creator?: { username: string };
  };
}

interface Quest {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  xpReward: number;
  completed: boolean;
}

interface BlockedUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  userProfile?: { avatarUrl?: string; displayName?: string };
}

interface SkillProgress {
  subject: string;
  A: number;
  fullMark: number;
}

// Hand-crafted pure SVG Radar Chart (No external chart libraries required!)
const RadarChart = ({ data }: { data: SkillProgress[] }) => {
  const center = 120;
  const radius = 70;

  const points = data
    .map((d, i) => {
      const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2; // Rotate by 90deg so top axis is straight
      const val = d.A / 100;
      const x = center + radius * val * Math.cos(angle);
      const y = center + radius * val * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg
      width="100%"
      height="240"
      viewBox="0 0 240 240"
      style={{ margin: "0 auto", display: "block" }}
    >
      {/* Grid polygon rings */}
      {gridLevels.map((lvl) => {
        const gridPoints = data
          .map((_, i) => {
            const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
            const x = center + radius * lvl * Math.cos(angle);
            const y = center + radius * lvl * Math.sin(angle);
            return `${x},${y}`;
          })
          .join(" ");
        return (
          <polygon
            key={lvl}
            points={gridPoints}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        );
      })}

      {/* Axis lines from center to outer points */}
      {data.map((_, i) => {
        const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        );
      })}

      {/* Main filled polygon representation of skills with sleek theme color */}
      {points && (
        <polygon
          points={points}
          fill="rgba(192, 132, 252, 0.12)"
          stroke="url(#radarGradient)"
          strokeWidth="2.5"
          style={{ transition: "points 0.6s ease" }}
        />
      )}

      {/* Gradient for radar stroke */}
      <defs>
        <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>

      {/* Chart Outer boundaries points as glowing markers */}
      {data.map((d, i) => {
        const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
        const val = d.A / 100;
        const x = center + radius * val * Math.cos(angle);
        const y = center + radius * val * Math.sin(angle);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4.5"
            fill="#c084fc"
            style={{
              transition: "cx 0.6s ease, cy 0.6s ease",
              filter: "drop-shadow(0 0 4px rgba(192,132,252,0.8))",
            }}
          />
        );
      })}

      {/* Axis labels */}
      {data.map((d, i) => {
        const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
        const textX = center + (radius + 24) * Math.cos(angle);
        const textY = center + (radius + 12) * Math.sin(angle);

        return (
          <text
            key={i}
            x={textX}
            y={textY}
            fill="rgba(255,255,255,0.4)"
            fontSize="9"
            fontWeight="700"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {d.subject}
          </text>
        );
      })}
    </svg>
  );
};

const DEFAULT_SKILLS: SkillProgress[] = [
  { subject: "AI & ML", A: 25, fullMark: 100 },
  { subject: "Coding", A: 35, fullMark: 100 },
  { subject: "UI/UX Design", A: 20, fullMark: 100 },
  { subject: "Marketing", A: 15, fullMark: 100 },
  { subject: "Product", A: 15, fullMark: 100 },
  { subject: "Soft Skills", A: 30, fullMark: 100 },
];

export default function LearnerProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState("Takes");
  const [userData, setUserData] = useState<any>(null);
  const [savedReels, setSavedReels] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);

  // Custom states for social/quests/block features
  const [takes, setTakes] = useState<Take[]>([]);
  const [newTakeText, setNewTakeText] = useState("");
  const [quests, setQuests] = useState<Quest[]>([]);
  const [skillProgress, setSkillProgress] =
    useState<SkillProgress[]>(DEFAULT_SKILLS);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  const { accessToken } = useAuthStore();
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  const fetchProfileData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [meRes, savedRes, historyRes, reqRes, blockedRes, questsRes] =
        await Promise.all([
          fetch(`${API}/users/me`, { headers }),
          fetch(`${API}/videos/watch-later`, { headers }),
          fetch(`${API}/videos/watch-history`, { headers }),
          fetch(`${API}/users/follow/requests`, { headers }),
          fetch(`${API}/users/blocked/list`, { headers }),
          fetch(`${API}/users/quests/daily`, { headers }),
        ]);

      if (meRes.ok) {
        const data = await meRes.json();
        setUserData(data);
        setIsPrivate(data.isPrivate);

        // Fetch Skill progress & Takes
        const [skillsRes, takesRes] = await Promise.all([
          fetch(`${API}/users/${data.id}/skills/progress`, { headers }),
          fetch(`${API}/users/takes/${data.id}`, { headers }),
        ]);

        if (skillsRes.ok) {
          const skData = await skillsRes.json();
          if (Array.isArray(skData) && skData.length > 0)
            setSkillProgress(skData);
        }
        if (takesRes.ok) {
          setTakes(await takesRes.json());
        }
      }
      if (savedRes.ok) {
        const text = await savedRes.text();
        if (text) setSavedReels(JSON.parse(text));
      }
      if (historyRes.ok) {
        const text = await historyRes.text();
        if (text) setHistory(JSON.parse(text));
      }
      if (reqRes.ok) {
        setFollowRequests(await reqRes.json());
      }
      if (blockedRes.ok) {
        setBlockedUsers(await blockedRes.json());
      }
      if (questsRes.ok) {
        setQuests(await questsRes.json());
      }
    } catch (err) {
      console.error("Fetch learner data error:", err);
    }
  }, [accessToken, API]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handlePostTake = async () => {
    if (!newTakeText.trim() || !accessToken) return;
    try {
      const res = await fetch(`${API}/users/takes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newTakeText.trim() }),
      });

      if (res.ok) {
        setNewTakeText("");
        setShowNotification("Take Shared! Unlocked +20 XP ✨");
        setTimeout(() => setShowNotification(null), 3000);
        // Refresh all profile data to show take, update XP and level up
        fetchProfileData();
      }
    } catch (err) {
      console.error("Post take error:", err);
    }
  };

  const handleUnblock = async (targetId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API}/users/block/${targetId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setBlockedUsers((prev) => prev.filter((u) => u.id !== targetId));
        setShowNotification("User unblocked successfully");
        setTimeout(() => setShowNotification(null), 2500);
      }
    } catch (err) {
      console.error("Unblock failed:", err);
    }
  };

  const handleTogglePrivacy = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API}/users/privacy/toggle`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsPrivate(data.isPrivate);
      }
    } catch (err) {}
  };

  const handleAcceptRequest = async (followerId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API}/users/follow/${followerId}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok)
        setFollowRequests((prev) =>
          prev.filter((r) => r.followerId !== followerId),
        );
    } catch (err) {}
  };

  const handleRejectRequest = async (followerId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API}/users/follow/${followerId}/reject`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok)
        setFollowRequests((prev) =>
          prev.filter((r) => r.followerId !== followerId),
        );
    } catch (err) {}
  };

  const username = userData?.username || "learner";
  const joinedDate = userData?.createdAt
    ? new Date(userData.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "May 2024";

  const tabs = ["Takes", "Playlists", "Saved", "Requests", "Blocked"];

  return (
    <MainLayout>
      <div
        style={{
          minHeight: "100vh",
          background: "#020202",
          color: "#fff",
          paddingBottom: 100,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Floating Success Notification */}
        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: -50, x: "-50%" }}
              animate={{ opacity: 1, y: 20, x: "-50%" }}
              exit={{ opacity: 0, y: -50, x: "-50%" }}
              style={{
                position: "fixed",
                top: 0,
                left: "50%",
                background: "rgba(255, 255, 255, 0.95)",
                color: "#000",
                padding: "12px 24px",
                borderRadius: 16,
                fontSize: 13,
                fontWeight: 700,
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                zIndex: 999,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Sparkles size={16} color="#fbbf24" fill="#fbbf24" />
              {showNotification}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header Banner */}
        <div
          style={{
            height: 180,
            background: "linear-gradient(180deg, #090909 0%, #020202 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -80,
              right: -40,
              width: 350,
              height: 350,
              background: "rgba(255,255,255,0.015)",
              borderRadius: "50%",
              filter: "blur(70px)",
            }}
          />
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          {/* Profile Identity & Streak Header */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              gap: 24,
              marginTop: -50,
              marginBottom: 36,
              position: "relative",
              zIndex: 10,
            }}
          >
            {/* Custom Premium Avatar */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              style={{
                width: 108,
                height: 108,
                borderRadius: 28,
                background: "linear-gradient(135deg, #1e1b4b 0%, #0c0a0f 100%)",
                border: "3px solid #020202",
                outline: "1px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                fontWeight: 900,
                color: "#fff",
                flexShrink: 0,
                boxShadow: "0 12px 24px rgba(0,0,0,0.8)",
              }}
            >
              {userData?.userProfile?.avatarUrl ? (
                <img
                  src={userData.userProfile.avatarUrl}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 28,
                    objectFit: "cover",
                  }}
                />
              ) : (
                username.charAt(0).toUpperCase()
              )}
            </motion.div>

            <div style={{ paddingBottom: 4 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 4,
                }}
              >
                <h1
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: "-0.03em",
                    margin: 0,
                  }}
                >
                  {userData?.userProfile?.displayName || username}
                </h1>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                  @{username}
                </span>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.35)",
                  margin: 0,
                }}
              >
                Learning Portfolio · Joined {joinedDate}
              </p>
            </div>

            {/* Quick Action Controls */}
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                onClick={handleTogglePrivacy}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${isPrivate ? "rgba(251, 191, 36, 0.25)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 14,
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: isPrivate ? "#fbbf24" : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s",
                }}
              >
                {isPrivate ? <EyeOff size={15} /> : <Eye size={15} />}
                {isPrivate ? "Private Mode" : "Public Mode"}
              </button>

              {/* Premium Pulsating Fire Streak Counter */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 16,
                  padding: "8px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  backdropFilter: "blur(12px)",
                  cursor: "pointer",
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut",
                  }}
                >
                  <Flame
                    size={20}
                    color="#ff6b35"
                    fill="#ff6b35"
                    style={{
                      filter: "drop-shadow(0 0 6px rgba(255,107,53,0.5))",
                    }}
                  />
                </motion.div>
                <div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: "#fff",
                      lineHeight: 1,
                    }}
                  >
                    {userData?.userProfile?.streakCount || 0}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "rgba(255,255,255,0.3)",
                      fontWeight: 700,
                    }}
                  >
                    Day Streak
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* MAIN TWO-COLUMN SOCIAL DASHBOARD GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "280px 1fr",
              gap: 32,
              alignItems: "start",
            }}
            className="profile-grid"
          >
            {/* ── LEFT SIDEBAR PANEL (Radar, Quests, Heatmap) ── */}
            <aside
              style={{ display: "flex", flexDirection: "column", gap: 28 }}
            >
              {/* Profile XP & Level Ring Card */}
              <motion.div
                whileHover={{ y: -2 }}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 24,
                  padding: 24,
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 8px 32px 0 rgba(0,0,0,0.3)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        background:
                          "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)",
                        color: "#000",
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      L
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#fff",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Level {userData?.userProfile?.level || 1}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    {userData?.userProfile?.xpPoints || 0} /{" "}
                    {(userData?.userProfile?.level || 1) * 120} XP
                  </span>
                </div>

                <div
                  style={{
                    height: 8,
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 99,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, ((userData?.userProfile?.xpPoints || 0) / ((userData?.userProfile?.level || 1) * 120)) * 100)}%`,
                    }}
                    transition={{ type: "spring", stiffness: 80 }}
                    style={{
                      height: "100%",
                      background:
                        "linear-gradient(90deg, #818cf8 0%, #c084fc 50%, #e879f9 100%)",
                      boxShadow: "0 0 10px rgba(192, 132, 252, 0.5)",
                      borderRadius: 99,
                    }}
                  />
                </div>
              </motion.div>

              {/* Dynamic Interactive SVG Skill Radar */}
              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 24,
                  padding: "20px 14px",
                  textAlign: "center",
                }}
              >
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                    margin: "0 0 16px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Skill Radar
                </h3>
                <RadarChart data={skillProgress} />
              </div>

              {/* Gamified Daily Upskill Quests (Duolingo Loop) */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: 24,
                  padding: 24,
                  backdropFilter: "blur(12px)",
                }}
              >
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#fff",
                    margin: "0 0 20px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Target
                    size={16}
                    color="#c084fc"
                    style={{
                      filter: "drop-shadow(0 0 4px rgba(192, 132, 252, 0.4))",
                    }}
                  />{" "}
                  Daily Quests
                </h3>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {quests.length === 0 ? (
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.3)",
                        textAlign: "center",
                        padding: "12px 0",
                      }}
                    >
                      All quests caught up!
                    </div>
                  ) : (
                    quests.map((q) => (
                      <motion.div
                        key={q.id}
                        whileHover={{ x: 2 }}
                        style={{
                          opacity: q.completed ? 0.6 : 1,
                          background: q.completed
                            ? "rgba(255,255,255,0.01)"
                            : "rgba(255,255,255,0.02)",
                          borderRadius: 16,
                          padding: 14,
                          border: q.completed
                            ? "1px solid rgba(74, 222, 128, 0.15)"
                            : "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ flex: 1, paddingRight: 8 }}>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: q.completed ? "#4ade80" : "#fff",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              {q.title}
                              {q.completed && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    background: "rgba(74, 222, 128, 0.15)",
                                    color: "#4ade80",
                                    padding: "1px 6px",
                                    borderRadius: 4,
                                    fontWeight: 800,
                                  }}
                                >
                                  DONE
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: "rgba(255,255,255,0.4)",
                                marginTop: 2,
                                lineHeight: 1.3,
                              }}
                            >
                              {q.description}
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: q.completed ? "#4ade80" : "#c084fc",
                              background: q.completed
                                ? "rgba(74, 222, 128, 0.05)"
                                : "rgba(192, 132, 252, 0.05)",
                              padding: "4px 8px",
                              borderRadius: 8,
                              flexShrink: 0,
                            }}
                          >
                            +{q.xpReward} XP
                          </span>
                        </div>
                        <div
                          style={{
                            height: 6,
                            background: "rgba(255,255,255,0.06)",
                            borderRadius: 99,
                            overflow: "hidden",
                            position: "relative",
                          }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(100, (q.progress / q.target) * 100)}%`,
                            }}
                            transition={{ type: "spring", stiffness: 60 }}
                            style={{
                              height: "100%",
                              background: q.completed
                                ? "#4ade80"
                                : "linear-gradient(90deg, #c084fc 0%, #6366f1 100%)",
                              borderRadius: 99,
                            }}
                          />
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </aside>

            {/* ── RIGHT MAIN PANEL (Timeline takes, Playlists, Bookmarks, Blocks) ── */}
            <main>
              {/* Navigation Tabs */}
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  marginBottom: 28,
                  overflowX: "auto",
                }}
              >
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      padding: "12px 20px",
                      fontSize: 13,
                      fontWeight: 700,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      color: tab === t ? "#fff" : "rgba(255,255,255,0.35)",
                      borderBottom:
                        tab === t ? "2px solid #fff" : "2px solid transparent",
                      transition: "all 0.2s",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* ── TABS RENDERING CONTENT ── */}
              <div style={{ minHeight: 400 }}>
                {/* TAB 1: TAKES (Micro-Timeline Timeline) */}
                {tab === "Takes" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 24,
                    }}
                  >
                    {/* Share a New Take Input Box */}
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        borderRadius: 24,
                        padding: 20,
                        backdropFilter: "blur(12px)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "rgba(255,255,255,0.05)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.3)",
                          }}
                        >
                          {username.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <textarea
                            value={newTakeText}
                            onChange={(e) => setNewTakeText(e.target.value)}
                            placeholder="Share a key insight or gold nugget you learned today..."
                            maxLength={280}
                            style={{
                              width: "100%",
                              background: "none",
                              border: "none",
                              outline: "none",
                              color: "#fff",
                              fontSize: 14,
                              fontFamily: "inherit",
                              resize: "none",
                              minHeight: 60,
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              borderTop: "1px solid rgba(255,255,255,0.04)",
                              paddingTop: 12,
                              marginTop: 4,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                color:
                                  newTakeText.length > 250
                                    ? "#f87171"
                                    : "rgba(255,255,255,0.25)",
                              }}
                            >
                              {280 - newTakeText.length} characters left
                            </span>
                            <motion.button
                              whileHover={{
                                scale: newTakeText.trim() ? 1.02 : 1,
                              }}
                              whileTap={{
                                scale: newTakeText.trim() ? 0.98 : 1,
                              }}
                              onClick={handlePostTake}
                              disabled={!newTakeText.trim()}
                              style={{
                                background: newTakeText.trim()
                                  ? "#fff"
                                  : "rgba(255,255,255,0.05)",
                                color: newTakeText.trim()
                                  ? "#000"
                                  : "rgba(255,255,255,0.3)",
                                border: "none",
                                borderRadius: 12,
                                padding: "8px 16px",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: newTakeText.trim()
                                  ? "pointer"
                                  : "default",
                                transition: "all 0.2s",
                              }}
                            >
                              Share Take
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Takes list */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      {takes.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "40px 0",
                            color: "rgba(255,255,255,0.2)",
                          }}
                        >
                          <MessageSquare
                            size={32}
                            style={{ margin: "0 auto 12px", opacity: 0.3 }}
                          />
                          <p style={{ fontSize: 13, margin: 0 }}>
                            No Takes shared yet. Share a take above to kickstart
                            your learning feed!
                          </p>
                        </div>
                      ) : (
                        takes.map((t) => (
                          <div
                            key={t.id}
                            style={{
                              background: "rgba(255,255,255,0.015)",
                              border: "1px solid rgba(255,255,255,0.04)",
                              borderRadius: 20,
                              padding: 18,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 10,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "#fff",
                                  }}
                                >
                                  @{username}
                                </span>
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "rgba(255,255,255,0.3)",
                                  }}
                                >
                                  {new Date(t.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <p
                              style={{
                                fontSize: 14,
                                lineHeight: 1.5,
                                color: "rgba(255,255,255,0.85)",
                                margin: "0 0 12px",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {t.content}
                            </p>
                            {t.video && (
                              <motion.div
                                whileHover={{ scale: 1.01 }}
                                onClick={() =>
                                  router.push(`/app/explore?v=${t.video?.id}`)
                                }
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  background: "rgba(255,255,255,0.03)",
                                  border: "1px solid rgba(255,255,255,0.06)",
                                  borderRadius: 16,
                                  padding: 12,
                                  cursor: "pointer",
                                  marginTop: 12,
                                  transition: "background 0.2s",
                                }}
                              >
                                {t.video.thumbnailUrl ? (
                                  <div
                                    style={{
                                      width: 50,
                                      height: 70,
                                      borderRadius: 10,
                                      overflow: "hidden",
                                      position: "relative",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <img
                                      src={t.video.thumbnailUrl}
                                      alt=""
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                      }}
                                    />
                                    <div
                                      style={{
                                        position: "absolute",
                                        inset: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: "rgba(0,0,0,0.3)",
                                      }}
                                    >
                                      <Play
                                        size={14}
                                        color="#fff"
                                        fill="#fff"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: 8,
                                      background: "rgba(255,255,255,0.06)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <Play
                                      size={16}
                                      color="rgba(255,255,255,0.6)"
                                      fill="rgba(255,255,255,0.3)"
                                    />
                                  </div>
                                )}
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 3,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      color: "rgba(255,255,255,0.4)",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.05em",
                                    }}
                                  >
                                    Learned from Reel
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 700,
                                      color: "#fff",
                                      lineHeight: 1.3,
                                    }}
                                  >
                                    {t.video.title}
                                  </span>
                                  {t.video.creator && (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: "rgba(255,255,255,0.4)",
                                      }}
                                    >
                                      @{t.video.creator.username}
                                    </span>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: CURATED PLAYLISTS */}
                {tab === "Playlists" && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        aspectRatio: "1.2",
                        background: "rgba(255,255,255,0.01)",
                        border: "1px dashed rgba(255,255,255,0.1)",
                        borderRadius: 20,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      className="hover:bg-white/5 flex items-center justify-center"
                    >
                      <div
                        style={{ fontSize: 24, marginBottom: 8, opacity: 0.5 }}
                      >
                        +
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "rgba(255,255,255,0.4)",
                        }}
                      >
                        Create Skill Playlist
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: BOOKMARKED SAVED REELS */}
                {tab === "Saved" && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(180px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {savedReels.length === 0 ? (
                      <div
                        style={{
                          gridColumn: "1/-1",
                          textAlign: "center",
                          padding: "80px 0",
                          color: "rgba(255,255,255,0.2)",
                        }}
                      >
                        <Bookmark
                          size={36}
                          style={{ margin: "0 auto 12px", opacity: 0.3 }}
                        />
                        <p style={{ fontSize: 13, margin: 0 }}>
                          No saved reels yet. Explore and save some to see them
                          here!
                        </p>
                      </div>
                    ) : (
                      savedReels.map((entry) => (
                        <motion.div
                          key={entry.id}
                          whileHover={{ scale: 1.02 }}
                          onClick={() =>
                            router.push(`/app/explore?v=${entry.video?.id}`)
                          }
                          style={{
                            aspectRatio: "9/16",
                            background: "#090909",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 20,
                            position: "relative",
                            overflow: "hidden",
                            cursor: "pointer",
                          }}
                        >
                          {entry.video?.thumbnailUrl ? (
                            <img
                              src={entry.video.thumbnailUrl}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                background:
                                  "linear-gradient(135deg, #1e1b4b 0%, #0c0a0f 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Play size={32} color="rgba(255,255,255,0.2)" />
                            </div>
                          )}
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background:
                                "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "flex-end",
                              padding: 16,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#fff",
                                lineHeight: 1.4,
                                marginBottom: 4,
                              }}
                            >
                              {entry.video?.title}
                            </div>
                            {entry.video?.creator && (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "rgba(255,255,255,0.4)",
                                  fontWeight: 600,
                                }}
                              >
                                @{entry.video.creator.username}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 4: PENDING FOLLOW REQUESTS */}
                {tab === "Requests" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {followRequests.length === 0 ? (
                      <div
                        style={{
                          padding: "60px 0",
                          textAlign: "center",
                          color: "rgba(255,255,255,0.2)",
                        }}
                      >
                        <ShieldAlert
                          size={32}
                          style={{ margin: "0 auto 12px", opacity: 0.3 }}
                        />
                        <p style={{ fontSize: 13, margin: 0 }}>
                          No pending requests.
                        </p>
                      </div>
                    ) : (
                      followRequests.map((req) => (
                        <div
                          key={req.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            borderRadius: 20,
                            padding: "14px 20px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: "#111",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                color: "rgba(255,255,255,0.3)",
                              }}
                            >
                              {req.follower?.userProfile?.avatarUrl ? (
                                <img
                                  src={req.follower.userProfile.avatarUrl}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: 10,
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                req.follower?.username.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: "#fff",
                                }}
                              >
                                {req.follower?.userProfile?.displayName ||
                                  req.follower?.username}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "rgba(255,255,255,0.35)",
                                }}
                              >
                                @{req.follower?.username}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() =>
                                handleAcceptRequest(req.followerId)
                              }
                              style={{
                                background: "#fff",
                                color: "#000",
                                border: "none",
                                borderRadius: 10,
                                padding: "8px 16px",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() =>
                                handleRejectRequest(req.followerId)
                              }
                              style={{
                                background: "rgba(255,255,255,0.03)",
                                color: "rgba(255,255,255,0.4)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: 10,
                                padding: "8px 16px",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 5: BLOCKED LIST SETTINGS */}
                {tab === "Blocked" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
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
                      <Ban size={16} color="rgba(255,255,255,0.4)" />
                      <h3
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#fff",
                          margin: 0,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Blocked Users
                      </h3>
                    </div>

                    {blockedUsers.length === 0 ? (
                      <div
                        style={{
                          padding: "60px 0",
                          textAlign: "center",
                          color: "rgba(255,255,255,0.2)",
                          background: "rgba(255,255,255,0.01)",
                          border: "1px dashed rgba(255,255,255,0.05)",
                          borderRadius: 20,
                        }}
                      >
                        <p style={{ fontSize: 13, margin: 0 }}>
                          You haven&apos;t blocked anyone.
                        </p>
                      </div>
                    ) : (
                      blockedUsers.map((b) => (
                        <div
                          key={b.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            borderRadius: 20,
                            padding: "14px 20px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: "#111",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                color: "rgba(255,255,255,0.3)",
                              }}
                            >
                              {b.userProfile?.avatarUrl ? (
                                <img
                                  src={b.userProfile.avatarUrl}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: 10,
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                b.username.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: "#fff",
                                }}
                              >
                                {b.userProfile?.displayName ||
                                  b.fullName ||
                                  b.username}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "rgba(255,255,255,0.35)",
                                }}
                              >
                                @{b.username}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnblock(b.id)}
                            style={{
                              background: "rgba(239, 68, 68, 0.1)",
                              color: "#ef4444",
                              border: "1px solid rgba(239, 68, 68, 0.2)",
                              borderRadius: 10,
                              padding: "8px 16px",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "rgba(239, 68, 68, 0.2)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                "rgba(239, 68, 68, 0.1)";
                            }}
                          >
                            Unblock
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Styles for Responsive Design */}
      <style jsx global>{`
        @media (max-width: 820px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </MainLayout>
  );
}
