"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@repo/ui/layout";
import { Search, Users, UserPlus, Check, Loader2, Zap } from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import Link from "next/link";

export default function ExplorerPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { accessToken, user: currentUser } = useAuthStore();

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/search?q=${val}`,
        {
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
        },
      );
      if (res.ok) {
        setResults(await res.json());
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (user: any) => {
    if (!accessToken) return;

    const isFollowing = user.followers?.length > 0;
    const method = isFollowing ? "DELETE" : "POST";

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/follow/${user.id}`,
        {
          method,
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (res.ok) {
        const status =
          method === "POST"
            ? user.role === "CREATOR"
              ? "ACCEPTED"
              : "PENDING"
            : "NONE";
        setResults((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? {
                  ...u,
                  followers: status === "NONE" ? [] : [{ status }],
                }
              : u,
          ),
        );
      }
    } catch (err) {
      console.error("Follow failed:", err);
    }
  };

  return (
    <MainLayout>
      <div
        style={{
          padding: "48px 32px",
          maxWidth: 800,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 40,
        }}
      >
        {/* Header */}
        <div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#fff",
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}
          >
            Explorer
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
            Find and connect with other learners and creators.
          </p>
        </div>

        {/* Search Input */}
        <div style={{ position: "relative" }}>
          <Search
            size={20}
            style={{
              position: "absolute",
              left: 20,
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.3)",
            }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or username..."
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              padding: "18px 20px 18px 56px",
              fontSize: 16,
              color: "#fff",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? (
            <div
              style={{ display: "flex", justifyContent: "center", padding: 40 }}
            >
              <Loader2
                size={32}
                className="animate-spin"
                color="rgba(255,255,255,0.2)"
              />
            </div>
          ) : results.length > 0 ? (
            results.map((u) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 20,
                  padding: "16px 20px",
                }}
              >
                <Link
                  href={`/app/profile/${u.username}`}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "#111",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.2)",
                    textDecoration: "none",
                  }}
                >
                  {u.userProfile?.avatarUrl ? (
                    <img
                      src={u.userProfile.avatarUrl}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 14,
                      }}
                    />
                  ) : (
                    u.username[0].toUpperCase()
                  )}
                </Link>
                <div style={{ flex: 1 }}>
                  <Link
                    href={`/app/profile/${u.username}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}
                      >
                        @{u.username}
                      </span>
                      {u.role === "CREATOR" && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            background: "rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.4)",
                            padding: "2px 6px",
                            borderRadius: 4,
                          }}
                        >
                          CREATOR
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.3)",
                        marginTop: 2,
                      }}
                    >
                      {u.fullName || u.userProfile?.displayName}
                    </div>
                  </Link>
                </div>
                {u.id !== currentUser?.id && (
                  <button
                    onClick={() => toggleFollow(u)}
                    style={{
                      background:
                        u.followers?.length > 0
                          ? "rgba(255,255,255,0.05)"
                          : "#fff",
                      color: u.followers?.length > 0 ? "#fff" : "#000",
                      border:
                        u.followers?.length > 0
                          ? "1px solid rgba(255,255,255,0.1)"
                          : "none",
                      borderRadius: 12,
                      padding: "8px 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {u.followers?.[0]?.status === "ACCEPTED"
                      ? "Following"
                      : u.followers?.[0]?.status === "PENDING"
                        ? "Requested"
                        : "Follow"}
                  </button>
                )}
              </div>
            ))
          ) : query ? (
            <div
              style={{
                textAlign: "center",
                padding: "64px 0",
                color: "rgba(255,255,255,0.2)",
                fontSize: 14,
              }}
            >
              No accounts found for "{query}"
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "80px 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              <Zap size={48} color="rgba(255,255,255,0.05)" />
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 14 }}>
                Search for creators to learn from or other learners to connect
                with.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
