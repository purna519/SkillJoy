"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "followers" | "following";
  username: string;
}

export default function FollowListModal({
  isOpen,
  onClose,
  type,
  username,
}: FollowListModalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen || !username) return;

    const fetchUsers = async () => {
      setIsLoading(true);
      const API = process.env.NEXT_PUBLIC_API_URL;
      try {
        const res = await fetch(`${API}/users/${username}/${type}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error(`Failed to fetch ${type}:`, err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, username, type]);

  if (!isOpen) return null;

  const s = {
    overlay: {
      position: "fixed" as const,
      inset: 0,
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      background: "rgba(0,0,0,0.8)",
      backdropFilter: "blur(5px)",
    },
    modal: {
      width: "100%",
      maxWidth: 400,
      maxHeight: "80vh",
      display: "flex",
      flexDirection: "column" as const,
      background: "#111",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 24,
      overflow: "hidden",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px 24px",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    },
    title: {
      fontSize: 20,
      fontWeight: 800,
      color: "#fff",
      margin: 0,
      textTransform: "capitalize" as const,
    },
    closeBtn: {
      background: "rgba(255,255,255,0.05)",
      border: "none",
      borderRadius: "50%",
      width: 36,
      height: 36,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "rgba(255,255,255,0.5)",
      cursor: "pointer",
    },
    content: {
      flex: 1,
      overflowY: "auto" as const,
      padding: "16px 20px",
      display: "flex",
      flexDirection: "column" as const,
      gap: 12,
    },
    userRow: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "12px 16px",
      borderRadius: 16,
      background: "rgba(255,255,255,0.02)",
      cursor: "pointer",
      transition: "background 0.2s",
      border: "1px solid transparent",
    },
    avatarBox: {
      width: 48,
      height: 48,
      borderRadius: "50%",
      background: "#222",
      border: "1px solid rgba(255,255,255,0.1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      flexShrink: 0,
    },
    nameBox: { flex: 1, minWidth: 0 },
    fullName: {
      fontSize: 15,
      fontWeight: 700,
      color: "#fff",
      whiteSpace: "nowrap" as const,
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    username: {
      fontSize: 13,
      color: "rgba(255,255,255,0.4)",
      whiteSpace: "nowrap" as const,
      overflow: "hidden",
      textOverflow: "ellipsis",
      marginTop: 2,
    },
    roleBadge: {
      fontSize: 10,
      fontWeight: 800,
      textTransform: "uppercase" as const,
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 99,
      padding: "3px 8px",
      color: "rgba(255,255,255,0.5)",
    },
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={s.overlay}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          style={s.modal}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={s.header}>
            <h2 style={s.title}>{type}</h2>
            <button onClick={onClose} style={s.closeBtn}>
              <X size={18} />
            </button>
          </div>

          <div style={s.content}>
            {isLoading ? (
              <div
                style={{
                  padding: "40px 0",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Loader2
                  className="animate-spin"
                  size={24}
                  color="rgba(255,255,255,0.5)"
                />
              </div>
            ) : users.length === 0 ? (
              <div
                style={{
                  padding: "40px 0",
                  textAlign: "center",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 14,
                }}
              >
                No {type} found.
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    onClose();
                    router.push(`/app/profile/${user.username}`);
                  }}
                  style={s.userRow}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.06)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.02)")
                  }
                >
                  <div style={s.avatarBox}>
                    {user.userProfile?.avatarUrl ? (
                      <img
                        src={user.userProfile.avatarUrl}
                        alt={user.username}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: "rgba(255,255,255,0.3)",
                        }}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div style={s.nameBox}>
                    <div style={s.fullName}>
                      {user.fullName ||
                        user.userProfile?.displayName ||
                        user.username}
                    </div>
                    <div style={s.username}>@{user.username}</div>
                  </div>

                  <div style={s.roleBadge}>{user.role}</div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
