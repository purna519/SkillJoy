"use client";
// Triggering HMR to fix potential 404 glitch

import React, { useEffect, useState } from "react";
import {
  Zap,
  Heart,
  MessageCircle,
  Bookmark,
  MoreVertical,
  Star,
} from "lucide-react";

const features = [
  {
    title: "AI Personalized Feed",
    desc: "Adaptive reels evolve based on watch behavior, depth preference, and engagement signals.",
  },
  {
    title: "Deep Learning Layers",
    desc: "Expand reels into full videos, PDFs, notes, discussions, and creator ecosystems.",
  },
  {
    title: "Realtime Communities",
    desc: "Skill-based collaborative spaces with live discussions, resources, and peer learning.",
  },
  {
    title: "Creator Economy",
    desc: "Empower educators with analytics, live rooms, monetization, and growth systems.",
  },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="lp-bg">
      {/* Ambient Background */}
      <div className="lp-ambient-top" />
      <div className="lp-grid" />

      {/* ── NAVBAR ── */}
      <header className="lp-header">
        <div className={`lp-nav${scrolled ? " lp-nav-scrolled" : ""}`}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="lp-logo-box">S</div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                  letterSpacing: "0.01em",
                  color: "#fff",
                }}
              >
                SkillJoy
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: "0.05em",
                }}
              >
                AI Social Learning
              </div>
            </div>
          </div>

          <nav className="lp-nav-links">
            {["Explore", "Communities", "Creators"].map((item) => (
              <a
                key={item}
                href={`/app/${item.toLowerCase()}`}
                className="lp-nav-link"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="lp-nav-actions">
            <a href="/auth/login" className="lp-login-link">
              Login
            </a>
            <a href="/auth/signup" className="lp-cta-btn">
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-grid">
          {/* Left: Text */}
          <div className="lp-hero-left">
            <div className="lp-ambient-blob" />

            <div className="lp-badge">
              <span className="lp-badge-dot" />
              The Future of Social Learning
            </div>

            <h1 className="lp-h1">
              Turn
              <br />
              Scrolling
              <br />
              Into Skill
              <br />
              Building.
            </h1>

            <p className="lp-subtext">
              SkillJoy transforms addictive scrolling into immersive AI-powered
              learning experiences through cinematic reels, intelligent
              communities, and creator-driven ecosystems.
            </p>

            <div className="lp-buttons">
              <a href="/auth/signup" className="lp-btn-primary">
                Start Learning
              </a>
              <a href="/auth/signup?role=creator" className="lp-btn-secondary">
                Become a Creator
              </a>
            </div>

            <div className="lp-social-proof">
              {[
                { num: "120K+", label: "Active Learners" },
                {
                  num: (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      4.9 <Star size={14} fill="#facc15" color="#facc15" />
                    </div>
                  ),
                  label: "Creator Rating",
                },
                { num: "15M+", label: "Learning Sessions" },
              ].map(({ num, label }) => (
                <div key={label}>
                  <span className="lp-stat-number">{num}</span>
                  <span className="lp-stat-label">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Phone Mockup */}
          <div className="lp-hero-right">
            <div className="lp-glow-orb" />

            {/* Floating Card — AI Progress */}
            <div className="lp-card lp-card-top">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}
                  >
                    AI Progress
                  </div>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      marginTop: 4,
                      color: "#fff",
                    }}
                  >
                    +42%
                  </div>
                </div>
                <div className="lp-card-ai-box">AI</div>
              </div>
            </div>

            {/* Floating Card — Trending Skill */}
            <div className="lp-card lp-card-bottom">
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                Trending Skill
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginTop: 6,
                  color: "#fff",
                }}
              >
                Prompt Engineering
              </div>
              <div className="lp-progress-track">
                <div className="lp-progress-fill" />
              </div>
            </div>

            {/* Phone */}
            <div className="lp-phone">
              <div className="lp-phone-notch">
                <div className="lp-phone-notch-bar" />
              </div>

              <div className="lp-phone-screen">
                <div className="lp-phone-screen-glow" />
                <div className="lp-phone-content">
                  <div className="lp-phone-top-bar">
                    <div className="lp-live-badge">LIVE AI LEARNING</div>
                    <div className="lp-zap-btn">
                      <Zap size={14} fill="#fff" />
                    </div>
                  </div>

                  <div className="lp-phone-bottom">
                    <div>
                      <h3 className="lp-reel-title">
                        Learn AI
                        <br />
                        in 30 Seconds
                      </h3>
                      <p className="lp-reel-desc" style={{ marginTop: 10 }}>
                        Discover cinematic micro-learning experiences
                        personalized by AI.
                      </p>
                    </div>

                    <div className="lp-creator-row">
                      <div className="lp-creator-avatar" />
                      <div>
                        <div className="lp-creator-name">@alex.designs</div>
                        <div className="lp-creator-role">AI Creator</div>
                      </div>
                    </div>

                    <div className="lp-actions-bar">
                      {[
                        {
                          icon: <Heart size={16} fill="currentColor" />,
                          label: "24K",
                        },
                        { icon: <MessageCircle size={16} />, label: "4.2K" },
                        { icon: <Bookmark size={16} />, label: "Save" },
                        { icon: <MoreVertical size={16} />, label: "More" },
                      ].map(({ icon, label }) => (
                        <button key={label} className="lp-action-btn">
                          <span>{icon}</span>
                          <span className="lp-action-label">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-features">
        <div className="lp-features-inner">
          <div className="lp-features-header">
            <p className="lp-features-eyebrow">The Learning Ecosystem</p>
            <h2 className="lp-features-title">
              Built for the next generation of immersive skill discovery.
            </h2>
          </div>
          <div className="lp-features-grid">
            {features.map((item) => (
              <div key={item.title} className="lp-feature-card">
                <div className="lp-feature-icon" />
                <h3 className="lp-feature-title">{item.title}</h3>
                <p className="lp-feature-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              className="lp-logo-box"
              style={{ width: 32, height: 32, borderRadius: 10, fontSize: 14 }}
            >
              S
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>
              SkillJoy
            </span>
          </div>
          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
              marginTop: 0,
            }}
          >
            © 2026 SkillJoy. The future of social learning.
          </p>
        </div>
      </footer>
    </div>
  );
}
