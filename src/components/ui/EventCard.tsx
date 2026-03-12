"use client";

import { useState } from "react";
import { COLORS } from "@/lib/constants/colors";
import type { Event } from "@/types/events";

interface EventCardProps {
  event: Event;
  index: number;
}

export default function EventCard({ event, index }: EventCardProps) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="card-hover"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? COLORS.cardHover : COLORS.card,
        border: `1px solid ${hover ? event.color + "40" : COLORS.border}`,
        borderRadius: 20,
        overflow: "hidden",
        animation: `fadeUp 0.4s ease ${index * 70}ms both`,
        boxShadow: hover ? `0 0 24px ${event.color}18` : "none",
        textDecoration: "none",
        cursor: event.ticketUrl ? "pointer" : "default",
      }}
    >
      {/* Cover image area */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 110,
          background: event.imageUrl
            ? `url(${event.imageUrl}) center/cover no-repeat`
            : `linear-gradient(135deg, ${event.color}30, ${event.color}10)`,
          overflow: "hidden",
        }}
      >
        {event.imageUrl ? (
          /* Gradient to ground the content below */
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to bottom, transparent 40%, ${COLORS.card}cc)`,
            }}
          />
        ) : (
          /* Decorative color accent line for fallback */
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg, ${event.color}80, transparent)`,
            }}
          />
        )}
      </div>

      {/* Content area */}
      <div style={{ padding: "14px 16px 16px" }}>
        {/* Title + Date row */}
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
            {event.title}
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
            {event.date}
          </div>
        </div>

        {/* Venue */}
        <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
          {event.venue}
        </div>

        {/* Category badge + ticket button row */}
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minWidth: 0 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: event.color + "18",
              color: event.color,
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 100,
              padding: "4px 10px",
              minWidth: 0,
              flexShrink: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {event.emoji} {event.type}
          </span>

          {event.ticketUrl && (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: event.color + "18",
                color: event.color,
                border: `1px solid ${event.color}40`,
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 100,
                padding: "4px 12px",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              🎟 Tickets
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

