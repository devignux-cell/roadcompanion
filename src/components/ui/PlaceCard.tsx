"use client";

import { useState } from "react";
import Image from "next/image";
import { COLORS } from "@/lib/constants/colors";
import type { Place } from "@/types/places";

interface PlaceCardProps {
  place: Place;
  index: number;
}

export default function PlaceCard({ place, index }: PlaceCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="card-hover"
      onClick={() => setExpanded(!expanded)}
      style={{
        background: COLORS.card,
        border: `1px solid ${expanded ? place.color + "40" : COLORS.border}`,
        borderRadius: 20,
        overflow: "hidden",
        animation: `fadeUp 0.4s ease ${index * 60}ms both`,
        transition: "border 0.2s, box-shadow 0.2s",
        boxShadow: expanded ? `0 0 24px ${place.color}18` : "none",
      }}
    >
      {/* Cover image area */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 110,
          background: place.imageUrl
            ? COLORS.card
            : `linear-gradient(135deg, ${place.color}30, ${place.color}10)`,
          overflow: "hidden",
        }}
      >
        {place.imageUrl ? (
          <>
            <Image
              src={place.imageUrl}
              alt={place.name}
              fill
              style={{ objectFit: "cover" }}
              sizes="430px"
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(to bottom, transparent 40%, ${COLORS.card}cc)`,
              }}
            />
          </>
        ) : (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg, ${place.color}80, transparent)`,
            }}
          />
        )}
      </div>

      {/* Content area */}
      <div style={{ padding: "14px 16px 16px" }}>
        {/* Name + neighborhood */}
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
            {place.name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: COLORS.muted,
              fontWeight: 500,
              flexShrink: 0,
              paddingTop: 2,
            }}
          >
            {place.hood}
          </div>
        </div>

        {/* Category */}
        <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
          {place.cat}
        </div>

        {/* Tag badge */}
        <div style={{ marginTop: 12 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: place.color + "18",
              color: place.color,
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 100,
              padding: "4px 10px",
            }}
          >
            {place.emoji} {place.tag}
          </span>
        </div>
      </div>

      {/* Expanded: description + actions */}
      {expanded && (
        <div style={{ padding: "0 16px 16px", animation: "fadeUp 0.25s ease" }}>
          <div style={{ fontSize: 13, color: COLORS.muted, lineHeight: 1.6 }}>{place.desc}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(place.mapsQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                background: COLORS.teal + "15",
                color: COLORS.teal,
                border: `1px solid ${COLORS.teal}30`,
                borderRadius: 10,
                padding: "10px",
                fontSize: 12,
                fontWeight: 600,
                textAlign: "center",
                textDecoration: "none",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              📍 Directions
            </a>
            <div
              style={{
                flex: 1,
                background: COLORS.accent + "15",
                color: COLORS.accent,
                border: `1px solid ${COLORS.accent}30`,
                borderRadius: 10,
                padding: "10px",
                fontSize: 12,
                fontWeight: 600,
                textAlign: "center",
                cursor: "pointer",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              🔗 Details
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
