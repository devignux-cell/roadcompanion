"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageWrapper from "@/components/layout/PageWrapper";
import BackHeader from "@/components/ui/BackHeader";
import PlaceCard from "@/components/ui/PlaceCard";
import { PLACES, EXPLORE_CATEGORIES } from "@/lib/data/places";
import { COLORS } from "@/lib/constants/colors";
import type { ExploreCategory } from "@/lib/data/places";

export default function ExplorePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const [filter, setFilter] = useState<ExploreCategory>("All");

  const filteredPlaces =
    filter === "All" ? PLACES : PLACES.filter((p) => p.cat === filter);

  return (
    <PageWrapper>
      <div style={{ padding: "24px 0 40px" }}>
        <div style={{ padding: "0 16px" }}>
          <BackHeader
            title="Explore Tampa"
            onBack={() => router.push(`/${username}`)}
          />
          <div style={{ marginTop: 8, marginBottom: 20 }}>
            <div
              style={{
                fontSize: 28,
                fontFamily: "'Syne', var(--font-syne), sans-serif",
                fontWeight: 800,
              }}
            >
              Local Picks
            </div>
            <div style={{ fontSize: 14, color: COLORS.muted, marginTop: 4 }}>
              Curated by locals, trusted by riders
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            paddingLeft: 16,
            overflowX: "auto",
            paddingBottom: 4,
            paddingRight: 16,
            marginBottom: 20,
          }}
        >
          {EXPLORE_CATEGORIES.map((cat) => (
            <div
              key={cat}
              onClick={() => setFilter(cat)}
              className="card-hover"
              style={{
                flexShrink: 0,
                padding: "8px 16px",
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 500,
                background: filter === cat ? COLORS.accent : COLORS.card,
                color: filter === cat ? "#fff" : COLORS.muted,
                border: `1px solid ${filter === cat ? COLORS.accent : COLORS.border}`,
                transition: "all 0.2s",
              }}
            >
              {cat}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "0 16px",
          }}
        >
          {filteredPlaces.map((place, i) => (
            <PlaceCard key={place.id} place={place} index={i} />
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
