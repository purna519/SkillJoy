"use client";

import React, { useEffect, useState } from "react";
import { MainLayout } from "@repo/ui/layout";
import { useRouter } from "next/navigation";
import { Upload, TrendingUp, Eye, Heart, Play, Loader2 } from "lucide-react";
import { useAuthStore } from "../../../store/authStore";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function CreatorStudioPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const [reels, setReels] = useState<any[]>([]);
  const [stats, setStats] = useState({
    views: 0,
    likes: 0,
    reels: 0,
    followers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !accessToken) {
      setLoading(false);
      return;
    }

    // Fetch creator's own reels
    fetch(`${API}/videos/creator/${user.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setReels(data);
          const totalViews = data.reduce(
            (sum, r) => sum + (Number(r.viewsCount) || 0),
            0,
          );
          const totalLikes = data.reduce(
            (sum, r) => sum + (Number(r.likesCount) || 0),
            0,
          );
          setStats((prev) => ({
            ...prev,
            views: totalViews,
            likes: totalLikes,
            reels: data.length,
          }));
        }
      })
      .catch(console.error);

    // Fetch creator profile for followers
    fetch(`${API}/users/profile/${user.username}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setStats((prev) => ({
            ...prev,
            followers: data.creatorProfile?.subscribersCount ?? 0,
          }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, accessToken]);

  const goToUpload = () => {
    if (user?.username) router.push(`/app/profile/${user.username}`);
  };

  if (!user) {
    return (
      <MainLayout>
        <div
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#000",
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Please login to access Creator Studio.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div
        style={{
          padding: "40px 32px",
          maxWidth: 960,
          margin: "0 auto",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ marginBottom: 40 }}>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#fff",
              margin: "0 0 8px",
            }}
          >
            Creator Studio
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>
            @{user.username} · Manage your content, track performance, grow your
            audience.
          </p>
        </div>

        {/* Quick upload CTA */}
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 24,
            padding: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#fff",
                margin: "0 0 6px",
              }}
            >
              Ready to teach?
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.4)",
                margin: 0,
              }}
            >
              Upload your next reel — 60 seconds to spark someone&apos;s
              curiosity.
            </p>
          </div>
          <button
            onClick={goToUpload}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              color: "#000",
              border: "none",
              borderRadius: 14,
              padding: "13px 24px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Upload size={16} /> Upload Reel
          </button>
        </div>

        {/* Real Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 14,
            marginBottom: 40,
          }}
        >
          {loading ? (
            <div
              style={{
                gridColumn: "1/-1",
                display: "flex",
                justifyContent: "center",
                padding: "32px 0",
              }}
            >
              <Loader2
                size={28}
                color="rgba(255,255,255,0.2)"
                className="animate-spin"
              />
            </div>
          ) : (
            [
              {
                icon: <Eye size={20} />,
                v: stats.views.toLocaleString(),
                l: "Total Views",
              },
              {
                icon: <Heart size={20} />,
                v: stats.likes.toLocaleString(),
                l: "Total Likes",
              },
              {
                icon: <Play size={20} />,
                v: String(stats.reels),
                l: "Reels Published",
              },
              {
                icon: <TrendingUp size={20} />,
                v: stats.followers.toLocaleString(),
                l: "Followers",
              },
            ].map(({ icon, v, l }) => (
              <div
                key={l}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 20,
                  padding: 22,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ color: "rgba(255,255,255,0.25)" }}>{icon}</div>
                <div>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      color: "#fff",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {v}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.3)",
                      marginTop: 3,
                    }}
                  >
                    {l}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Real Reels */}
        <div>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Your Reels ({reels.length})
          </h3>
          {reels.length === 0 && !loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "rgba(255,255,255,0.2)",
                fontSize: 14,
              }}
            >
              No reels yet. Upload your first reel to get started! 🎬
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {reels.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 18,
                    padding: "16px 20px",
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 12,
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {r.thumbnailUrl ? (
                      <img
                        src={r.thumbnailUrl}
                        alt=""
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
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Play size={16} color="rgba(255,255,255,0.4)" />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}
                    >
                      {r.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.3)",
                        marginTop: 3,
                      }}
                    >
                      {r.skill?.name || "General"} ·{" "}
                      {Math.floor((r.durationSeconds || 0) / 60)}:
                      {((r.durationSeconds || 0) % 60)
                        .toString()
                        .padStart(2, "0")}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 20,
                      fontSize: 12,
                      color: "rgba(255,255,255,0.35)",
                      flexShrink: 0,
                    }}
                  >
                    <span>
                      <Eye
                        size={12}
                        style={{ display: "inline", marginRight: 4 }}
                      />
                      {Number(r.viewsCount || 0).toLocaleString()}
                    </span>
                    <span>
                      <Heart
                        size={12}
                        style={{ display: "inline", marginRight: 4 }}
                      />
                      {Number(r.likesCount || 0).toLocaleString()}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background:
                        r.processingStatus === "COMPLETED"
                          ? "rgba(74,222,128,0.1)"
                          : "rgba(250,204,21,0.1)",
                      borderRadius: 99,
                      padding: "4px 10px",
                      color:
                        r.processingStatus === "COMPLETED"
                          ? "#4ade80"
                          : "#facc15",
                    }}
                  >
                    {r.processingStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
