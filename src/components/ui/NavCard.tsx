"use client";

import { useState } from "react";
import Link from "next/link";
import { COLORS } from "@/lib/constants/colors";

interface NavCardItem {
  label: string;
  icon: string;
  href: string;
  color: string;
  subtitle: string;
  delay: number;
}

interface NavCardProps {
  item: NavCardItem;
  mounted: boolean;
}

export default function NavCard({ item, mounted }: NavCardProps) {
  const [hover, setHover] = useState(false);

  return (
    <Link href={item.href} style={{ textDecoration: "none" }}>
      <div
        className="card-hover"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: hover ? COLORS.cardHover : COLORS.card,
          border: `1px solid ${hover ? item.color + "40" : COLORS.border}`,
          borderRadius: 20,
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(16px)",
          transition: `opacity 0.5s ease ${item.delay}ms, transform 0.5s ease ${item.delay}ms, background 0.2s, border 0.2s`,
          boxShadow: hover ? `0 0 30px ${item.color}18` : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: item.color + "18",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              border: `1px solid ${item.color}30`,
            }}
          >
            {item.icon}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>{item.label}</div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{item.subtitle}</div>
          </div>
        </div>
        <div
          style={{
            fontSize: 18,
            color: COLORS.muted,
            opacity: hover ? 1 : 0.4,
            transition: "opacity 0.2s",
          }}
        >
          →
        </div>
      </div>
    </Link>
  );
}
