"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = ({
  children,
  variant = "primary",
  isLoading = false,
  icon,
  className = "",
  ...props
}: ButtonProps) => {
  const variants = {
    primary: "bg-white text-black hover:bg-white/90",
    secondary: "bg-white/5 text-white border border-white/10 hover:bg-white/10",
    glass:
      "bg-white/5 backdrop-blur-md text-white border border-white/10 hover:bg-white/20",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative inline-flex items-center justify-center gap-2 
        px-6 py-3 rounded-full font-medium transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${className}
      `}
      disabled={isLoading || props.disabled}
      {...(props as any)}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {icon && <span className="opacity-70">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
};
