import Link from "next/link";
import { notFound } from "next/navigation";
import PageWrapper from "@/components/layout/PageWrapper";
import TravelCard from "@/components/ui/TravelCard";
import { TRAVEL_LINKS } from "@/lib/data/travel";
import { COLORS } from "@/lib/constants/colors";
import { getAccountByUsername } from "@/lib/data/account";
import type { TravelLink } from "@/types/events";

async function fetchUnsplashImage(query: string): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;
  try {
    const url = new URL("https://api.unsplash.com/search/photos");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", "1");
    url.searchParams.set("orientation", "landscape");
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${accessKey}` },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.urls?.regular ?? null;
  } catch {
    return null;
  }
}

export default async function TravelPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  if (!getAccountByUsername(username)) notFound();

  const linksWithImages: TravelLink[] = await Promise.all(
    TRAVEL_LINKS.map(async (link) => ({
      ...link,
      imageUrl: (await fetchUnsplashImage(link.unsplashQuery)) ?? link.imageUrl,
    }))
  );

  return (
    <PageWrapper>
      <div style={{ padding: "24px 16px 40px" }}>
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
          <div style={{ fontSize: 13, color: COLORS.muted, fontWeight: 500 }}>Travel Help</div>
        </div>

        <div style={{ marginTop: 8, marginBottom: 24 }}>
          <div style={{ fontSize: 28, fontFamily: "'Syne', var(--font-syne), sans-serif", fontWeight: 800 }}>
            Plan Your Stay
          </div>
          <div style={{ fontSize: 14, color: COLORS.muted, marginTop: 4 }}>
            Handpicked travel resources
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {linksWithImages.map((link, i) => (
            <TravelCard key={link.id} link={link} index={i} />
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: COLORS.muted }}>
          Some links may earn a commission · FTC-compliant disclosure
        </div>
      </div>
    </PageWrapper>
  );
}
