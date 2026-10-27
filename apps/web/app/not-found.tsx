"use client";

import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        textAlign: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          fontSize: "clamp(100px, 20vw, 200px)",
          fontWeight: 800,
          letterSpacing: "-0.05em",
          lineHeight: 1,
          color: "rgba(255,255,255,0.05)",
        }}
      >
        404
      </div>
      <h1
        style={{
          fontSize: "clamp(28px, 4vw, 48px)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          margin: "-24px 0 16px",
          color: "#fff",
        }}
      >
        Page Not Found
      </h1>
      <p
        style={{
          fontSize: 16,
          color: "rgba(255,255,255,0.4)",
          marginBottom: 40,
          maxWidth: 400,
          lineHeight: 1.6,
        }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          background: "#fff",
          color: "#000",
          padding: "14px 32px",
          borderRadius: 99,
          fontSize: 13,
          fontWeight: 700,
          textDecoration: "none",
          letterSpacing: "0.05em",
        }}
      >
        Go Home
      </Link>
    </div>
  );
}
