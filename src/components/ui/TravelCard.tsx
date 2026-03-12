"use client";

import { useState } from "react";
import { COLORS } from "@/lib/constants/colors";
import type { TravelLink } from "@/types/events";

interface TravelCardProps {
  link: TravelLink;
  index: number;
}

export default function TravelCard({ link, index }: TravelCardProps) {
  const [hover, setHover] = useState(false);
  const category = link.id.charAt(0).toUpperCase() + link.id.slice(1);

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        className="card-hover"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: hover ? COLORS.cardHover : COLORS.card,
          border: `1px solid ${hover ? link.color + "40" : COLORS.border}`,
          borderRadius: 20,
          overflow: "hidden",
          animation: `fadeUp 0.4s ease ${index * 70}ms both`,
          boxShadow: hover ? `0 0 24px ${link.color}18` : "none",
        }}
      >
        {/* Cover image area */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 110,
            background: link.imageUrl
              ? `url(${link.imageUrl}) center/cover no-repeat`
              : `linear-gradient(135deg, ${link.color}30, ${link.color}10)`,
            overflow: "hidden",
          }}
        >
          {link.imageUrl ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(to bottom, transparent 40%, ${COLORS.card}cc)`,
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 2,
                background: `linear-gradient(90deg, ${link.color}80, transparent)`,
              }}
            />
          )}
        </div>

        {/* Content area */}
        <div style={{ padding: "14px 16px 16px" }}>
          {/* Label + arrow */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: COLORS.text,
                lineHeight: 1.3,
                flex: 1,
              }}
            >
              {link.label}
            </div>
            <div
              style={{
                fontSize: 14,
                color: link.color,
                flexShrink: 0,
                paddingTop: 2,
              }}
            >
              →
            </div>
          </div>

          {/* Description */}
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
            {link.desc}
          </div>

          {/* Category badge */}
          <div style={{ marginTop: 12 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: link.color + "18",
                color: link.color,
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 100,
                padding: "4px 10px",
              }}
            >
              {link.icon} {category}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
