"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Loader2, Camera } from "lucide-react";
import { useAuthStore } from "../../../store/authStore";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: any;
  onSuccess: () => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  profileData,
  onSuccess,
}: EditProfileModalProps) {
  const { accessToken } = useAuthStore();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [fullName, setFullName] = useState(profileData?.fullName || "");
  const [bio, setBio] = useState(profileData?.userProfile?.bio || "");

  const [avatarPreview, setAvatarPreview] = useState(
    profileData?.userProfile?.avatarUrl || "",
  );
  const [bannerPreview, setBannerPreview] = useState(
    profileData?.userProfile?.bannerUrl || "",
  );

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen && profileData) {
      setFullName(profileData.fullName || "");
      setBio(profileData.userProfile?.bio || "");
      setAvatarPreview(profileData.userProfile?.avatarUrl || "");
      setBannerPreview(profileData.userProfile?.bannerUrl || "");
    }
  }, [isOpen, profileData]);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "banner",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    if (type === "avatar") {
      setAvatarFile(file);
      setAvatarPreview(url);
    } else {
      setBannerFile(file);
      setBannerPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setIsLoading(true);

    try {
      // 1. Update text data
      const textRes = await fetch(`${API}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ fullName, bio }),
      });

      if (!textRes.ok) throw new Error("Failed to update profile text");

      // 2. Upload Avatar if changed
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        formData.append("type", "avatar");
        await fetch(`${API}/users/profile/image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        });
      }

      // 3. Upload Banner if changed
      if (bannerFile) {
        const formData = new FormData();
        formData.append("file", bannerFile);
        formData.append("type", "banner");
        await fetch(`${API}/users/profile/image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

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
      maxWidth: 500,
      maxHeight: "90vh",
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
    title: { fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 },
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
    form: {
      flex: 1,
      overflowY: "auto" as const,
      padding: 24,
      display: "flex",
      flexDirection: "column" as const,
      gap: 24,
    },
    label: {
      fontSize: 14,
      fontWeight: 600,
      color: "rgba(255,255,255,0.7)",
      marginBottom: 8,
      display: "block",
    },
    bannerBox: {
      width: "100%",
      height: 140,
      background: "#222",
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.1)",
      position: "relative" as const,
      overflow: "hidden",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarContainer: { display: "flex", alignItems: "center", gap: 16 },
    avatarBox: {
      width: 80,
      height: 80,
      borderRadius: "50%",
      background: "#222",
      border: "2px solid #111",
      outline: "2px solid rgba(255,255,255,0.1)",
      position: "relative" as const,
      overflow: "hidden",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    input: {
      width: "100%",
      background: "#222",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 12,
      padding: "14px 16px",
      color: "#fff",
      fontSize: 15,
      outline: "none",
      boxSizing: "border-box" as const,
      fontFamily: "inherit",
    },
    textarea: {
      width: "100%",
      background: "#222",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 12,
      padding: "14px 16px",
      color: "#fff",
      fontSize: 15,
      outline: "none",
      minHeight: 100,
      resize: "vertical" as const,
      boxSizing: "border-box" as const,
      fontFamily: "inherit",
    },
    submitBtn: {
      width: "100%",
      background: "#fff",
      color: "#000",
      border: "none",
      borderRadius: 12,
      padding: "16px",
      fontSize: 16,
      fontWeight: 800,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 8,
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
            <h2 style={s.title}>Edit Profile</h2>
            <button onClick={onClose} style={s.closeBtn}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={s.form}>
            {/* Banner Upload */}
            <div>
              <label style={s.label}>Profile Banner</label>
              <div
                onClick={() => bannerInputRef.current?.click()}
                style={s.bannerBox}
              >
                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Banner"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      opacity: 0.7,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      color: "rgba(255,255,255,0.3)",
                      gap: 8,
                    }}
                  >
                    <Camera size={24} />
                    <span style={{ fontSize: 12 }}>Add Banner</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={bannerInputRef}
                accept="image/*"
                onChange={(e) => handleFileChange(e, "banner")}
                style={{ display: "none" }}
              />
            </div>

            {/* Avatar Upload */}
            <div>
              <label style={s.label}>Profile Picture</label>
              <div style={s.avatarContainer}>
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  style={s.avatarBox}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 0.8,
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: 800,
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      {profileData?.username?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.4)",
                    lineHeight: 1.5,
                  }}
                >
                  Click the avatar to upload a new image.
                  <br />
                  Recommended size: 400x400px.
                </div>
                <input
                  type="file"
                  ref={avatarInputRef}
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "avatar")}
                  style={{ display: "none" }}
                />
              </div>
            </div>

            {/* Basic Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={s.label}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={s.input}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label style={s.label}>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  style={s.textarea}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div style={{ opacity: 0.6, cursor: "not-allowed" }}>
                <label
                  style={{
                    ...s.label,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  Email
                  <span
                    style={{
                      fontSize: 10,
                      background: "rgba(255,255,255,0.1)",
                      padding: "2px 6px",
                      borderRadius: 4,
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    Verified
                  </span>
                </label>
                <input
                  disabled
                  value={profileData?.email || "user@example.com"}
                  style={{
                    ...s.input,
                    background: "#1a1a1a",
                    border: "1px solid transparent",
                    color: "rgba(255,255,255,0.4)",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{ ...s.submitBtn, opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Save Changes"
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
