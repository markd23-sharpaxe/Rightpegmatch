import React from "react";
import logoImage from "@/assets/logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32"
  };

  // Using imported image
  const logoSrc = logoImage;

  return (
    <div className={`relative ${className}`}>
      <img 
        src={logoSrc} 
        alt="RightPegMatch Logo" 
        className="h-auto"
        style={{ 
          maxHeight: size === "sm" ? "64px" : size === "md" ? "96px" : "128px",
          width: "auto"
        }}
      />
    </div>
  );
}