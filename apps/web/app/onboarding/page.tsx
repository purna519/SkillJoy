"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Check,
  Cpu,
  Globe,
  Palette,
  BarChart3,
  TrendingUp,
  Camera,
  Film,
  Link,
  Music,
  Rocket,
  FlaskConical,
  Languages,
  Sparkles,
  Globe2,
  PenTool,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Fix 5: Users choose up to 5 skills (fewer = better recommendation quality)
const MAX_SKILLS = 5;
// Fix 6: Users choose up to 3 languages
const MAX_LANGUAGES = 3;

const SKILL_CATEGORIES = [
  { name: "AI & Machine Learning", icon: <Cpu size={22} /> },
  { name: "Web Development", icon: <Globe size={22} /> },
  { name: "UI/UX Design", icon: <Palette size={22} /> },
  { name: "Data Science", icon: <BarChart3 size={22} /> },
  { name: "Finance & Investing", icon: <TrendingUp size={22} /> },
  { name: "Photography", icon: <Camera size={22} /> },
  { name: "Cinematography", icon: <Film size={22} /> },
  { name: "Blockchain & Web3", icon: <Link size={22} /> },
  { name: "Music Production", icon: <Music size={22} /> },
  { name: "Business & Marketing", icon: <Rocket size={22} /> },
  { name: "Science & Research", icon: <FlaskConical size={22} /> },
  { name: "Languages", icon: <Languages size={22} /> },
];

const LANGUAGES = [
  "English",
  "Hindi",
  "Spanish",
  "French",
  "German",
  "Japanese",
  "Portuguese",
  "Arabic",
  "Korean",
  "Italian",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [otherSkill, setOtherSkill] = useState("");
  const [showOtherSkill, setShowOtherSkill] = useState(false);
  const [otherLang, setOtherLang] = useState("");
  const [showOtherLang, setShowOtherLang] = useState(false);

  // Fix 5: Toggle skill — enforce MAX_SKILLS limit
  const toggleSkill = (name: string) => {
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((x) => x !== name);
      if (prev.length >= MAX_SKILLS) return prev; // block selection beyond limit
      return [...prev, name];
    });
  };

  // Fix 6: Toggle language — enforce MAX_LANGUAGES limit
  const toggleLanguage = (lang: string) => {
    setLanguages((prev) => {
      if (prev.includes(lang)) return prev.filter((x) => x !== lang);
      if (prev.length >= MAX_LANGUAGES) return prev;
      return [...prev, lang];
    });
  };

  const addOtherSkill = () => {
    const trimmed = otherSkill.trim();
    if (!trimmed) return;
    const key = `Other: ${trimmed}`;
    if (!selected.includes(key) && selected.length < MAX_SKILLS) {
      setSelected((prev) => [...prev, key]);
    }
    setOtherSkill("");
  };

  const addOtherLang = () => {
    const trimmed = otherLang.trim();
    if (!trimmed) return;
    const key = `Other: ${trimmed}`;
    if (!languages.includes(key) && languages.length < MAX_LANGUAGES) {
      setLanguages((prev) => [...prev, key]);
    }
    setOtherLang("");
    setShowOtherLang(false);
  };

  const finish = () => {
    localStorage.setItem("skillJoyInterests", JSON.stringify(selected));
    localStorage.setItem("skillJoyLanguages", JSON.stringify(languages));
    router.push("/app/home");
  };

  const skillsRemaining = MAX_SKILLS - selected.length;
  const langRemaining = MAX_LANGUAGES - languages.length;
  const canSelectSkill = (name: string) =>
    selected.includes(name) || selected.length < MAX_SKILLS;
  const canSelectLanguage = (lang: string) =>
    languages.includes(lang) || languages.length < MAX_LANGUAGES;

  return (
    <div style={s.page}>
      <div style={{ ...s.glow, top: "-20%", left: "-10%" }} />
      <div
        style={{
          ...s.glow,
          bottom: "-20%",
          right: "-10%",
          animationDelay: "1.5s",
        }}
      />

      {/* Step dots */}
      <div style={s.progress}>
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              ...s.dot,
              width: step === i ? 48 : 24,
              background: step === i ? "#fff" : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -32, scale: 1.02 }}
          transition={{
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
          }}
          style={s.card}
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            style={s.iconBox}
          >
            {step === 1 ? <Sparkles size={32} /> : <Globe2 size={32} />}
          </motion.div>

          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h1 style={s.title}>
              {step === 1
                ? "WHAT DO YOU\nWANT TO LEARN?"
                : "PICK YOUR\nLANGUAGES."}
            </h1>
            <p style={s.subtitle}>
              {step === 1
                ? `Choose up to ${MAX_SKILLS} skills. Pick wisely — focused beats scattered.`
                : `Pick up to ${MAX_LANGUAGES} languages for your feed.`}
            </p>

            {/* Fix 5 & 6: Live counter badge */}
            <div
              style={{
                marginTop: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {step === 1 && (
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: selected.length >= MAX_SKILLS ? "#f87171" : "#fff",
                    background:
                      selected.length >= MAX_SKILLS
                        ? "rgba(248,113,113,0.1)"
                        : "rgba(255,255,255,0.1)",
                    borderRadius: 99,
                    padding: "4px 14px",
                    border: `1px solid ${selected.length >= MAX_SKILLS ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.1)"}`,
                  }}
                >
                  {selected.length}/{MAX_SKILLS} selected
                  {selected.length >= MAX_SKILLS && " — limit reached"}
                </div>
              )}
              {step === 2 && (
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color:
                      languages.length >= MAX_LANGUAGES ? "#f87171" : "#fff",
                    background:
                      languages.length >= MAX_LANGUAGES
                        ? "rgba(248,113,113,0.1)"
                        : "rgba(255,255,255,0.1)",
                    borderRadius: 99,
                    padding: "4px 14px",
                    border: `1px solid ${languages.length >= MAX_LANGUAGES ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.1)"}`,
                  }}
                >
                  {languages.length}/{MAX_LANGUAGES} selected
                  {languages.length >= MAX_LANGUAGES && " — limit reached"}
                </div>
              )}
            </div>
          </div>

          {/* ── STEP 1: SKILLS ── */}
          {step === 1 && (
            <>
              <div style={s.grid}>
                {SKILL_CATEGORIES.map((skill) => {
                  const active = selected.includes(skill.name);
                  const disabled = !canSelectSkill(skill.name);
                  return (
                    <button
                      key={skill.name}
                      onClick={() => toggleSkill(skill.name)}
                      disabled={disabled}
                      title={disabled ? `Max ${MAX_SKILLS} skills allowed` : ""}
                      style={{
                        ...s.skillBtn,
                        background: active ? "#fff" : "rgba(255,255,255,0.04)",
                        color: active
                          ? "#000"
                          : disabled
                            ? "rgba(255,255,255,0.2)"
                            : "rgba(255,255,255,0.6)",
                        border: `1px solid ${active ? "#fff" : "rgba(255,255,255,0.08)"}`,
                        opacity: disabled ? 0.4 : 1,
                        cursor: disabled ? "not-allowed" : "pointer",
                      }}
                    >
                      <span style={{ display: "block", marginBottom: 8 }}>
                        {skill.icon}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          lineHeight: 1.3,
                        }}
                      >
                        {skill.name}
                      </span>
                      {active && (
                        <div style={s.checkMark}>
                          <Check size={11} color="#fff" />
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Other skill */}
                <button
                  onClick={() => setShowOtherSkill(true)}
                  disabled={!showOtherSkill && selected.length >= MAX_SKILLS}
                  style={{
                    ...s.skillBtn,
                    background: showOtherSkill
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(255,255,255,0.02)",
                    color: "rgba(255,255,255,0.5)",
                    border: `1px dashed ${showOtherSkill ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
                    opacity:
                      !showOtherSkill && selected.length >= MAX_SKILLS
                        ? 0.3
                        : 1,
                  }}
                >
                  <span style={{ display: "block", marginBottom: 8 }}>
                    <PenTool size={22} />
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Other</span>
                </button>
              </div>

              {/* Other skill input */}
              <AnimatePresence>
                {showOtherSkill && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      width: "100%",
                      marginBottom: 8,
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <input
                        value={otherSkill}
                        onChange={(e) => setOtherSkill(e.target.value)}
                        placeholder="e.g. Robotics, Game Dev, Cooking..."
                        disabled={
                          selected.filter((s) => s.startsWith("Other:"))
                            .length > 0 && skillsRemaining === 0
                        }
                        style={{
                          flex: 1,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 12,
                          padding: "12px 16px",
                          fontSize: 14,
                          color: "#fff",
                          outline: "none",
                          fontFamily: "inherit",
                        }}
                        onKeyDown={(e) => e.key === "Enter" && addOtherSkill()}
                      />
                      <button
                        onClick={addOtherSkill}
                        disabled={skillsRemaining === 0}
                        style={{
                          background:
                            skillsRemaining > 0
                              ? "#fff"
                              : "rgba(255,255,255,0.1)",
                          color:
                            skillsRemaining > 0
                              ? "#000"
                              : "rgba(255,255,255,0.3)",
                          border: "none",
                          borderRadius: 12,
                          padding: "12px 20px",
                          fontWeight: 700,
                          cursor:
                            skillsRemaining > 0 ? "pointer" : "not-allowed",
                          fontFamily: "inherit",
                          fontSize: 13,
                        }}
                      >
                        Add
                      </button>
                    </div>
                    {/* Added "other" chips */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap" as const,
                        gap: 6,
                        marginTop: 8,
                      }}
                    >
                      {selected
                        .filter((s) => s.startsWith("Other:"))
                        .map((s) => (
                          <div
                            key={s}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              background: "rgba(255,255,255,0.08)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: 99,
                              padding: "4px 12px",
                              fontSize: 12,
                              color: "#fff",
                            }}
                          >
                            {s.replace("Other: ", "")}
                            <button
                              onClick={() =>
                                setSelected((p) => p.filter((x) => x !== s))
                              }
                              style={{
                                background: "none",
                                border: "none",
                                color: "rgba(255,255,255,0.4)",
                                cursor: "pointer",
                                fontSize: 14,
                                lineHeight: 1,
                                padding: 0,
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* ── STEP 2: LANGUAGES (multi-select, max 3) ── */}
          {step === 2 && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  width: "100%",
                  marginBottom: 10,
                }}
              >
                {LANGUAGES.map((lang) => {
                  const active = languages.includes(lang);
                  const disabled = !canSelectLanguage(lang);
                  return (
                    <button
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      disabled={disabled}
                      title={
                        disabled ? `Max ${MAX_LANGUAGES} languages allowed` : ""
                      }
                      style={{
                        ...s.langBtn,
                        background: active ? "#fff" : "rgba(255,255,255,0.04)",
                        color: active
                          ? "#000"
                          : disabled
                            ? "rgba(255,255,255,0.2)"
                            : "rgba(255,255,255,0.5)",
                        border: `1px solid ${active ? "#fff" : "rgba(255,255,255,0.08)"}`,
                        fontWeight: active ? 800 : 600,
                        opacity: disabled ? 0.4 : 1,
                        cursor: disabled ? "not-allowed" : "pointer",
                      }}
                    >
                      {active && (
                        <Check
                          size={13}
                          style={{ display: "inline", marginRight: 6 }}
                        />
                      )}
                      {lang}
                    </button>
                  );
                })}

                {/* Other language */}
                <button
                  onClick={() => setShowOtherLang(true)}
                  disabled={languages.length >= MAX_LANGUAGES && !showOtherLang}
                  style={{
                    ...s.langBtn,
                    background: showOtherLang
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(255,255,255,0.02)",
                    color: "rgba(255,255,255,0.4)",
                    border: `1px dashed rgba(255,255,255,0.1)`,
                    fontWeight: 600,
                    opacity:
                      languages.length >= MAX_LANGUAGES && !showOtherLang
                        ? 0.3
                        : 1,
                  }}
                >
                  <PenTool size={14} style={{ marginRight: 8 }} /> Other
                </button>
              </div>

              {/* Other language input */}
              <AnimatePresence>
                {showOtherLang && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      width: "100%",
                      marginBottom: 8,
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <input
                        value={otherLang}
                        onChange={(e) => setOtherLang(e.target.value)}
                        placeholder="e.g. Swahili, Tamil, Greek..."
                        style={{
                          flex: 1,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 12,
                          padding: "12px 16px",
                          fontSize: 14,
                          color: "#fff",
                          outline: "none",
                          fontFamily: "inherit",
                        }}
                        onKeyDown={(e) => e.key === "Enter" && addOtherLang()}
                      />
                      <button
                        onClick={addOtherLang}
                        disabled={langRemaining === 0}
                        style={{
                          background:
                            langRemaining > 0
                              ? "#fff"
                              : "rgba(255,255,255,0.1)",
                          color:
                            langRemaining > 0
                              ? "#000"
                              : "rgba(255,255,255,0.3)",
                          border: "none",
                          borderRadius: 12,
                          padding: "12px 20px",
                          fontWeight: 700,
                          cursor: langRemaining > 0 ? "pointer" : "not-allowed",
                          fontFamily: "inherit",
                          fontSize: 13,
                        }}
                      >
                        Add
                      </button>
                    </div>
                    {/* Added "other" language chips */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap" as const,
                        gap: 6,
                        marginTop: 8,
                      }}
                    >
                      {languages
                        .filter((l) => l.startsWith("Other:"))
                        .map((l) => (
                          <div
                            key={l}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              background: "rgba(255,255,255,0.08)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: 99,
                              padding: "4px 12px",
                              fontSize: 12,
                              color: "#fff",
                            }}
                          >
                            {l.replace("Other: ", "")}
                            <button
                              onClick={() =>
                                setLanguages((p) => p.filter((x) => x !== l))
                              }
                              style={{
                                background: "none",
                                border: "none",
                                color: "rgba(255,255,255,0.4)",
                                cursor: "pointer",
                                fontSize: 14,
                                lineHeight: 1,
                                padding: 0,
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Actions */}
          <div style={s.actions}>
            <button onClick={finish} style={s.skipBtn}>
              Skip
            </button>
            <button
              onClick={() => (step === 1 ? setStep(2) : finish())}
              disabled={step === 1 && selected.length === 0}
              style={{
                ...s.nextBtn,
                opacity: step === 1 && selected.length === 0 ? 0.3 : 1,
                cursor:
                  step === 1 && selected.length === 0
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {step === 1 ? "Continue" : "Launch Feed"}{" "}
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Hint text */}
          <p
            style={{
              marginTop: 14,
              fontSize: 11,
              color: "rgba(255,255,255,0.2)",
              textAlign: "center" as const,
              lineHeight: 1.6,
            }}
          >
            {step === 1
              ? `You can change your skills anytime in Settings → Interests.`
              : `You can add or remove languages later in Settings → Language.`}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#030303",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 24px 40px",
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: 700,
    height: 700,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.03)",
    filter: "blur(140px)",
    pointerEvents: "none",
  },
  progress: {
    position: "fixed",
    top: 32,
    display: "flex",
    gap: 8,
    alignItems: "center",
    zIndex: 10,
  },
  dot: { height: 4, borderRadius: 99, transition: "all 0.6s ease" },
  card: {
    width: "100%",
    maxWidth: 720,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 10,
  },
  iconBox: {
    width: 80,
    height: 80,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: "clamp(28px, 4.5vw, 48px)",
    fontWeight: 800,
    letterSpacing: "-0.04em",
    lineHeight: 1.1,
    whiteSpace: "pre-line" as const,
    marginBottom: 14,
    textAlign: "center" as const,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.4)",
    lineHeight: 1.6,
    maxWidth: 440,
    margin: "0 auto",
    textAlign: "center" as const,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: 10,
    width: "100%",
    marginBottom: 12,
  },
  skillBtn: {
    position: "relative",
    padding: "18px 14px",
    borderRadius: 18,
    textAlign: "left" as const,
    transition: "all 0.2s",
    fontFamily: "inherit",
  },
  checkMark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    background: "#000",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  langBtn: {
    padding: "14px 16px",
    borderRadius: 14,
    fontSize: 13,
    letterSpacing: "0.04em",
    transition: "all 0.2s",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingTop: 8,
    marginTop: 12,
  },
  skipBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.25)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    fontFamily: "inherit",
    padding: "12px 0",
  },
  nextBtn: {
    background: "#fff",
    color: "#000",
    border: "none",
    borderRadius: 14,
    padding: "14px 28px",
    fontSize: 14,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "opacity 0.2s",
    fontFamily: "inherit",
  },
};
