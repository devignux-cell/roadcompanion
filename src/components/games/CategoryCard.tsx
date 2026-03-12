"use client";

import { useState } from "react";
import Link from "next/link";
import { COLORS } from "@/lib/constants/colors";
import type { Category } from "@/types/game";
import { CATEGORY_META } from "@/lib/data/trivia";

interface CategoryCardProps {
  category: Category;
  index: number;
}

export default function CategoryCard({ category, index }: CategoryCardProps) {
  const [hover, setHover] = useState(false);
  const meta = CATEGORY_META[category];

  return (
    <Link href={`/games/${category.toLowerCase()}`} style={{ textDecoration: "none" }}>
      <div
        className="card-hover"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: hover ? meta.color + "22" : COLORS.card,
          border: `1px solid ${hover ? meta.color + "60" : COLORS.border}`,
          borderRadius: 20,
          padding: "24px 16px",
          textAlign: "center",
          animation: `fadeUp 0.4s ease ${index * 80}ms both`,
        }}
      >
        <div
          style={{
            fontSize: 36,
            marginBottom: 10,
            animation: "float 3s ease-in-out infinite",
            display: "block",
          }}
        >
          {meta.emoji}
        </div>
        <div
          style={{
            fontFamily: "'Syne', var(--font-syne), sans-serif",
            fontWeight: 700,
            fontSize: 16,
            color: hover ? meta.color : COLORS.text,
            transition: "color 0.2s",
          }}
        >
          {category}
        </div>
        <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>
          {meta.count} questions
        </div>
      </div>
    </Link>
  );
}
