"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /app/video — redirects to /app/explore
 * This page acts as a fallback; individual videos are opened
 * inline in the Home feed or via the Explore grid.
 */
export default function VideoRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app/explore");
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,0.3)",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
      }}
    >
      Redirecting to Explore…
    </div>
  );
}
