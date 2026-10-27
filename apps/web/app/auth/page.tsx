"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  ArrowRight,
  ChevronLeft,
  Eye,
  EyeOff,
  GraduationCap,
  Video,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../../store/authStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type SignupStep = 1 | 2 | 3;
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say", "Other"];

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  // Pre-select creator if URL has ?role=creator
  const initialRole =
    searchParams.get("role")?.toUpperCase() === "CREATOR" ? "CREATOR" : "USER";

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"USER" | "CREATOR">(
    initialRole as "USER" | "CREATOR",
  );
  const [signupStep, setSignupStep] = useState<SignupStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [otherGender, setOtherGender] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    password: "",
    confirmPassword: "",
  });

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  // ── LOGIN ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Login failed");

      // ✅ Update Zustand auth store so all pages see the user
      setAuth(
        {
          id: data.id ?? "",
          email: form.email,
          username: data.username ?? "",
          role: data.role ?? "USER",
          userProfile: data.userProfile,
          creatorProfile: data.creatorProfile,
        },
        data.accessToken,
        data.refreshToken,
      );

      // Also mirror to localStorage for the UI layout component
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("skillJoyRole", data.role ?? "USER");
      localStorage.setItem("skillJoyUsername", data.username ?? "");

      router.push("/app/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // ── SIGNUP VALIDATION ──
  const validateStep = (): string | null => {
    if (signupStep === 1) {
      if (!form.fullName.trim()) return "Full name is required";
      if (!form.username.trim() || form.username.length < 3)
        return "Username must be at least 3 characters";
      if (!/^[a-zA-Z0-9_]+$/.test(form.username))
        return "Username: letters, numbers, underscores only";
    }
    if (signupStep === 2) {
      if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        return "Valid email required";
      if (!form.phone || form.phone.length < 10)
        return "Valid phone number required";
      if (!form.dateOfBirth) return "Date of birth is required";
      if (!form.gender) return "Please select your gender";
    }
    if (signupStep === 3) {
      if (!form.password || form.password.length < 8)
        return "Password must be at least 8 characters";
      if (form.password !== form.confirmPassword)
        return "Passwords do not match";
    }
    return null;
  };

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setSignupStep((p) => (p + 1) as SignupStep);
  };

  // ── SIGNUP SUBMIT ──
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const genderValue =
        form.gender === "Other" ? otherGender || "Other" : form.gender;
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          username: form.username,
          email: form.email,
          phone: form.phone,
          dateOfBirth: form.dateOfBirth,
          gender: genderValue,
          password: form.password,
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          Array.isArray(data.message)
            ? data.message[0]
            : (data.message ?? "Signup failed"),
        );

      // ✅ Update Zustand auth store after signup
      setAuth(
        {
          id: data.id ?? "",
          email: form.email,
          username: form.username,
          role: role,
          userProfile: undefined,
          creatorProfile: undefined,
        },
        data.accessToken,
        data.refreshToken,
      );

      // Mirror to localStorage
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("skillJoyRole", role);
      localStorage.setItem("skillJoyUsername", form.username);

      setVerificationSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#030303",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans', sans-serif",
          padding: 24,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 28,
            padding: "48px 40px",
            textAlign: "center",
            maxWidth: 420,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 24,
              color: "rgba(255,255,255,0.15)",
            }}
          >
            <Mail size={64} />
          </div>
          <h2
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#fff",
              margin: "0 0 12px",
              letterSpacing: "-0.03em",
            }}
          >
            Check your email!
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.4)",
              lineHeight: 1.7,
              maxWidth: 320,
              margin: "0 auto 32px",
            }}
          >
            We&apos;ve sent a verification link to{" "}
            <strong style={{ color: "#fff" }}>{form.email}</strong>.
            <br />
            Please verify to activate your account.
          </p>
          <button
            onClick={() => router.push("/app/home")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "#fff",
              color: "#000",
              border: "none",
              borderRadius: 14,
              padding: "15px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Start Learning <ArrowRight size={16} />
          </button>
          <p
            style={{
              marginTop: 16,
              fontSize: 12,
              color: "rgba(255,255,255,0.2)",
            }}
          >
            You can also verify later in Settings → Email
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={{ ...s.blob, top: "-10%", right: "-5%" }} />
      <div
        style={{
          ...s.blob,
          bottom: "-10%",
          left: "-5%",
          animationDelay: "1.5s",
        }}
      />

      {/* Left branding panel */}
      <div style={s.leftPanel}>
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
          }}
          style={{ maxWidth: 460 }}
        >
          <Link href="/" style={s.backLink}>
            <span style={s.backIcon}>
              <ChevronLeft size={18} />
            </span>
            <span style={s.backText}>Back to Home</span>
          </Link>
          <h1 style={s.leftTitle}>
            {isLogin ? "WELCOME\nBACK." : "JOIN THE\nELITE LAYER."}
          </h1>
          <p style={s.leftSub}>
            SkillJoy — high-performance learning for the next generation of
            global builders and creators.
          </p>
          <div style={s.statsRow}>
            {[
              { v: "120K+", l: "Active Learners" },
              { v: "120+", l: "Skill Categories" },
              { v: "4.9★", l: "Creator Rating" },
            ].map(({ v, l }) => (
              <div key={l}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {v}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.3)",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.2em",
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  {l}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div style={s.rightPanel}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ width: "100%", maxWidth: 420 }}
        >
          <div style={{ marginBottom: 24 }}>
            <h2 style={s.formTitle}>
              {isLogin
                ? "Sign In."
                : signupStep === 1
                  ? "Your Identity."
                  : signupStep === 2
                    ? "Your Details."
                    : "Set Password."}
            </h2>
            <p style={s.formSub}>
              {isLogin
                ? "Sign in to continue your learning journey."
                : `Step ${signupStep} of 3 — ${signupStep === 1 ? "who are you?" : signupStep === 2 ? "tell us about yourself." : "secure your account."}`}
            </p>
          </div>

          {/* Role switcher (signup only) */}
          {!isLogin && (
            <div style={s.roleSwitcher}>
              <motion.div
                style={s.roleSlider}
                animate={{
                  left: role === "USER" ? 4 : "50%",
                  right: role === "USER" ? "50%" : 4,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
              />
              {(["USER", "CREATOR"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    ...s.roleBtn,
                    color: role === r ? "#000" : "rgba(255,255,255,0.4)",
                    position: "relative",
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    {r === "USER" ? (
                      <GraduationCap size={16} />
                    ) : (
                      <Video size={16} />
                    )}
                    {r === "USER" ? "Learner" : "Creator"}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step progress (signup) */}
          {!isLogin && (
            <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 99,
                    background:
                      signupStep >= n ? "#fff" : "rgba(255,255,255,0.1)",
                    transition: "background 0.4s",
                  }}
                />
              ))}
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {isLogin && (
            <form
              onSubmit={handleLogin}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <Field
                label="Email"
                name="email"
                type="email"
                placeholder="name@domain.com"
                icon={<Mail size={15} />}
                value={form.email}
                onChange={set("email")}
              />
              <div style={{ position: "relative" }}>
                <Field
                  label="Password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Your password"
                  icon={<Lock size={15} />}
                  value={form.password}
                  onChange={set("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  style={{
                    position: "absolute",
                    right: 14,
                    bottom: 15,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {error && <div style={s.errorBox}>{error}</div>}
              <button
                type="submit"
                disabled={isLoading}
                style={{ ...s.submitBtn, opacity: isLoading ? 0.7 : 1 }}
              >
                {isLoading ? "Signing in..." : "Sign In"}{" "}
                {!isLoading && (
                  <ArrowRight size={16} style={{ marginLeft: 8 }} />
                )}
              </button>
            </form>
          )}

          {/* ── SIGNUP STEP 1: Identity ── */}
          {!isLogin && signupStep === 1 && (
            <form
              onSubmit={nextStep}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <Field
                label="Full Name"
                name="fullName"
                type="text"
                placeholder="Alex Johnson"
                icon={<UserIcon size={15} />}
                value={form.fullName}
                onChange={set("fullName")}
              />
              <Field
                label="Username"
                name="username"
                type="text"
                placeholder="alex_johnson (unique)"
                icon={<span style={{ fontSize: 13, fontWeight: 700 }}>@</span>}
                value={form.username}
                onChange={set("username")}
              />
              {error && <div style={s.errorBox}>{error}</div>}
              <button type="submit" style={s.submitBtn}>
                Continue <ArrowRight size={16} style={{ marginLeft: 8 }} />
              </button>
            </form>
          )}

          {/* ── SIGNUP STEP 2: Details ── */}
          {!isLogin && signupStep === 2 && (
            <form
              onSubmit={nextStep}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <Field
                label="Email Address"
                name="email"
                type="email"
                placeholder="name@domain.com"
                icon={<Mail size={15} />}
                value={form.email}
                onChange={set("email")}
              />
              <Field
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="+91 98765 43210"
                icon={<Phone size={15} />}
                value={form.phone}
                onChange={set("phone")}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={s.fieldLabel}>Date of Birth</label>
                <input
                  name="dateOfBirth"
                  type="date"
                  required
                  value={form.dateOfBirth}
                  onChange={set("dateOfBirth")}
                  max={new Date().toISOString().split("T")[0]}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    padding: "14px 16px",
                    fontSize: 14,
                    color: "#fff",
                    outline: "none",
                    boxSizing: "border-box" as const,
                    fontFamily: "inherit",
                    colorScheme: "dark",
                  }}
                />
              </div>

              {/* Gender */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={s.fieldLabel}>Gender</label>
                <div
                  style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}
                >
                  {GENDERS.map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setForm((f) => ({ ...f, gender: g }))}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 600,
                        background:
                          form.gender === g ? "#fff" : "rgba(255,255,255,0.04)",
                        color:
                          form.gender === g ? "#000" : "rgba(255,255,255,0.5)",
                        border: `1px solid ${form.gender === g ? "#fff" : "rgba(255,255,255,0.08)"}`,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.2s",
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                {form.gender === "Other" && (
                  <input
                    value={otherGender}
                    onChange={(e) => setOtherGender(e.target.value)}
                    placeholder="Please specify..."
                    style={{
                      marginTop: 6,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      padding: "12px 14px",
                      fontSize: 13,
                      color: "#fff",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                )}
              </div>

              {error && <div style={s.errorBox}>{error}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSignupStep(1)}
                  style={s.backBtn}
                >
                  <ArrowLeft size={16} style={{ marginRight: 8 }} /> Back
                </button>
                <button type="submit" style={{ ...s.submitBtn, flex: 1 }}>
                  Continue <ArrowRight size={16} style={{ marginLeft: 8 }} />
                </button>
              </div>
            </form>
          )}

          {/* ── SIGNUP STEP 3: Password ── */}
          {!isLogin && signupStep === 3 && (
            <form
              onSubmit={handleSignup}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div style={{ position: "relative" }}>
                <Field
                  label="Password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  icon={<Lock size={15} />}
                  value={form.password}
                  onChange={set("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  style={{
                    position: "absolute",
                    right: 14,
                    bottom: 15,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <Field
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                icon={<Lock size={15} />}
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
              />

              {/* Password strength */}
              {form.password && (
                <div style={{ display: "flex", gap: 4 }}>
                  {[1, 2, 3, 4].map((n) => {
                    const strength = [
                      form.password.length >= 8,
                      /[A-Z]/.test(form.password),
                      /[0-9]/.test(form.password),
                      /[^A-Za-z0-9]/.test(form.password),
                    ].filter(Boolean).length;
                    return (
                      <div
                        key={n}
                        style={{
                          flex: 1,
                          height: 3,
                          borderRadius: 99,
                          background:
                            n <= strength
                              ? strength >= 3
                                ? "#4ade80"
                                : strength >= 2
                                  ? "#facc15"
                                  : "#f87171"
                              : "rgba(255,255,255,0.08)",
                          transition: "background 0.3s",
                        }}
                      />
                    );
                  })}
                </div>
              )}

              {error && <div style={s.errorBox}>{error}</div>}

              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 14,
                  padding: "12px 14px",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.35)",
                  lineHeight: 1.6,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Mail size={14} /> A verification link will be sent to{" "}
                <strong style={{ color: "rgba(255,255,255,0.6)" }}>
                  {form.email}
                </strong>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSignupStep(2)}
                  style={s.backBtn}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    ...s.submitBtn,
                    flex: 1,
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  {isLoading ? "Creating..." : "Create Account"}{" "}
                  {!isLoading && (
                    <ArrowRight size={16} style={{ marginLeft: 8 }} />
                  )}
                </button>
              </div>
            </form>
          )}

          <p style={s.switchRow}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setSignupStep(1);
              }}
              style={s.switchBtn}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// Wrap in Suspense because useSearchParams() requires it in Next.js App Router
export default function AuthPage() {
  return (
    <Suspense
      fallback={<div style={{ minHeight: "100vh", background: "#030303" }} />}
    >
      <AuthPageInner />
    </Suspense>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  icon,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          color: "rgba(255,255,255,0.3)",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "rgba(255,255,255,0.3)",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          {icon}
        </span>
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required
          value={value}
          onChange={onChange}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: "14px 14px 14px 44px",
            fontSize: 14,
            color: "#fff",
            outline: "none",
            boxSizing: "border-box" as const,
            fontFamily: "inherit",
            transition: "border-color 0.2s",
            colorScheme: "dark",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")
          }
        />
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#030303",
    color: "#fff",
    display: "flex",
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  blob: {
    position: "fixed",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.03)",
    filter: "blur(100px)",
    pointerEvents: "none",
  },
  leftPanel: {
    flex: 1,
    padding: 80,
    borderRight: "1px solid rgba(255,255,255,0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 20,
  },
  leftTitle: {
    fontSize: "clamp(36px, 3.5vw, 56px)",
    fontWeight: 800,
    lineHeight: 1.05,
    letterSpacing: "-0.04em",
    margin: "48px 0 18px",
    whiteSpace: "pre-line" as const,
  },
  leftSub: {
    fontSize: 15,
    color: "rgba(255,255,255,0.35)",
    lineHeight: 1.7,
    fontWeight: 300,
    marginBottom: 48,
  },
  statsRow: {
    display: "flex",
    gap: 36,
    borderTop: "1px solid rgba(255,255,255,0.05)",
    paddingTop: 36,
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
    color: "rgba(255,255,255,0.35)",
  },
  backIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
  },
  rightPanel: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 32px",
    position: "relative",
    zIndex: 20,
    overflowY: "auto" as const,
  },
  formTitle: {
    fontSize: 30,
    fontWeight: 700,
    letterSpacing: "-0.03em",
    marginBottom: 8,
  },
  formSub: { fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 },
  roleSwitcher: {
    position: "relative",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: 4,
    display: "flex",
    overflow: "hidden",
    marginBottom: 20,
  },
  roleSlider: {
    position: "absolute",
    top: 4,
    bottom: 4,
    background: "#fff",
    borderRadius: 10,
  },
  roleBtn: {
    flex: 1,
    padding: "11px 0",
    fontSize: 13,
    fontWeight: 700,
    background: "none",
    border: "none",
    cursor: "pointer",
    transition: "color 0.2s",
    fontFamily: "inherit",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "rgba(255,255,255,0.3)",
  },
  errorBox: {
    fontSize: 13,
    color: "#f87171",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.15)",
    borderRadius: 12,
    padding: "12px 16px",
    lineHeight: 1.5,
  },
  submitBtn: {
    marginTop: 4,
    width: "100%",
    padding: "16px",
    background: "#fff",
    color: "#000",
    border: "none",
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
    transition: "opacity 0.2s",
  },
  backBtn: {
    padding: "16px 18px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(255,255,255,0.5)",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  switchRow: {
    marginTop: 28,
    textAlign: "center" as const,
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
  },
  switchBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
    fontFamily: "inherit",
    textDecoration: "underline",
  },
};
