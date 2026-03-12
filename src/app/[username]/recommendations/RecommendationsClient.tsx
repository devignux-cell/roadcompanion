"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import PageWrapper from "@/components/layout/PageWrapper";
import { COLORS } from "@/lib/constants/colors";
import { REC_FILTERS } from "@/types/recommendations";
import type { RecommendationItem, RecFilter } from "@/types/recommendations";

interface Props {
  items: RecommendationItem[];
  isLive: boolean;
  username: string;
}

function RecommendationCard({ item, index }: { item: RecommendationItem; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [hover, setHover] = useState(false);
  const isHighlighted = hover || (item.kind === "place" && expanded);

  const card = (
    <div
      className="card-hover"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={item.kind === "place" ? () => setExpanded(!expanded) : undefined}
      style={{
        background: isHighlighted ? COLORS.cardHover : COLORS.card,
        border: `1px solid ${isHighlighted ? item.color + "40" : COLORS.border}`,
        borderRadius: 20,
        overflow: "hidden",
        animation: `fadeUp 0.4s ease ${index * 55}ms both`,
        transition: "border 0.2s, box-shadow 0.2s",
        boxShadow: isHighlighted ? `0 0 24px ${item.color}18` : "none",
        cursor: item.kind === "place" ? "pointer" : "auto",
      }}
    >
      <div
        style={{
          position: "relative", width: "100%", height: 110,
          background: item.imageUrl
            ? COLORS.card
            : `linear-gradient(135deg, ${item.color}30, ${item.color}10)`,
          overflow: "hidden",
        }}
      >
        {item.imageUrl ? (
          <>
            <Image src={item.imageUrl} alt={item.title} fill style={{ objectFit: "cover" }} sizes="430px" />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 40%, ${COLORS.card}cc)` }} />
          </>
        ) : (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${item.color}80, transparent)` }} />
        )}
        {item.kind === "event" && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: "rgba(10,10,15,0.65)", borderRadius: 100,
            padding: "3px 9px", fontSize: 10, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.06em",
          }}>
            EVENT
          </div>
        )}
      </div>

      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, lineHeight: 1.3, flex: 1 }}>{item.title}</div>
          <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500, flexShrink: 0, paddingTop: 2 }}>{item.detail}</div>
        </div>
        <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>{item.meta}</div>
        <div style={{ marginTop: 12 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: item.color + "18", color: item.color,
            fontSize: 11, fontWeight: 700, borderRadius: 100, padding: "4px 10px",
          }}>
            {item.emoji} {item.badge}
          </span>
        </div>
      </div>

      {item.kind === "place" && expanded && (
        <div style={{ padding: "0 16px 16px", animation: "fadeUp 0.25s ease" }}>
          <div style={{ fontSize: 13, color: COLORS.muted, lineHeight: 1.6 }}>{item.desc}</div>
          <div style={{ marginTop: 12 }}>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(item.mapsQuery ?? item.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "block", background: COLORS.teal + "15", color: COLORS.teal,
                border: `1px solid ${COLORS.teal}30`, borderRadius: 10,
                padding: "10px", fontSize: 12, fontWeight: 600, textAlign: "center", textDecoration: "none",
              }}
            >
              📍 Directions
            </a>
          </div>
        </div>
      )}
    </div>
  );

  if (item.kind === "event" && item.href) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
        {card}
      </a>
    );
  }
  return card;
}

export default function RecommendationsClient({ items, isLive, username }: Props) {
  const [filter, setFilter] = useState<RecFilter>("All");
  const filtered = filter === "All" ? items : items.filter((item) => item.tags.includes(filter));

  return (
    <PageWrapper>
      <div style={{ padding: "24px 0 40px" }}>
        <div style={{ padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <Link
              href={`/${username}`}
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: COLORS.card, border: `1px solid ${COLORS.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, textDecoration: "none", color: COLORS.text, flexShrink: 0,
              }}
            >
              ←
            </Link>
            <div style={{ fontSize: 13, color: COLORS.muted, fontWeight: 500 }}>Tampa</div>
          </div>

          <div style={{ marginTop: 8, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 28, fontFamily: "'Syne', var(--font-syne), sans-serif", fontWeight: 800 }}>
                Recommendations
              </div>
              {isLive && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  background: "rgba(45,255,199,0.1)", border: "1px solid rgba(45,255,199,0.2)",
                  borderRadius: 100, padding: "3px 9px", fontSize: 10, color: COLORS.teal, fontWeight: 700,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: COLORS.teal, animation: "pulse 2s infinite" }} />
                  LIVE
                </div>
              )}
            </div>
            <div style={{ fontSize: 14, color: COLORS.muted, marginTop: 4 }}>
              Local spots, events &amp; things to do
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, paddingLeft: 16, paddingRight: 16, overflowX: "auto", paddingBottom: 4, marginBottom: 20 }}>
          {REC_FILTERS.map((f) => (
            <div
              key={f}
              onClick={() => setFilter(f)}
              className="card-hover"
              style={{
                flexShrink: 0, padding: "8px 16px", borderRadius: 100,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                background: filter === f ? COLORS.accent : COLORS.card,
                color: filter === f ? "#fff" : COLORS.muted,
                border: `1px solid ${filter === f ? COLORS.accent : COLORS.border}`,
                transition: "all 0.2s",
              }}
            >
              {f}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 16px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.muted, fontSize: 14 }}>
              No {filter.toLowerCase()} results yet
            </div>
          ) : (
            filtered.map((item, i) => (
              <RecommendationCard key={item.id} item={item} index={i} />
            ))
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: COLORS.muted, padding: "0 16px" }}>
          {isLive ? "Live events via Ticketmaster" : "Local listings"} · Some links may earn a commission
        </div>
      </div>
    </PageWrapper>
  );
}
