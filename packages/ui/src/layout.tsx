"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home as HomeIcon,
  Users,
  MessageCircle,
  PlusSquare,
  User,
  Settings,
  LogOut,
  Zap,
  Compass,
} from "lucide-react";

import { useAuthStore } from "../../../apps/web/store/authStore";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const role = isMounted && user ? user.role : "USER";
  const username = isMounted && user ? user.username : "";

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Creators go to their own profile page (/app/profile/[username])
  // Learners go to the learner profile (/app/profile)
  const profileHref =
    role === "CREATOR" && username
      ? `/app/profile/${username}`
      : "/app/profile";

  const baseNav = [
    { name: "Home", href: "/app/home", icon: HomeIcon },
    { name: "Explore", href: "/app/explorer", icon: Compass },
    { name: "Communities", href: "/app/community", icon: Users },
    { name: "Messages", href: "/app/messages", icon: MessageCircle },
  ];

  const navItems = [
    ...baseNav.slice(0, 2), // Home, Explore
    ...(role === "CREATOR"
      ? [{ name: "Create", href: "/app/creator", icon: PlusSquare }]
      : []),
    ...baseNav.slice(2), // Communities, Messages
    { name: "Profile", href: profileHref, icon: User },
  ];

  return (
    <div style={s.root}>
      <style dangerouslySetInnerHTML={{ __html: RESPONSIVE_CSS }} />

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="sj-sidebar" style={s.sidebar}>
        {/* Brand */}
        <Link href="/app/home" style={s.brand}>
          <img
            src="/logo-dark.png"
            alt="SkillJoy"
            style={{ height: 32, objectFit: "contain" }}
          />
          {role === "CREATOR" && <span style={s.creatorBadge}>Creator</span>}
        </Link>

        {/* Nav */}
        <nav
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}
        >
          {navItems.map((item) => {
            if (!item) return null;
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                style={{
                  ...s.navLink,
                  background: active ? "#fff" : "transparent",
                  color: active ? "#000" : "rgba(255,255,255,0.45)",
                }}
              >
                <item.icon
                  size={16}
                  color={active ? "#000" : "rgba(255,255,255,0.4)"}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={s.sidebarBottom}>
          <Link
            href={profileHref}
            style={{ ...s.navLink, color: "rgba(255,255,255,0.25)" }}
          >
            <Settings
              size={15}
              color="rgba(255,255,255,0.25)"
              strokeWidth={1.8}
            />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Settings</span>
          </Link>
          <button onClick={handleLogout} style={s.logoutBtn}>
            <LogOut size={15} />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="sj-main" style={s.main}>
        {children}
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="sj-mobile-nav" style={s.mobileNav}>
        {navItems.slice(0, 5).map((item) => {
          if (!item) return null;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              style={{
                ...s.mobileItem,
                color: active ? "#fff" : "rgba(255,255,255,0.3)",
              }}
            >
              <item.icon
                size={20}
                color={active ? "#fff" : "rgba(255,255,255,0.3)"}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: active ? 700 : 500,
                  letterSpacing: "0.05em",
                }}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#050505",
    color: "#f5f5f5",
    display: "flex",
    fontFamily: "'DM Sans', sans-serif",
  },
  sidebar: {
    width: 240,
    height: "100vh",
    position: "fixed",
    left: 0,
    top: 0,
    background: "#080808",
    borderRight: "1px solid rgba(255,255,255,0.04)",
    display: "flex",
    flexDirection: "column",
    padding: "28px 16px",
    zIndex: 50,
    gap: 4,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 32,
    textDecoration: "none",
    paddingLeft: 4,
  },
  brandIcon: {
    width: 30,
    height: 30,
    background: "#fff",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  brandName: {
    fontSize: 16,
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-0.02em",
  },
  creatorBadge: {
    marginLeft: "auto",
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 99,
    padding: "3px 8px",
    color: "rgba(255,255,255,0.5)",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 12,
    textDecoration: "none",
    transition: "all 0.2s",
    color: "rgba(255,255,255,0.45)",
  },
  sidebarBottom: {
    marginTop: "auto",
    paddingTop: 16,
    borderTop: "1px solid rgba(255,255,255,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 12,
    background: "none",
    border: "none",
    color: "rgba(239,68,68,0.5)",
    cursor: "pointer",
    fontFamily: "inherit",
    width: "100%",
    textAlign: "left" as const,
    transition: "color 0.2s",
  },
  main: { flex: 1, marginLeft: 240, minHeight: "100vh", position: "relative" },
  mobileNav: {
    display: "flex",
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: 68,
    background: "rgba(5,5,5,0.97)",
    backdropFilter: "blur(20px)",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    zIndex: 50,
    alignItems: "center",
    justifyContent: "space-around",
    padding: "0 8px",
  },
  mobileItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "8px 16px",
    textDecoration: "none",
    transition: "color 0.2s",
  },
};

// Inject responsive styles
const RESPONSIVE_CSS = `
  @media (max-width: 768px) {
    .sj-sidebar { display: none !important; }
    .sj-main { margin-left: 0 !important; padding-bottom: 76px; }
    .sj-mobile-nav { display: flex !important; }
  }
  @media (min-width: 769px) {
    .sj-mobile-nav { display: none !important; }
  }
`;
