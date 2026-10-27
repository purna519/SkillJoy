"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@repo/ui/layout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Share2,
  MapPin,
  Calendar,
  Play,
  Upload,
  X,
  ChevronRight,
  Check,
  TrendingUp,
  Eye,
  Heart,
  Users,
  PenTool,
  FileText,
  ListVideo,
  ArrowLeft,
  MoreHorizontal,
  Award,
  BookOpen,
  Flame,
  Edit3,
  Ban,
  MessageSquare,
  Bookmark,
} from "lucide-react";
import EditProfileModal from "../../components/EditProfileModal";
import FollowListModal from "../../components/FollowListModal";

interface SkillProgress {
  subject: string;
  A: number;
  fullMark: number;
}

// Hand-crafted pure SVG Radar Chart (No external chart libraries required!)
const RadarChart = ({ data }: { data: SkillProgress[] }) => {
  const center = 120;
  const radius = 70;

  const points = data
    .map((d, i) => {
      const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2; // Rotate by 90deg so top axis is straight
      const val = d.A / 100;
      const x = center + radius * val * Math.cos(angle);
      const y = center + radius * val * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg
      width="100%"
      height="240"
      viewBox="0 0 240 240"
      style={{ margin: "0 auto", display: "block" }}
    >
      {/* Grid polygon rings */}
      {gridLevels.map((lvl) => {
        const gridPoints = data
          .map((_, i) => {
            const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
            const x = center + radius * lvl * Math.cos(angle);
            const y = center + radius * lvl * Math.sin(angle);
            return `${x},${y}`;
          })
          .join(" ");
        return (
          <polygon
            key={lvl}
            points={gridPoints}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        );
      })}

      {/* Axis lines from center to outer points */}
      {data.map((_, i) => {
        const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        );
      })}

      {/* Main filled polygon representation of skills with sleek theme color */}
      {points && (
        <polygon
          points={points}
          fill="rgba(192, 132, 252, 0.12)"
          stroke="url(#radarGradientPublic)"
          strokeWidth="2.5"
          style={{ transition: "points 0.6s ease" }}
        />
      )}

      {/* Gradient for radar stroke */}
      <defs>
        <linearGradient
          id="radarGradientPublic"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>

      {/* Chart Outer boundaries points as glowing markers */}
      {data.map((d, i) => {
        const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
        const val = d.A / 100;
        const x = center + radius * val * Math.cos(angle);
        const y = center + radius * val * Math.sin(angle);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4.5"
            fill="#c084fc"
            style={{
              transition: "cx 0.6s ease, cy 0.6s ease",
              filter: "drop-shadow(0 0 4px rgba(192,132,252,0.8))",
            }}
          />
        );
      })}

      {/* Axis labels */}
      {data.map((d, i) => {
        const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
        const textX = center + (radius + 24) * Math.cos(angle);
        const textY = center + (radius + 12) * Math.sin(angle);

        return (
          <text
            key={i}
            x={textX}
            y={textY}
            fill="rgba(255,255,255,0.4)"
            fontSize="9"
            fontWeight="700"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {d.subject}
          </text>
        );
      })}
    </svg>
  );
};

const DEFAULT_SKILLS: SkillProgress[] = [
  { subject: "AI & ML", A: 25, fullMark: 100 },
  { subject: "Coding", A: 35, fullMark: 100 },
  { subject: "UI/UX Design", A: 20, fullMark: 100 },
  { subject: "Marketing", A: 15, fullMark: 100 },
  { subject: "Product", A: 15, fullMark: 100 },
  { subject: "Soft Skills", A: 30, fullMark: 100 },
];

const SKILL_SUBCATEGORIES: Record<string, string[]> = {
  "AI & Machine Learning": [
    "Machine Learning",
    "Deep Learning",
    "NLP",
    "Computer Vision",
    "Prompt Engineering",
    "LLMs",
  ],
  "Web Development": [
    "React",
    "Next.js",
    "Node.js",
    "TypeScript",
    "Python",
    "CSS/Design",
  ],
  "UI/UX Design": [
    "Figma",
    "Design Systems",
    "Motion Design",
    "User Research",
    "Prototyping",
  ],
  "Data Science": [
    "Python",
    "SQL",
    "Pandas",
    "Visualization",
    "Statistics",
    "Machine Learning",
  ],
  "Finance & Investing": [
    "Stock Market",
    "Crypto",
    "Options",
    "Real Estate",
    "Personal Finance",
    "DeFi",
  ],
  Photography: [
    "Portrait",
    "Landscape",
    "Street",
    "Editing",
    "Lighting",
    "Composition",
  ],
  Cinematography: [
    "Filmmaking",
    "Color Grading",
    "Editing",
    "Drone",
    "Lighting",
    "Storytelling",
  ],
  "Blockchain & Web3": [
    "Solidity",
    "DeFi",
    "NFTs",
    "DAOs",
    "Layer 2",
    "Smart Contracts",
  ],
  "Music Production": [
    "Beats",
    "Mixing",
    "Mastering",
    "Sound Design",
    "FL Studio",
    "Ableton",
  ],
  "Business & Marketing": [
    "Growth Hacking",
    "SEO",
    "Social Media",
    "Copywriting",
    "Email Marketing",
    "Branding",
  ],
  "Science & Research": [
    "Physics",
    "Chemistry",
    "Biology",
    "Mathematics",
    "Research Methods",
  ],
  Languages: ["English", "Spanish", "French", "Japanese", "Hindi", "Mandarin"],
};

const MOCK_REELS = [
  {
    id: 1,
    title: "GPT-4 Attention Explained",
    views: "128K",
    likes: "24K",
    duration: "0:58",
  },
  {
    id: 2,
    title: "React Server Components",
    views: "84K",
    likes: "15K",
    duration: "1:12",
  },
  {
    id: 3,
    title: "Build a Neural Net in 60s",
    views: "312K",
    likes: "67K",
    duration: "0:47",
  },
  {
    id: 4,
    title: "Prompt Engineering 101",
    views: "215K",
    likes: "44K",
    duration: "1:02",
  },
  {
    id: 5,
    title: "LLMs vs Traditional ML",
    views: "98K",
    likes: "19K",
    duration: "0:55",
  },
  {
    id: 6,
    title: "Fine-tuning GPT on custom data",
    views: "176K",
    likes: "38K",
    duration: "1:18",
  },
];

const formatCount = (num: any) => {
  if (num === null || num === undefined) return "0";
  const n = Number(num);
  if (isNaN(n)) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
};

type UploadStep = 1 | 2 | 3;

import { useAuthStore } from "../../../../store/authStore";

export default function PublicProfilePage() {
  const router = useRouter();
  const { username: profileUsername } = useParams();
  const name: string =
    (Array.isArray(profileUsername) ? profileUsername[0] : profileUsername) ??
    "creator";
  const { user, accessToken } = useAuthStore();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [tab, setTab] = useState("Reels");
  const [drillDown, setDrillDown] = useState<{
    cat: string | null;
    sub: string | null;
  }>({ cat: null, sub: null });
  const [followStatus, setFollowStatus] = useState<
    "NONE" | "PENDING" | "ACCEPTED"
  >("NONE");
  const [showUpload, setShowUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<UploadStep>(1);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [profileData, setProfileData] = useState<any>(null);
  const [reels, setReels] = useState<any[]>([]);
  const [isRestricted, setIsRestricted] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [followRequests, setFollowRequests] = useState<any[]>([]);

  // Learner specific states
  const [takes, setTakes] = useState<any[]>([]);
  const [skillProgress, setSkillProgress] =
    useState<SkillProgress[]>(DEFAULT_SKILLS);
  const [savedReels, setSavedReels] = useState<any[]>([]);

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFollowListOpen, setIsFollowListOpen] = useState(false);
  const [followListType, setFollowListType] = useState<
    "followers" | "following"
  >("followers");

  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const isCreator = user?.role === "CREATOR" || user?.role === "ADMIN";
  const isOwnProfile = user?.username === name;

  useEffect(() => {
    fetchProfile();
  }, [name, accessToken, API]);

  useEffect(() => {
    if (profileData) {
      if (profileData.role === "USER") {
        setTab("Overview");
      } else {
        setTab("Reels");
      }
    }
  }, [profileData]);

  const fetchProfile = async () => {
    if (!API) return;
    try {
      const res = await fetch(`${API}/users/profile/${name}?_t=${Date.now()}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        setIsPrivate(data.isPrivate);
        setIsRestricted(data.isRestricted);

        const isLearner = data.role === "USER";

        if (!data.isRestricted || isOwnProfile) {
          if (isLearner) {
            // Fetch skill progress
            const skillsRes = await fetch(
              `${API}/users/${data.id}/skills/progress`,
              {
                headers: accessToken
                  ? { Authorization: `Bearer ${accessToken}` }
                  : {},
              },
            );
            if (skillsRes.ok) {
              const skData = await skillsRes.json();
              if (Array.isArray(skData) && skData.length > 0)
                setSkillProgress(skData);
            }

            // Fetch takes
            const takesRes = await fetch(`${API}/users/takes/${data.id}`, {
              headers: accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {},
            });
            if (takesRes.ok) {
              setTakes(await takesRes.json());
            }

            // Fetch saved reels if own profile
            if (isOwnProfile && accessToken) {
              const savedRes = await fetch(`${API}/videos/watch-later`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (savedRes.ok) {
                const text = await savedRes.text();
                if (text) setSavedReels(JSON.parse(text));
              }
            }
          } else {
            // Creator reels
            const videoRes = await fetch(`${API}/videos/creator/${data.id}`);
            if (videoRes.ok) {
              const videoText = await videoRes.text();
              if (videoText) setReels(JSON.parse(videoText));
            }
          }
        }

        // Fetch follow status if logged in
        if (accessToken) {
          const followRes = await fetch(
            `${API}/users/follow/${data.id}/status`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            },
          );
          if (followRes.ok) {
            const text = await followRes.text();
            if (text) {
              const statusData = JSON.parse(text);
              setFollowStatus(statusData.status);
            } else {
              setFollowStatus("NONE");
            }
          }

          // If own profile, fetch follow requests
          if (isOwnProfile) {
            const reqRes = await fetch(`${API}/users/follow/requests`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (reqRes.ok) {
              const reqText = await reqRes.text();
              if (reqText) setFollowRequests(JSON.parse(reqText));
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [certificationUrl, setCertificationUrl] = useState("");
  const [otherCategory, setOtherCategory] = useState("");
  const [showOtherCat, setShowOtherCat] = useState(false);
  const [otherSubcategory, setOtherSubcategory] = useState("");
  const [showOtherSub, setShowOtherSub] = useState(false);
  const [creatorSkills, setCreatorSkills] = useState<string[]>([]);

  useEffect(() => {
    const interests = localStorage.getItem("skillJoyInterests");
    if (interests) setCreatorSkills(JSON.parse(interests));
    else setCreatorSkills(Object.keys(SKILL_SUBCATEGORIES).slice(0, 4));
  }, []);

  const [history, setHistory] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null); // For learner specific stats

  const handlePublish = async () => {
    if (!videoFile || !title || !category) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("files", videoFile);
      if (pdfFile) formData.append("files", pdfFile);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("subcategory", subcategory);
      if (certificationUrl)
        formData.append("certificationUrl", certificationUrl);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/videos/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        },
      );

      if (!res.ok) throw new Error("Upload failed");

      resetUpload();
      // Refresh reels
      const videoRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/videos/creator/${profileData?.id}`,
      );
      if (videoRes.ok) setReels(await videoRes.json());
    } catch (err) {
      alert("Error uploading video. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setShowUpload(false);
    setIsUploading(false);
    setUploadStep(1);
    setVideoFile(null);
    setPdfFile(null);
    setCategory("");
    setSubcategory("");
    setTitle("");
    setDescription("");
    setOtherCategory("");
    setShowOtherCat(false);
    setOtherSubcategory("");
    setShowOtherSub(false);
  };

  const isProfileLearner = profileData?.role === "USER";
  const tabs = isProfileLearner
    ? ["Overview", "Progress", "Badges"]
    : ["Reels", "By Category", "Playlists", "About"];

  if (isOwnProfile) {
    if (isProfileLearner) tabs.splice(1, 0, "Saved", "Requests");
    else tabs.splice(2, 0, "Requests");
  }

  const handleAcceptRequest = async (followerId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API}/users/follow/${followerId}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok)
        setFollowRequests((prev) =>
          prev.filter((r) => r.followerId !== followerId),
        );
    } catch (err) {}
  };

  const handleRejectRequest = async (followerId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API}/users/follow/${followerId}/reject`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok)
        setFollowRequests((prev) =>
          prev.filter((r) => r.followerId !== followerId),
        );
    } catch (err) {}
  };

  const [editingReel, setEditingReel] = useState<any | null>(null);

  const handleDeleteReel = async (id: string) => {
    if (
      !accessToken ||
      !window.confirm("Are you sure you want to delete this reel?")
    )
      return;
    try {
      const res = await fetch(`${API}/videos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setReels((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleUpdateReel = async (id: string, data: any) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API}/videos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setReels((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...updated } : r)),
        );
        setEditingReel(null);
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleTogglePrivacy = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API}/users/privacy/toggle`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsPrivate(data.isPrivate);
      }
    } catch (err) {}
  };

  const handleBlockAction = async () => {
    if (!accessToken || !profileData?.id) return;
    const isBlocking = !profileData.isBlockedByViewer;
    if (
      isBlocking &&
      !window.confirm(`Are you sure you want to block @${name}?`)
    )
      return;
    try {
      const res = await fetch(`${API}/users/block/${profileData.id}`, {
        method: isBlocking ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        alert(isBlocking ? `You blocked @${name}` : `You unblocked @${name}`);
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <MainLayout>
      <div
        style={{ minHeight: "100vh", background: "#000", paddingBottom: 80 }}
      >
        {/* Banner */}
        <div
          style={{
            height: 220,
            background: profileData?.userProfile?.bannerUrl
              ? `url(${profileData.userProfile.bannerUrl}) center/cover no-repeat`
              : "linear-gradient(135deg, #111 0%, #0a0a0a 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {!profileData?.userProfile?.bannerUrl && (
            <>
              <div
                style={{
                  position: "absolute",
                  top: -80,
                  right: -80,
                  width: 400,
                  height: 400,
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "50%",
                  filter: "blur(80px)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -60,
                  left: -60,
                  width: 300,
                  height: 300,
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "50%",
                  filter: "blur(60px)",
                }}
              />
            </>
          )}
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          {profileData?.isBlocked ? (
            <div
              style={{
                padding: "80px 24px",
                textAlign: "center",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 32,
                border: "1px dashed rgba(255,255,255,0.08)",
                marginTop: 40,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "rgba(239, 68, 68, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <Ban size={32} color="#ef4444" />
              </div>
              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#fff",
                  marginBottom: 12,
                }}
              >
                {profileData.isBlockedByViewer
                  ? `You blocked @${name}`
                  : "Profile Unavailable"}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.4)",
                  maxWidth: 380,
                  margin: "0 auto",
                  lineHeight: 1.6,
                }}
              >
                {profileData.isBlockedByViewer
                  ? "You blocked this user. Unblock them to see their content, follow them, or message them."
                  : "This profile is unavailable because of active blocks."}
              </p>
              {profileData.isBlockedByViewer && (
                <button
                  onClick={handleBlockAction}
                  style={{
                    background: "#fff",
                    color: "#000",
                    border: "none",
                    borderRadius: 12,
                    padding: "12px 24px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    marginTop: 20,
                    transition: "transform 0.2s",
                  }}
                >
                  Unblock @{name}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Profile header */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 24,
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginTop: -60,
                  marginBottom: 24,
                  position: "relative",
                  zIndex: 10,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 28,
                      background: "#111",
                      border: "4px solid #000",
                      outline: "1px solid rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 44,
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.2)",
                      overflow: "hidden",
                    }}
                  >
                    {profileData?.userProfile?.avatarUrl ? (
                      <img
                        src={profileData.userProfile.avatarUrl}
                        alt={name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      name.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 6,
                      }}
                    >
                      <h1
                        style={{
                          fontSize: 28,
                          fontWeight: 800,
                          letterSpacing: "-0.03em",
                          color: "#fff",
                          margin: 0,
                        }}
                      >
                        {profileData?.userProfile?.displayName ||
                          profileData?.fullName ||
                          name}
                      </h1>
                      <span
                        style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}
                      >
                        @{name}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase" as const,
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 99,
                          padding: "3px 10px",
                          color: "rgba(255,255,255,0.5)",
                        }}
                      >
                        {profileData?.role || "USER"}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: 14,
                        color: "rgba(255,255,255,0.4)",
                        maxWidth: 420,
                        lineHeight: 1.6,
                        margin: "0 0 16px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {profileData?.userProfile?.bio ||
                        (isProfileLearner
                          ? "Learning new skills on SkillJoy."
                          : "Creator on SkillJoy. Sharing knowledge through short-form learning reels.")}
                    </p>

                    {/* Text-based Stats */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        fontSize: 14,
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      {isProfileLearner ? (
                        <div>
                          <span style={{ fontWeight: 700, color: "#fff" }}>
                            Lvl {profileData?.userProfile?.level || 1}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span style={{ fontWeight: 700, color: "#fff" }}>
                            {reels.length}
                          </span>{" "}
                          Reels
                        </div>
                      )}
                      <div
                        onClick={() => {
                          setFollowListType("followers");
                          setIsFollowListOpen(true);
                        }}
                        style={{
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                        className="hover:text-white transition-colors"
                      >
                        <span style={{ fontWeight: 700, color: "#fff" }}>
                          {profileData?.followersCount || 0}
                        </span>{" "}
                        Followers
                      </div>
                      <div
                        onClick={() => {
                          setFollowListType("following");
                          setIsFollowListOpen(true);
                        }}
                        style={{
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                        className="hover:text-white transition-colors"
                      >
                        <span style={{ fontWeight: 700, color: "#fff" }}>
                          {profileData?.followingCount || 0}
                        </span>{" "}
                        Following
                      </div>
                    </div>

                    {/* Edit / Share Buttons */}
                    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                      {isOwnProfile && (
                        <button
                          onClick={() => setIsEditOpen(true)}
                          style={{
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 12,
                            padding: "8px 16px",
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#fff",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "background 0.2s",
                          }}
                          className="hover:bg-white/20"
                        >
                          <Edit3 size={14} /> Edit Profile
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: `${name} on SkillJoy`,
                              url: window.location.href,
                            });
                          } else {
                            navigator.clipboard.writeText(window.location.href);
                            alert("Profile link copied to clipboard!");
                          }
                        }}
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 12,
                          padding: "8px 16px",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "rgba(255,255,255,0.7)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          transition: "background 0.2s",
                        }}
                        className="hover:bg-white/10 hover:text-white"
                      >
                        <Share2 size={14} /> Share Profile
                      </button>
                    </div>
                  </div>
                </div>

                {/* Top Right Actions */}
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap" as const,
                    alignItems: "center",
                  }}
                >
                  {isProfileLearner && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 16,
                        padding: "8px 18px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        backdropFilter: "blur(12px)",
                        cursor: "pointer",
                      }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.12, 1] }}
                        transition={{
                          repeat: Infinity,
                          duration: 2,
                          ease: "easeInOut",
                        }}
                      >
                        <Flame
                          size={20}
                          color="#ff6b35"
                          fill="#ff6b35"
                          style={{
                            filter: "drop-shadow(0 0 6px rgba(255,107,53,0.5))",
                          }}
                        />
                      </motion.div>
                      <div>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 900,
                            color: "#fff",
                            lineHeight: 1,
                          }}
                        >
                          {profileData?.userProfile?.streakCount || 0}
                        </div>
                        <div
                          style={{
                            fontSize: 9,
                            color: "rgba(255,255,255,0.3)",
                            fontWeight: 700,
                          }}
                        >
                          Day Streak
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {isOwnProfile && isCreator && (
                    <button
                      onClick={() => setShowUpload(true)}
                      style={s.uploadBtn}
                    >
                      <Upload size={15} />
                      Upload Reel
                    </button>
                  )}
                  {!isOwnProfile && (
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={async () => {
                          if (!accessToken) return;
                          const method =
                            followStatus === "NONE" ? "POST" : "DELETE";
                          try {
                            const res = await fetch(
                              `${process.env.NEXT_PUBLIC_API_URL}/users/follow/${profileData.id}`,
                              {
                                method,
                                headers: {
                                  Authorization: `Bearer ${accessToken}`,
                                },
                              },
                            );
                            if (res.ok) {
                              const data = await res.json();
                              setFollowStatus(data.status);
                            }
                          } catch (err) {}
                        }}
                        style={{
                          ...s.followBtn,
                          background:
                            followStatus === "ACCEPTED" ||
                            followStatus === "PENDING"
                              ? "rgba(255,255,255,0.05)"
                              : "#fff",
                          color:
                            followStatus === "ACCEPTED" ||
                            followStatus === "PENDING"
                              ? "#fff"
                              : "#000",
                          border:
                            followStatus === "ACCEPTED" ||
                            followStatus === "PENDING"
                              ? "1px solid rgba(255,255,255,0.1)"
                              : "none",
                        }}
                      >
                        {followStatus === "ACCEPTED"
                          ? "Following"
                          : followStatus === "PENDING"
                            ? "Requested"
                            : "Follow"}
                      </button>

                      <button
                        onClick={handleBlockAction}
                        style={{
                          background: "rgba(239, 68, 68, 0.1)",
                          color: "#ef4444",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          borderRadius: 14,
                          padding: "12px 20px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Ban size={15} /> Block
                      </button>
                    </div>
                  )}
                  {isOwnProfile && (
                    <button
                      onClick={handleTogglePrivacy}
                      style={{
                        ...s.iconBtn,
                        width: "auto",
                        padding: "0 16px",
                        gap: 8,
                        borderColor: isPrivate
                          ? "rgba(251, 191, 36, 0.3)"
                          : "rgba(255,255,255,0.08)",
                      }}
                      title={
                        isPrivate ? "Profile is Private" : "Profile is Public"
                      }
                    >
                      <Settings
                        size={16}
                        color={isPrivate ? "#fbbf24" : "rgba(255,255,255,0.5)"}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: isPrivate
                            ? "#fbbf24"
                            : "rgba(255,255,255,0.5)",
                        }}
                      >
                        {isPrivate ? "Private" : "Public"}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Stats removed and replaced with text layout above */}

              {/* Content */}
              {isRestricted && !isOwnProfile ? (
                <div
                  style={{
                    padding: "80px 0",
                    textAlign: "center",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: 32,
                    border: "1px dashed rgba(255,255,255,0.08)",
                    marginTop: 24,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                    }}
                  >
                    <Settings size={32} color="rgba(255,255,255,0.2)" />
                  </div>
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: "#fff",
                      marginBottom: 8,
                    }}
                  >
                    This account is private
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: "rgba(255,255,255,0.4)",
                      maxWidth: 300,
                      margin: "0 auto",
                    }}
                  >
                    Follow this account to see their learning progress and
                    content.
                  </p>
                </div>
              ) : isProfileLearner ? (
                /* Two-Column Social Learner Feed */
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 32,
                    alignItems: "start",
                    marginTop: 24,
                  }}
                  className="profile-grid"
                >
                  {/* ── LEFT COLUMN SIDEBAR (XP & Radar Chart) ── */}
                  <aside
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 28,
                      minWidth: 280,
                    }}
                  >
                    {/* Profile XP & Level Ring Card */}
                    <motion.div
                      whileHover={{ y: -2 }}
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 24,
                        padding: 24,
                        backdropFilter: "blur(12px)",
                        boxShadow: "0 8px 32px 0 rgba(0,0,0,0.3)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              background:
                                "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)",
                              color: "#000",
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              fontWeight: 900,
                            }}
                          >
                            L
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: "#fff",
                              letterSpacing: "-0.01em",
                            }}
                          >
                            Level {profileData?.userProfile?.level || 1}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.4)",
                          }}
                        >
                          {profileData?.userProfile?.xpPoints || 0} /{" "}
                          {(profileData?.userProfile?.level || 1) * 120} XP
                        </span>
                      </div>

                      <div
                        style={{
                          height: 8,
                          background: "rgba(255,255,255,0.06)",
                          borderRadius: 99,
                          overflow: "hidden",
                          position: "relative",
                        }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(100, ((profileData?.userProfile?.xpPoints || 0) / ((profileData?.userProfile?.level || 1) * 120)) * 100)}%`,
                          }}
                          transition={{ type: "spring", stiffness: 80 }}
                          style={{
                            height: "100%",
                            background:
                              "linear-gradient(90deg, #818cf8 0%, #c084fc 50%, #e879f9 100%)",
                            boxShadow: "0 0 10px rgba(192, 132, 252, 0.5)",
                            borderRadius: 99,
                          }}
                        />
                      </div>
                    </motion.div>

                    {/* SVG radar chart */}
                    <div
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: 24,
                        padding: "20px 14px",
                        textAlign: "center",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#fff",
                          margin: "0 0 16px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Skill Radar
                      </h3>
                      <RadarChart data={skillProgress} />
                    </div>
                  </aside>

                  {/* ── RIGHT COLUMN CONTENT (Tabs Row & Active Tab View) ── */}
                  <main
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 24,
                      flex: 1,
                    }}
                  >
                    {/* Tabs Row */}
                    <div style={s.tabRow}>
                      {tabs.map((t) => (
                        <button
                          key={t}
                          onClick={() => setTab(t)}
                          style={{
                            ...s.tab,
                            color:
                              tab === t ? "#fff" : "rgba(255,255,255,0.35)",
                            borderBottom:
                              tab === t
                                ? "2px solid #fff"
                                : "2px solid transparent",
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {/* Content for Learner Tabs */}
                    <div style={{ minHeight: 400 }}>
                      {tab === "Overview" && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                          }}
                        >
                          {takes.length === 0 ? (
                            <div
                              style={{
                                textAlign: "center",
                                padding: "60px 0",
                                color: "rgba(255,255,255,0.2)",
                                background: "rgba(255,255,255,0.01)",
                                border: "1px dashed rgba(255,255,255,0.05)",
                                borderRadius: 20,
                              }}
                            >
                              <MessageSquare
                                size={32}
                                style={{ margin: "0 auto 12px", opacity: 0.3 }}
                              />
                              <p style={{ fontSize: 13, margin: 0 }}>
                                No insights shared on their LearnLine yet.
                              </p>
                            </div>
                          ) : (
                            takes.map((t) => (
                              <div
                                key={t.id}
                                style={{
                                  background: "rgba(255,255,255,0.015)",
                                  border: "1px solid rgba(255,255,255,0.04)",
                                  borderRadius: 20,
                                  padding: 18,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: 10,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: "#fff",
                                      }}
                                    >
                                      @{name}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: "rgba(255,255,255,0.3)",
                                      }}
                                    >
                                      {new Date(
                                        t.createdAt,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <p
                                  style={{
                                    fontSize: 14,
                                    lineHeight: 1.5,
                                    color: "rgba(255,255,255,0.85)",
                                    margin: "0 0 12px",
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  {t.content}
                                </p>
                                {t.video && (
                                  <motion.div
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() =>
                                      router.push(
                                        `/app/explore?v=${t.video?.id}`,
                                      )
                                    }
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 12,
                                      background: "rgba(255,255,255,0.03)",
                                      border:
                                        "1px solid rgba(255,255,255,0.06)",
                                      borderRadius: 16,
                                      padding: 12,
                                      cursor: "pointer",
                                      marginTop: 12,
                                      transition: "background 0.2s",
                                    }}
                                  >
                                    {t.video.thumbnailUrl ? (
                                      <div
                                        style={{
                                          width: 50,
                                          height: 70,
                                          borderRadius: 10,
                                          overflow: "hidden",
                                          position: "relative",
                                          flexShrink: 0,
                                        }}
                                      >
                                        <img
                                          src={t.video.thumbnailUrl}
                                          alt=""
                                          style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                          }}
                                        />
                                        <div
                                          style={{
                                            position: "absolute",
                                            inset: 0,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: "rgba(0,0,0,0.3)",
                                          }}
                                        >
                                          <Play
                                            size={14}
                                            color="#fff"
                                            fill="#fff"
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <div
                                        style={{
                                          width: 36,
                                          height: 36,
                                          borderRadius: 8,
                                          background: "rgba(255,255,255,0.06)",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          flexShrink: 0,
                                        }}
                                      >
                                        <Play
                                          size={16}
                                          color="rgba(255,255,255,0.6)"
                                          fill="rgba(255,255,255,0.3)"
                                        />
                                      </div>
                                    )}
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 3,
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: 10,
                                          fontWeight: 700,
                                          color: "rgba(255,255,255,0.4)",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.05em",
                                        }}
                                      >
                                        Learned from Reel
                                      </span>
                                      <span
                                        style={{
                                          fontSize: 13,
                                          fontWeight: 700,
                                          color: "#fff",
                                          lineHeight: 1.3,
                                        }}
                                      >
                                        {t.video.title}
                                      </span>
                                      {t.video.creator && (
                                        <span
                                          style={{
                                            fontSize: 11,
                                            color: "rgba(255,255,255,0.4)",
                                          }}
                                        >
                                          @{t.video.creator.username}
                                        </span>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {tab === "Progress" && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 20,
                          }}
                        >
                          <h3
                            style={{
                              fontSize: 18,
                              fontWeight: 800,
                              color: "#fff",
                              marginBottom: 8,
                            }}
                          >
                            Skills Progress
                          </h3>
                          {skillProgress.map((skill) => (
                            <div
                              key={skill.subject}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "rgba(255,255,255,0.7)",
                                  }}
                                >
                                  {skill.subject}
                                </span>
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "rgba(255,255,255,0.4)",
                                  }}
                                >
                                  {skill.A}% Mastery
                                </span>
                              </div>
                              <div
                                style={{
                                  height: 6,
                                  background: "rgba(255,255,255,0.06)",
                                  borderRadius: 99,
                                  overflow: "hidden",
                                }}
                              >
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${skill.A}%` }}
                                  style={{
                                    height: "100%",
                                    background:
                                      "linear-gradient(90deg, #818cf8 0%, #c084fc 100%)",
                                    borderRadius: 99,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {tab === "Badges" && (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(200px, 1fr))",
                            gap: 14,
                          }}
                        >
                          {[
                            {
                              icon: "🔥",
                              name: "7-Day Streak",
                              desc: "7 days in a row",
                            },
                            {
                              icon: "🤖",
                              name: "AI Explorer",
                              desc: "Watched 10 AI reels",
                            },
                            {
                              icon: "⚡",
                              name: "Speed Learner",
                              desc: "5 reels in one hour",
                            },
                          ].map((badge) => (
                            <div
                              key={badge.name}
                              style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: 20,
                                padding: "20px 18px",
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                              }}
                            >
                              <span style={{ fontSize: 32 }}>{badge.icon}</span>
                              <div>
                                <div
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "#fff",
                                    marginBottom: 4,
                                  }}
                                >
                                  {badge.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "rgba(255,255,255,0.35)",
                                  }}
                                >
                                  {badge.desc}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {tab === "Saved" && (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(180px, 1fr))",
                            gap: 16,
                          }}
                        >
                          {savedReels.length === 0 ? (
                            <div
                              style={{
                                gridColumn: "1/-1",
                                textAlign: "center",
                                padding: "80px 0",
                                color: "rgba(255,255,255,0.2)",
                              }}
                            >
                              <Bookmark
                                size={36}
                                style={{ margin: "0 auto 12px", opacity: 0.3 }}
                              />
                              <p style={{ fontSize: 13, margin: 0 }}>
                                No saved reels yet. Explore and save some to see
                                them here!
                              </p>
                            </div>
                          ) : (
                            savedReels.map((entry) => (
                              <motion.div
                                key={entry.id}
                                whileHover={{ scale: 1.02 }}
                                onClick={() =>
                                  router.push(
                                    `/app/explore?v=${entry.video?.id}`,
                                  )
                                }
                                style={{
                                  aspectRatio: "9/16",
                                  background: "#090909",
                                  border: "1px solid rgba(255,255,255,0.06)",
                                  borderRadius: 20,
                                  position: "relative",
                                  overflow: "hidden",
                                  cursor: "pointer",
                                }}
                              >
                                {entry.video?.thumbnailUrl ? (
                                  <img
                                    src={entry.video.thumbnailUrl}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      background:
                                        "linear-gradient(135deg, #1e1b4b 0%, #0c0a0f 100%)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Play
                                      size={32}
                                      color="rgba(255,255,255,0.2)"
                                    />
                                  </div>
                                )}
                                <div
                                  style={{
                                    position: "absolute",
                                    inset: 0,
                                    background:
                                      "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "flex-end",
                                    padding: 16,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: "#fff",
                                      lineHeight: 1.4,
                                      marginBottom: 4,
                                    }}
                                  >
                                    {entry.video?.title}
                                  </div>
                                  {entry.video?.creator && (
                                    <div
                                      style={{
                                        fontSize: 10,
                                        color: "rgba(255,255,255,0.4)",
                                        fontWeight: 600,
                                      }}
                                    >
                                      @{entry.video.creator.username}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      )}

                      {tab === "Requests" && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                          }}
                        >
                          <h3
                            style={{
                              fontSize: 18,
                              fontWeight: 800,
                              color: "#fff",
                              marginBottom: 8,
                            }}
                          >
                            Pending Follow Requests
                          </h3>
                          {followRequests.length === 0 ? (
                            <div
                              style={{
                                padding: "40px 0",
                                textAlign: "center",
                                color: "rgba(255,255,255,0.2)",
                              }}
                            >
                              <Users
                                size={40}
                                style={{ marginBottom: 12, opacity: 0.5 }}
                              />
                              <p style={{ fontSize: 14 }}>
                                No pending requests.
                              </p>
                            </div>
                          ) : (
                            followRequests.map((req) => (
                              <div
                                key={req.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  background: "rgba(255,255,255,0.03)",
                                  border: "1px solid rgba(255,255,255,0.06)",
                                  borderRadius: 16,
                                  padding: "12px 20px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: 10,
                                      background: "#222",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontWeight: 700,
                                      color: "rgba(255,255,255,0.3)",
                                    }}
                                  >
                                    {req.follower?.userProfile?.avatarUrl ? (
                                      <img
                                        src={req.follower.userProfile.avatarUrl}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          borderRadius: 10,
                                          objectFit: "cover",
                                        }}
                                      />
                                    ) : (
                                      req.follower?.username
                                        .charAt(0)
                                        .toUpperCase()
                                    )}
                                  </div>
                                  <div>
                                    <div
                                      style={{
                                        fontSize: 14,
                                        fontWeight: 700,
                                        color: "#fff",
                                      }}
                                    >
                                      {req.follower?.userProfile?.displayName ||
                                        req.follower?.username}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 12,
                                        color: "rgba(255,255,255,0.3)",
                                      }}
                                    >
                                      @{req.follower?.username}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button
                                    onClick={() =>
                                      handleAcceptRequest(req.followerId)
                                    }
                                    style={{
                                      background: "#fff",
                                      color: "#000",
                                      border: "none",
                                      borderRadius: 10,
                                      padding: "8px 16px",
                                      fontSize: 12,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleRejectRequest(req.followerId)
                                    }
                                    style={{
                                      background: "rgba(255,255,255,0.05)",
                                      color: "rgba(255,255,255,0.5)",
                                      border: "1px solid rgba(255,255,255,0.1)",
                                      borderRadius: 10,
                                      padding: "8px 16px",
                                      fontSize: 12,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </main>
                </div>
              ) : (
                /* Original Creator Layout */
                <>
                  <div style={s.tabRow}>
                    {tabs.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                          ...s.tab,
                          color: tab === t ? "#fff" : "rgba(255,255,255,0.3)",
                          borderBottom:
                            tab === t
                              ? "2px solid #fff"
                              : "2px solid transparent",
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <div style={{ minHeight: 400 }}>
                    {tab === "Reels" &&
                      (reels.length === 0 ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "80px 0",
                            color: "rgba(255,255,255,0.2)",
                          }}
                        >
                          <Play
                            size={48}
                            style={{ marginBottom: 16, opacity: 0.5 }}
                          />
                          <p style={{ fontSize: 14, fontWeight: 600 }}>
                            No reels uploaded yet.
                          </p>
                        </div>
                      ) : (
                        <div style={s.reelGrid}>
                          {reels.map((r) => (
                            <ReelThumbnail
                              key={r.id}
                              reel={r}
                              isOwn={isOwnProfile}
                              onDelete={() => handleDeleteReel(r.id)}
                              onEdit={() => setEditingReel(r)}
                            />
                          ))}
                        </div>
                      ))}

                    {tab === "By Category" &&
                      (reels.length === 0 ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "80px 0",
                            color: "rgba(255,255,255,0.2)",
                          }}
                        >
                          <BookOpen
                            size={48}
                            style={{ marginBottom: 16, opacity: 0.5 }}
                          />
                          <p style={{ fontSize: 14, fontWeight: 600 }}>
                            No categories available. Upload reels to see them
                            here.
                          </p>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 32,
                          }}
                        >
                          {(drillDown.cat || drillDown.sub) && (
                            <button
                              onClick={() => {
                                if (drillDown.sub)
                                  setDrillDown({ ...drillDown, sub: null });
                                else setDrillDown({ cat: null, sub: null });
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                color: "rgba(255,255,255,0.4)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: 600,
                                padding: 0,
                              }}
                            >
                              <ArrowLeft size={16} />
                              {drillDown.sub
                                ? drillDown.cat
                                : "Back to Categories"}
                            </button>
                          )}

                          {!drillDown.cat && (
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fill, minmax(240px, 1fr))",
                                gap: 16,
                              }}
                            >
                              {Array.from(
                                new Set(
                                  reels.map((r) => r.category || "General"),
                                ),
                              ).map((cat) => {
                                const count = reels.filter(
                                  (r) => (r.category || "General") === cat,
                                ).length;
                                return (
                                  <div
                                    key={cat}
                                    onClick={() =>
                                      setDrillDown({ cat, sub: null })
                                    }
                                    style={{
                                      background: "rgba(255,255,255,0.03)",
                                      border:
                                        "1px solid rgba(255,255,255,0.06)",
                                      borderRadius: 20,
                                      padding: 24,
                                      cursor: "pointer",
                                      transition: "transform 0.2s",
                                    }}
                                    onMouseEnter={(e) =>
                                      ((
                                        e.currentTarget as HTMLElement
                                      ).style.transform = "scale(1.02)")
                                    }
                                    onMouseLeave={(e) =>
                                      ((
                                        e.currentTarget as HTMLElement
                                      ).style.transform = "scale(1)")
                                    }
                                  >
                                    <h4
                                      style={{
                                        margin: "0 0 8px",
                                        fontSize: 16,
                                        fontWeight: 800,
                                      }}
                                    >
                                      {cat}
                                    </h4>
                                    <div
                                      style={{
                                        fontSize: 12,
                                        color: "rgba(255,255,255,0.3)",
                                      }}
                                    >
                                      {count} Reels
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {drillDown.cat && !drillDown.sub && (
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fill, minmax(240px, 1fr))",
                                gap: 16,
                              }}
                            >
                              {Array.from(
                                new Set(
                                  reels
                                    .filter(
                                      (r) =>
                                        (r.category || "General") ===
                                        drillDown.cat,
                                    )
                                    .map((r) => r.subCategory || "General"),
                                ),
                              ).map((sub) => {
                                const count = reels.filter(
                                  (r) =>
                                    (r.category || "General") ===
                                      drillDown.cat &&
                                    (r.subCategory || "General") === sub,
                                ).length;
                                return (
                                  <div
                                    key={sub}
                                    onClick={() =>
                                      setDrillDown({ ...drillDown, sub })
                                    }
                                    style={{
                                      background: "rgba(255,255,255,0.03)",
                                      border:
                                        "1px solid rgba(255,255,255,0.06)",
                                      borderRadius: 20,
                                      padding: 24,
                                      cursor: "pointer",
                                    }}
                                  >
                                    <h4
                                      style={{
                                        margin: "0 0 8px",
                                        fontSize: 15,
                                        fontWeight: 700,
                                      }}
                                    >
                                      {sub}
                                    </h4>
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: "rgba(255,255,255,0.3)",
                                      }}
                                    >
                                      {count} Reels
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {drillDown.sub && (
                            <div style={s.reelGrid}>
                              {reels
                                .filter(
                                  (r) =>
                                    (r.category || "General") ===
                                      drillDown.cat &&
                                    (r.subCategory || "General") ===
                                      drillDown.sub,
                                )
                                .map((r) => (
                                  <ReelThumbnail
                                    key={r.id}
                                    reel={r}
                                    isOwn={isOwnProfile}
                                    onDelete={() => handleDeleteReel(r.id)}
                                    onEdit={() => setEditingReel(r)}
                                  />
                                ))}
                            </div>
                          )}
                        </div>
                      ))}

                    {tab === "Playlists" && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "80px 0",
                          color: "rgba(255,255,255,0.2)",
                        }}
                      >
                        <ListVideo
                          size={48}
                          style={{ marginBottom: 16, opacity: 0.5 }}
                        />
                        <p style={{ fontSize: 14, fontWeight: 600 }}>
                          No playlists created yet.
                        </p>
                      </div>
                    )}

                    {tab === "Requests" && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        <h3
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: "#fff",
                            marginBottom: 8,
                          }}
                        >
                          Pending Follow Requests
                        </h3>
                        {followRequests.length === 0 ? (
                          <div
                            style={{
                              padding: "40px 0",
                              textAlign: "center",
                              color: "rgba(255,255,255,0.2)",
                            }}
                          >
                            <Users
                              size={40}
                              style={{ marginBottom: 12, opacity: 0.5 }}
                            />
                            <p style={{ fontSize: 14 }}>No pending requests.</p>
                          </div>
                        ) : (
                          followRequests.map((req) => (
                            <div
                              key={req.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: 16,
                                padding: "12px 20px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background: "#222",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    color: "rgba(255,255,255,0.3)",
                                  }}
                                >
                                  {req.follower?.userProfile?.avatarUrl ? (
                                    <img
                                      src={req.follower.userProfile.avatarUrl}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: 10,
                                        objectFit: "cover",
                                      }}
                                    />
                                  ) : (
                                    req.follower?.username
                                      .charAt(0)
                                      .toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <div
                                    style={{
                                      fontSize: 14,
                                      fontWeight: 700,
                                      color: "#fff",
                                    }}
                                  >
                                    {req.follower?.userProfile?.displayName ||
                                      req.follower?.username}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: "rgba(255,255,255,0.3)",
                                    }}
                                  >
                                    @{req.follower?.username}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button
                                  onClick={() =>
                                    handleAcceptRequest(req.followerId)
                                  }
                                  style={{
                                    background: "#fff",
                                    color: "#000",
                                    border: "none",
                                    borderRadius: 10,
                                    padding: "8px 16px",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() =>
                                    handleRejectRequest(req.followerId)
                                  }
                                  style={{
                                    background: "rgba(255,255,255,0.05)",
                                    color: "rgba(255,255,255,0.5)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 10,
                                    padding: "8px 16px",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {tab === "About" && (
                      <div style={{ padding: "32px 0", maxWidth: 600 }}>
                        <h3
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#fff",
                            marginBottom: 16,
                          }}
                        >
                          Teaching Skills
                        </h3>
                        <div
                          style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                        >
                          {(creatorSkills.length > 0
                            ? creatorSkills
                            : ["AI & Machine Learning", "Web Development"]
                          ).map((s) => (
                            <span
                              key={s}
                              style={{
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 99,
                                padding: "6px 14px",
                                fontSize: 12,
                                fontWeight: 600,
                                color: "rgba(255,255,255,0.6)",
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>

                        <h3
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#fff",
                            marginTop: 40,
                            marginBottom: 16,
                          }}
                        >
                          Bio
                        </h3>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.5)",
                            lineHeight: 1.8,
                            fontSize: 14,
                          }}
                        >
                          {profileData?.userProfile?.bio ||
                            "No bio provided yet."}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ── UPLOAD MODAL ── */}
        <AnimatePresence>
          {showUpload && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetUpload}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.8)",
                backdropFilter: "blur(8px)",
                zIndex: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "min(480px, 100%)",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  background: "#0d0d0d",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 32,
                  padding: 40,
                  position: "relative",
                }}
              >
                {/* Modal header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 28,
                  }}
                >
                  <div>
                    <div style={s.stepIndicator}>
                      {[1, 2, 3].map((n) => (
                        <div
                          key={n}
                          style={{
                            width: uploadStep >= n ? 32 : 16,
                            height: 4,
                            borderRadius: 99,
                            background:
                              uploadStep >= n
                                ? "#fff"
                                : "rgba(255,255,255,0.1)",
                            transition: "all 0.3s",
                          }}
                        />
                      ))}
                    </div>
                    <h2
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: "#fff",
                        marginTop: 12,
                      }}
                    >
                      {uploadStep === 1
                        ? "Choose Category"
                        : uploadStep === 2
                          ? "Choose Subcategory"
                          : "Add Details"}
                    </h2>
                    <p
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.4)",
                        marginTop: 4,
                      }}
                    >
                      {uploadStep === 1
                        ? "What skill does this reel teach?"
                        : uploadStep === 2
                          ? `Topic within ${category}`
                          : "Tell learners what this reel is about"}
                    </p>
                  </div>
                  <button
                    onClick={resetUpload}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "none",
                      borderRadius: 12,
                      width: 36,
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X size={16} color="rgba(255,255,255,0.5)" />
                  </button>
                </div>

                {/* Step 1: Category */}
                {uploadStep === 1 && (
                  <div style={{ marginBottom: 24 }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                        maxHeight: 300,
                        overflowY: "auto",
                        marginBottom: 10,
                      }}
                    >
                      {(creatorSkills.length > 0
                        ? creatorSkills
                        : Object.keys(SKILL_SUBCATEGORIES)
                      ).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setCategory(cat);
                            setShowOtherCat(false);
                          }}
                          style={{
                            ...s.optionBtn,
                            background:
                              category === cat
                                ? "#fff"
                                : "rgba(255,255,255,0.04)",
                            color:
                              category === cat
                                ? "#000"
                                : "rgba(255,255,255,0.6)",
                            border: `1px solid ${category === cat ? "#fff" : "rgba(255,255,255,0.08)"}`,
                          }}
                        >
                          {category === cat && (
                            <Check size={14} style={{ marginRight: 8 }} />
                          )}
                          {cat}
                        </button>
                      ))}
                      {/* Other category */}
                      <button
                        onClick={() => {
                          setShowOtherCat(true);
                          setCategory("");
                        }}
                        style={{
                          ...s.optionBtn,
                          background: showOtherCat
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(255,255,255,0.02)",
                          color: "rgba(255,255,255,0.4)",
                          border: `1px dashed ${showOtherCat ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)"}`,
                        }}
                      >
                        <PenTool size={14} style={{ marginRight: 8 }} /> Other
                      </button>
                    </div>
                    {showOtherCat && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          value={otherCategory}
                          onChange={(e) => setOtherCategory(e.target.value)}
                          placeholder="e.g. Robotics, Game Dev, Cooking..."
                          style={{
                            flex: 1,
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 12,
                            padding: "11px 14px",
                            fontSize: 13,
                            color: "#fff",
                            outline: "none",
                            fontFamily: "inherit",
                          }}
                        />
                        <button
                          onClick={() => {
                            if (otherCategory.trim())
                              setCategory(`Other: ${otherCategory.trim()}`);
                          }}
                          style={{
                            background: "#fff",
                            color: "#000",
                            border: "none",
                            borderRadius: 12,
                            padding: "11px 18px",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            fontSize: 13,
                          }}
                        >
                          Set
                        </button>
                      </div>
                    )}
                    {category.startsWith("Other:") && (
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 12,
                          color: "rgba(255,255,255,0.5)",
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: 10,
                          padding: "8px 12px",
                        }}
                      >
                        Selected:{" "}
                        <strong style={{ color: "#fff" }}>{category}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Subcategory */}
                {uploadStep === 2 && (
                  <div style={{ marginBottom: 24 }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                        marginBottom: 10,
                      }}
                    >
                      {(SKILL_SUBCATEGORIES[category] ?? []).map((sub) => (
                        <button
                          key={sub}
                          onClick={() => {
                            setSubcategory(sub);
                            setShowOtherSub(false);
                          }}
                          style={{
                            ...s.optionBtn,
                            background:
                              subcategory === sub
                                ? "#fff"
                                : "rgba(255,255,255,0.04)",
                            color:
                              subcategory === sub
                                ? "#000"
                                : "rgba(255,255,255,0.6)",
                            border: `1px solid ${subcategory === sub ? "#fff" : "rgba(255,255,255,0.08)"}`,
                          }}
                        >
                          {subcategory === sub && (
                            <Check size={14} style={{ marginRight: 8 }} />
                          )}
                          {sub}
                        </button>
                      ))}
                      {/* Other subcategory */}
                      <button
                        onClick={() => {
                          setShowOtherSub(true);
                          setSubcategory("");
                        }}
                        style={{
                          ...s.optionBtn,
                          background: showOtherSub
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(255,255,255,0.02)",
                          color: "rgba(255,255,255,0.4)",
                          border: `1px dashed ${showOtherSub ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)"}`,
                        }}
                      >
                        <PenTool size={14} style={{ marginRight: 8 }} /> Other
                      </button>
                    </div>
                    {showOtherSub && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          value={otherSubcategory}
                          onChange={(e) => setOtherSubcategory(e.target.value)}
                          placeholder="e.g. Rust, Flutter, Web3.js..."
                          style={{
                            flex: 1,
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 12,
                            padding: "11px 14px",
                            fontSize: 13,
                            color: "#fff",
                            outline: "none",
                            fontFamily: "inherit",
                          }}
                        />
                        <button
                          onClick={() => {
                            if (otherSubcategory.trim())
                              setSubcategory(
                                `Other: ${otherSubcategory.trim()}`,
                              );
                          }}
                          style={{
                            background: "#fff",
                            color: "#000",
                            border: "none",
                            borderRadius: 12,
                            padding: "11px 18px",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            fontSize: 13,
                          }}
                        >
                          Set
                        </button>
                      </div>
                    )}
                    {subcategory.startsWith("Other:") && (
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 12,
                          color: "rgba(255,255,255,0.5)",
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: 10,
                          padding: "8px 12px",
                        }}
                      >
                        Selected:{" "}
                        <strong style={{ color: "#fff" }}>{subcategory}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Details */}
                {uploadStep === 3 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                      marginBottom: 24,
                    }}
                  >
                    <div
                      onClick={() =>
                        document.getElementById("video-upload")?.click()
                      }
                      style={{
                        ...s.uploadDropzone,
                        borderColor: videoFile
                          ? "#fff"
                          : "rgba(255,255,255,0.12)",
                        cursor: "pointer",
                      }}
                    >
                      <Upload
                        size={28}
                        color={videoFile ? "#fff" : "rgba(255,255,255,0.2)"}
                      />
                      <span
                        style={{
                          fontSize: 14,
                          color: videoFile ? "#fff" : "rgba(255,255,255,0.3)",
                          marginTop: 12,
                        }}
                      >
                        {videoFile ? videoFile.name : "Choose your reel"}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.15)",
                          marginTop: 4,
                        }}
                      >
                        MP4, MOV · Max 500MB · Under 3 minutes
                      </span>
                      <input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        onChange={(e) =>
                          setVideoFile(e.target.files?.[0] || null)
                        }
                        style={{ display: "none" }}
                      />
                      {!videoFile && (
                        <button
                          style={{
                            marginTop: 16,
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 10,
                            padding: "8px 20px",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "rgba(255,255,255,0.6)",
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          Browse Files
                        </button>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={s.tagPill}>{category}</span>
                      <span style={s.tagPill}>{subcategory}</span>
                    </div>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Reel title (keep it punchy!)"
                      style={s.detailInput}
                    />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Short description..."
                      rows={2}
                      style={{ ...s.detailInput, resize: "none" as const }}
                    />
                    <input
                      value={certificationUrl}
                      onChange={(e) => setCertificationUrl(e.target.value)}
                      placeholder="Certification Link (Optional)"
                      style={s.detailInput}
                    />

                    <div
                      onClick={() =>
                        document.getElementById("pdf-upload")?.click()
                      }
                      style={{
                        ...s.uploadDropzone,
                        borderColor: pdfFile
                          ? "#fff"
                          : "rgba(255,255,255,0.06)",
                        padding: "16px",
                        cursor: "pointer",
                        minHeight: "auto",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: pdfFile ? "#fff" : "rgba(255,255,255,0.3)",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {pdfFile ? (
                          <>
                            <FileText size={14} /> {pdfFile.name}
                          </>
                        ) : (
                          "+ Add PDF Resources (Optional)"
                        )}
                      </span>
                      <input
                        id="pdf-upload"
                        type="file"
                        accept="application/pdf"
                        onChange={(e) =>
                          setPdfFile(e.target.files?.[0] || null)
                        }
                        style={{ display: "none" }}
                      />
                    </div>
                  </div>
                )}

                {/* Modal footer */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {uploadStep > 1 ? (
                    <button
                      onClick={() =>
                        setUploadStep((prev) => (prev - 1) as UploadStep)
                      }
                      style={s.backBtn}
                    >
                      ← Back
                    </button>
                  ) : (
                    <div />
                  )}
                  <button
                    onClick={() =>
                      uploadStep < 3
                        ? setUploadStep((prev) => (prev + 1) as UploadStep)
                        : handlePublish()
                    }
                    disabled={
                      isUploading ||
                      (uploadStep === 1 && !category) ||
                      (uploadStep === 2 && !subcategory) ||
                      (uploadStep === 3 && !videoFile)
                    }
                    style={{
                      ...s.nextModalBtn,
                      opacity:
                        isUploading ||
                        (uploadStep === 1 && !category) ||
                        (uploadStep === 2 && !subcategory) ||
                        (uploadStep === 3 && !videoFile)
                          ? 0.3
                          : 1,
                    }}
                  >
                    {isUploading
                      ? "Publishing..."
                      : uploadStep === 3
                        ? "Publish Reel"
                        : "Continue"}
                    {!isUploading && <ChevronRight size={16} />}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editingReel && (
            <EditReelModal
              reel={editingReel}
              onClose={() => setEditingReel(null)}
              onSave={handleUpdateReel}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        profileData={profileData}
        onSuccess={fetchProfile}
      />
      <FollowListModal
        isOpen={isFollowListOpen}
        onClose={() => setIsFollowListOpen(false)}
        type={followListType}
        username={profileData?.username}
      />
    </MainLayout>
  );
}

function ReelThumbnail({
  reel,
  isOwn,
  onDelete,
  onEdit,
  onDrill,
}: {
  reel: any;
  isOwn: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onDrill?: (cat: string, sub: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [watchLater, setWatchLater] = useState(false);
  const { accessToken } = useAuthStore();
  const API = process.env.NEXT_PUBLIC_API_URL;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setMenuOpen(false);
      }}
      style={s.reelCard}
    >
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "rgba(0,0,0,0.7)",
          borderRadius: 8,
          padding: "3px 8px",
          fontSize: 11,
          fontWeight: 700,
          color: "#fff",
          zIndex: 5,
        }}
      >
        {Math.floor(reel.durationSeconds / 60)}:
        {(reel.durationSeconds % 60).toString().padStart(2, "0")}
      </div>

      {reel.thumbnailUrl && (
        <img
          src={reel.thumbnailUrl}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 14,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.3,
            marginBottom: 8,
          }}
        >
          {reel.title}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
            <Eye size={10} style={{ display: "inline", marginRight: 3 }} />
            {formatCount(reel.viewsCount)}
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
            <Heart size={10} style={{ display: "inline", marginRight: 3 }} />
            {formatCount(reel.likesCount)}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              zIndex: 10,
            }}
          >
            {!menuOpen && (
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: "#fff",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Play size={18} color="#000" fill="#000" />
              </div>
            )}

            {isOwn ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 10,
                    padding: "6px 12px",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  style={{
                    background: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: 10,
                    padding: "6px 12px",
                    color: "#f87171",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                  }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: menuOpen ? "#fff" : "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <MoreHorizontal
                    size={18}
                    color={menuOpen ? "#000" : "#fff"}
                  />
                </button>

                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    style={{
                      position: "absolute",
                      bottom: 50,
                      right: -20,
                      width: 180,
                      background: "#0d0d0d",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 16,
                      padding: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      zIndex: 100,
                    }}
                  >
                    {reel.pdfUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `${API}/videos/${reel.id}/pdf-proxy`,
                            "_blank",
                          );
                        }}
                        style={s.menuBtn}
                      >
                        <BookOpen size={14} color="#4ade80" /> View PDF
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDrill?.(
                          reel.skill?.name || "Uncategorized",
                          reel.subskill?.name || "General",
                        );
                      }}
                      style={s.menuBtn}
                    >
                      <Play size={14} /> View Series
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!accessToken) return;
                        setWatchLater(!watchLater);
                        try {
                          await fetch(`${API}/videos/${reel.id}/watch-later`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${accessToken}` },
                          });
                        } catch (err) {
                          setWatchLater(!watchLater);
                        }
                      }}
                      style={{
                        ...s.menuBtn,
                        color: watchLater ? "#4ade80" : "#fff",
                      }}
                    >
                      <ListVideo size={14} />{" "}
                      {watchLater ? "In Watch Later" : "Watch Later"}
                    </button>
                    {reel.certificationUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(reel.certificationUrl, "_blank");
                        }}
                        style={s.menuBtn}
                      >
                        <Award size={14} color="#fbbf24" /> Certification
                      </button>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EditReelModal({
  reel,
  onClose,
  onSave,
}: {
  reel: any;
  onClose: () => void;
  onSave: (id: string, data: any) => void;
}) {
  const [title, setTitle] = useState(reel.title);
  const [description, setDescription] = useState(reel.description);
  const [certificationUrl, setCertificationUrl] = useState(
    reel.certificationUrl || "",
  );
  const [isSaving, setIsSaving] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(12px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        style={{
          width: "min(440px, 100%)",
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 28,
          padding: 32,
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "#fff",
            marginBottom: 8,
          }}
        >
          Edit Reel Details
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
            marginBottom: 24,
          }}
        >
          Update your reel's caption and info.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: 8,
              }}
            >
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={s.detailInput}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: 8,
              }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ ...s.detailInput, resize: "none" }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: 8,
              }}
            >
              Certification Link (Optional)
            </label>
            <input
              value={certificationUrl}
              onChange={(e) => setCertificationUrl(e.target.value)}
              placeholder="https://..."
              style={s.detailInput}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.05)",
              border: "none",
              borderRadius: 14,
              padding: 14,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setIsSaving(true);
              onSave(reel.id, { title, description, certificationUrl });
            }}
            style={{
              flex: 1,
              background: "#fff",
              border: "none",
              borderRadius: 14,
              padding: 14,
              color: "#000",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const s: Record<string, React.CSSProperties> = {
  uploadBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fff",
    color: "#000",
    border: "none",
    borderRadius: 14,
    padding: "12px 20px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  followBtn: {
    background: "#fff",
    color: "#000",
    border: "none",
    borderRadius: 14,
    padding: "12px 28px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  iconBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 20,
    textAlign: "center" as const,
  },
  tabRow: {
    display: "flex",
    gap: 0,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    marginBottom: 24,
    overflowX: "auto" as const,
  },
  tab: {
    padding: "12px 20px",
    fontSize: 13,
    fontWeight: 600,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "color 0.2s, border-color 0.2s",
    whiteSpace: "nowrap" as const,
  },
  reelGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 12,
  },
  reelCard: {
    aspectRatio: "9/16",
    background: "#111",
    borderRadius: 20,
    position: "relative",
    overflow: "hidden",
    cursor: "pointer",
  },
  modal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "min(480px, 95vw)",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#0d0d0d",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 32,
    padding: 40,
    zIndex: 101,
  },
  stepIndicator: { display: "flex", gap: 6 },
  optionBtn: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left" as const,
    transition: "all 0.2s",
  },
  uploadDropzone: {
    border: "1px dashed rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center" as const,
  },
  tagPill: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 99,
    padding: "4px 12px",
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(255,255,255,0.5)",
  },
  detailInput: {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: "14px 16px",
    fontSize: 14,
    color: "#fff",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.35)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  nextModalBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#fff",
    color: "#000",
    border: "none",
    borderRadius: 14,
    padding: "13px 24px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "opacity 0.2s",
  },
  menuBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 10,
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    fontFamily: "inherit",
    transition: "background 0.2s",
  },
};
