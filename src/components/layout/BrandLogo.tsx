"use client";

import Image from "next/image";
import { useState } from "react";
import { BsPrinter } from "react-icons/bs";
import { cn } from "@/lib/utils";

type BrandLogoSize = "sm" | "md" | "lg";

const sizeStyles = {
  sm: {
    width: 96,
    height: 34,
    icon: "h-5 w-5",
  },
  md: {
    width: 128,
    height: 45,
    icon: "h-6 w-6",
  },
  lg: {
    width: 176,
    height: 61,
    icon: "h-8 w-8",
  },
} as const;

interface BrandLogoProps {
  size?: BrandLogoSize;
  className?: string;
  logoSrc?: string;
  logoAlt?: string;
}

export default function BrandLogo({
  size = "md",
  className,
  logoSrc,
  logoAlt = "3DifyBd",
}: BrandLogoProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const envLogoSrc = process.env.NEXT_PUBLIC_LOGO_PATH?.trim();
  const resolvedLogoSrc = logoSrc ?? (envLogoSrc ? envLogoSrc : "/3Dify-logo-vector.png");
  const sizing = sizeStyles[size];

  if (logoFailed) {
    return <BsPrinter className={cn(sizing.icon, "text-primary-500", className)} />;
  }

  return (
    <Image
      src={resolvedLogoSrc}
      alt={logoAlt}
      width={sizing.width}
      height={sizing.height}
      className={className}
      onError={() => setLogoFailed(true)}
      priority
    />
  );
}