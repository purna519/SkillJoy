"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@repo/ui/layout";
import {
  Search,
  Zap,
  Star,
  TrendingUp,
  Users,
  Loader2,
  GraduationCap,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const FALLBACK_CATEGORIES = [
  { name: "Coding", count: "1.2k Reels", icon: Zap },
  { name: "Design", count: "840 Reels", icon: Star },
  { name: "AI", count: "2.5k Reels", icon: Zap },
  { name: "Finance", count: "420 Reels", icon: TrendingUp },
  { name: "Music", count: "610 Reels", icon: Star },
  { name: "Photography", count: "900 Reels", icon: Users },
];

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [reels, setReels] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [communities, setCommunities] = useState<any[]>([]);

  useEffect(() => {
    // Fetch latest reels for the explore feed
    Promise.all([
      fetch(`${API}/videos?limit=12`).then((r) => r.json()),
      fetch(`${API}/communities`).then((r) => r.json()),
    ])
      .then(([videoData, commData]) => {
        const videos = Array.isArray(videoData) ? videoData : [];
        setReels(videos);
        setFiltered(videos);
        setCommunities(Array.isArray(commData) ? commData.slice(0, 4) : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Client-side search filter
  useEffect(() => {
    if (!query.trim()) {
      setFiltered(reels);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      reels.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.creator?.username?.toLowerCase().includes(q) ||
          r.skill?.name?.toLowerCase().includes(q),
      ),
    );
  }, [query, reels]);

  return (
    <MainLayout>
      <div
        style={{
          padding: "48px 32px",
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 64,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Header + Search */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <h1
            style={{
              fontSize: "clamp(40px, 6vw, 72px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "#fff",
              margin: 0,
            }}
          >
            EXPLORE
            <br />
            <span style={{ color: "rgba(255,255,255,0.25)" }}>THE FUTURE.</span>
          </h1>
          <div style={{ position: "relative", maxWidth: 600 }}>
            <Search
              size={20}
              style={{
                position: "absolute",
                left: 20,
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.35)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search skills, creators, or communities..."
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 24,
                padding: "20px 20px 20px 56px",
                fontSize: 16,
                color: "#fff",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        {/* Trending Skills */}
        <section style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            Trending Skills
          </span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 16,
            }}
          >
            {FALLBACK_CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                onClick={() => setQuery(cat.name)}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 24,
                  padding: 24,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 14,
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-6px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.03)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(0)";
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <cat.icon size={20} color="rgba(255,255,255,0.5)" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
                    {cat.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.35)",
                      marginTop: 3,
                    }}
                  >
                    {cat.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live Reels Feed */}
        <section style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              {query ? `Results for "${query}"` : "Latest Reels"}
            </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
              {filtered.length} reels
            </span>
          </div>

          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "48px 0",
              }}
            >
              <Loader2
                size={32}
                color="rgba(255,255,255,0.2)"
                className="animate-spin"
              />
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "64px 0",
                color: "rgba(255,255,255,0.2)",
                fontSize: 14,
              }}
            >
              {query
                ? `No reels found for "${query}"`
                : "No reels yet. Be the first to upload!"}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 16,
              }}
            >
              {filtered.map((reel) => (
                <div
                  key={reel.id}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.transform =
                      "scale(1.03)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.transform =
                      "scale(1)")
                  }
                  style={{
                    aspectRatio: "9/16",
                    background: "#111",
                    borderRadius: 20,
                    overflow: "hidden",
                    position: "relative",
                    cursor: "pointer",
                    transition: "transform 0.2s",
                  }}
                >
                  {reel.thumbnailUrl && (
                    <img
                      src={reel.thumbnailUrl}
                      alt={reel.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      padding: 14,
                    }}
                  >
                    {reel.skill && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          background: "#fff",
                          color: "#000",
                          borderRadius: 4,
                          padding: "2px 6px",
                          marginBottom: 6,
                          display: "inline-block",
                          width: "fit-content",
                        }}
                      >
                        {reel.skill.name}
                      </span>
                    )}
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#fff",
                        lineHeight: 1.3,
                        marginBottom: 4,
                      }}
                    >
                      {reel.title}
                    </div>
                    <div
                      style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}
                    >
                      @{reel.creator?.username}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Live Communities */}
        {communities.length > 0 && (
          <section
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              Active Communities
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {communities.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 20,
                    padding: "16px 20px",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      flexShrink: 0,
                    }}
                  >
                    {c.avatarUrl ? (
                      <img
                        src={c.avatarUrl}
                        style={{
                          width: "100%",
                          borderRadius: 14,
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <GraduationCap size={22} color="rgba(255,255,255,0.2)" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}
                    >
                      {c.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.3)",
                        marginTop: 2,
                      }}
                    >
                      {c._count?.members ?? 0} Members
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  );
}
