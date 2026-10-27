"use client";

import React, { useEffect } from "react";
import { AlertOctagon, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for tracking
    console.error("Client Error Boundary Caught:", error);
  }, [error]);

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={s.iconWrapper}>
          <AlertOctagon size={48} color="#ef4444" />
        </div>
        <h2 style={s.title}>Something went wrong.</h2>
        <p style={s.description}>
          An unexpected error occurred while loading this page. Our team has
          been notified.
        </p>
        {error.message && (
          <div style={s.errorDetail}>
            <code style={s.codeSnippet}>{error.message}</code>
          </div>
        )}
        <div style={s.buttonGroup}>
          <button onClick={() => reset()} style={s.retryBtn}>
            <RefreshCw size={14} /> Try Again
          </button>
          <Link href="/app/home" style={s.homeBtn}>
            <Home size={14} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

const s = {
  container: {
    minHeight: "100vh",
    background: "#050505",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Sans', sans-serif",
    padding: 24,
  },
  card: {
    background: "#080808",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: "48px 32px",
    maxWidth: 420,
    width: "100%",
    textAlign: "center" as const,
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
  },
  iconWrapper: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 80,
    borderRadius: 9999,
    background: "rgba(239,68,68,0.1)",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    margin: "0 0 12px",
    color: "#fff",
    letterSpacing: "-0.03em",
  },
  description: {
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
    lineHeight: 1.6,
    margin: "0 0 24px",
  },
  errorDetail: {
    background: "rgba(239,68,68,0.05)",
    border: "1px solid rgba(239,68,68,0.15)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    textAlign: "left" as const,
    overflowX: "auto" as const,
  },
  codeSnippet: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#f87171",
  },
  buttonGroup: {
    display: "flex",
    gap: 12,
  },
  retryBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "#fff",
    color: "#000",
    border: "none",
    borderRadius: 14,
    padding: "14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  homeBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: "14px",
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
  },
};
