import Link from "next/link";
import PageWrapper from "@/components/layout/PageWrapper";
import EventCard from "@/components/ui/EventCard";
import { MOCK_EVENTS } from "@/lib/data/events.mock";
import { COLORS } from "@/lib/constants/colors";
import type { Event } from "@/types/events";

interface TMImage {
  url: string;
  ratio: string;
  width: number;
}

interface TMClassification {
  segment?: { name: string };
}

interface TMEvent {
  id: string;
  name: string;
  dates?: { start?: { dateTime?: string; localDate?: string } };
  _embedded?: { venues?: Array<{ name: string }> };
  images?: TMImage[];
  url?: string;
  classifications?: TMClassification[];
}

interface TMResponse {
  _embedded?: { events?: TMEvent[] };
}

function classificationToMeta(classifications: TMClassification[] | undefined) {
  const segment = classifications?.[0]?.segment?.name ?? "";
  if (segment === "Music") return { type: "Music", emoji: "🎵", color: COLORS.purple };
  if (segment === "Sports") return { type: "Sports", emoji: "🏆", color: COLORS.accent };
  if (segment === "Arts & Theatre") return { type: "Arts", emoji: "🎭", color: COLORS.teal };
  if (segment === "Film") return { type: "Film", emoji: "🎬", color: COLORS.gold };
  return { type: "Event", emoji: "🎟️", color: COLORS.muted };
}

function pickBestImage(images: TMImage[] | undefined): string | null {
  if (!images || images.length === 0) return null;
  const wide = images.filter((img) => img.ratio === "16_9" && img.width >= 640);
  if (wide.length > 0) return wide.reduce((best, img) => (img.width > best.width ? img : best)).url;
  const anyWide = images.filter((img) => img.ratio === "16_9");
  if (anyWide.length > 0) return anyWide[0].url;
  return images[0]?.url ?? null;
}

function formatDate(dateTime: string | undefined, localDate: string | undefined): string {
  if (localDate) {
    const [, month, day] = localDate.split("-");
    const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(month)]} ${parseInt(day)}`;
  }
  return dateTime
    ? new Date(dateTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "TBD";
}

async function getEvents(): Promise<{ events: Event[]; isLive: boolean }> {
  const apiKey = process.env.TICKETMASTER_API_KEY;

  if (!apiKey) {
    return { events: MOCK_EVENTS, isLive: false };
  }

  try {
    const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("city", "Tampa");
    url.searchParams.set("stateCode", "FL");
    url.searchParams.set("countryCode", "US");
    url.searchParams.set("size", "12");
    url.searchParams.set("sort", "date,asc");

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Ticketmaster error: ${res.status}`);

    const data: TMResponse = await res.json();
    const tmEvents = data._embedded?.events ?? [];

    const events: Event[] = tmEvents.map((ev) => {
      const { type, emoji, color } = classificationToMeta(ev.classifications);
      return {
        id: ev.id,
        title: ev.name,
        date: formatDate(ev.dates?.start?.dateTime, ev.dates?.start?.localDate),
        dateIso: ev.dates?.start?.localDate ?? ev.dates?.start?.dateTime ?? "",
        venue: ev._embedded?.venues?.[0]?.name ?? "Tampa",
        type,
        emoji,
        color,
        imageUrl: pickBestImage(ev.images),
        ticketUrl: ev.url ?? null,
        isLive: true,
      };
    });

    return { events: events.length > 0 ? events : MOCK_EVENTS, isLive: events.length > 0 };
  } catch {
    return { events: MOCK_EVENTS, isLive: false };
  }
}

export default async function EventsPage() {
  const { events, isLive } = await getEvents();

  return (
    <PageWrapper>
      <div style={{ padding: "24px 16px 40px" }}>
        {/* Back header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <Link
            href="/"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              textDecoration: "none",
              color: COLORS.text,
              flexShrink: 0,
            }}
          >
            ←
          </Link>
          <div style={{ fontSize: 13, color: COLORS.muted, fontWeight: 500 }}>Things To Do</div>
        </div>

        <div style={{ marginTop: 8, marginBottom: 24 }}>
          <div
            style={{
              fontSize: 28,
              fontFamily: "'Syne', var(--font-syne), sans-serif",
              fontWeight: 800,
            }}
          >
            What&apos;s Happening
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <div style={{ fontSize: 14, color: COLORS.muted }}>
              Tampa events this week &amp; beyond
            </div>
            {isLive && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: "rgba(45,255,199,0.1)",
                  border: "1px solid rgba(45,255,199,0.2)",
                  borderRadius: 100,
                  padding: "2px 8px",
                  fontSize: 10,
                  color: COLORS.teal,
                  fontWeight: 700,
                }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: COLORS.teal,
                    animation: "pulse 2s infinite",
                  }}
                />
                LIVE
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {events.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} />
          ))}
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 24,
            fontSize: 12,
            color: COLORS.muted,
          }}
        >
          {isLive ? "Live events via Ticketmaster" : "Powered by local listings"} · Some links may earn a commission
        </div>
      </div>
    </PageWrapper>
  );
}
