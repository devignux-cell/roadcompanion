import { NextResponse } from "next/server";
import { MOCK_EVENTS } from "@/lib/data/events.mock";
import type { Event } from "@/types/events";
import { COLORS } from "@/lib/constants/colors";

export const revalidate = 3600;

interface TMImage {
  url: string;
  ratio: string;
  width: number;
  height: number;
  fallback: boolean;
}

interface TMClassification {
  segment?: { name: string };
  genre?: { name: string };
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
  _embedded?: {
    events?: TMEvent[];
  };
}

function classificationToMeta(classifications: TMClassification[] | undefined): {
  type: string;
  emoji: string;
  color: string;
} {
  const segment = classifications?.[0]?.segment?.name ?? "";
  if (segment === "Music") return { type: "Music", emoji: "🎵", color: COLORS.purple };
  if (segment === "Sports") return { type: "Sports", emoji: "🏆", color: COLORS.accent };
  if (segment === "Arts & Theatre") return { type: "Arts", emoji: "🎭", color: COLORS.teal };
  if (segment === "Film") return { type: "Film", emoji: "🎬", color: COLORS.gold };
  return { type: "Event", emoji: "🎟️", color: COLORS.muted };
}

function pickBestImage(images: TMImage[] | undefined): string | null {
  if (!images || images.length === 0) return null;
  const wideImages = images.filter((img) => img.ratio === "16_9" && img.width >= 640);
  if (wideImages.length > 0) {
    return wideImages.reduce((best, img) => (img.width > best.width ? img : best)).url;
  }
  const anyWide = images.filter((img) => img.ratio === "16_9");
  if (anyWide.length > 0) return anyWide[0].url;
  return images[0]?.url ?? null;
}

function formatDate(dateTime: string | undefined, localDate: string | undefined): string {
  if (localDate) {
    const [, month, day] = localDate.split("-");
    const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[parseInt(month)]} ${parseInt(day)}`;
  }
  return dateTime ? new Date(dateTime).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBD";
}

export async function GET(): Promise<NextResponse<Event[]>> {
  const apiKey = process.env.TICKETMASTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(MOCK_EVENTS);
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

    if (!res.ok) {
      throw new Error(`Ticketmaster error: ${res.status}`);
    }

    const data: TMResponse = await res.json();
    const tmEvents = data._embedded?.events ?? [];

    const events: Event[] = tmEvents.map((ev) => {
      const { type, emoji, color } = classificationToMeta(ev.classifications);
      const imageUrl = pickBestImage(ev.images);
      const dateStr = formatDate(
        ev.dates?.start?.dateTime,
        ev.dates?.start?.localDate
      );

      return {
        id: ev.id,
        title: ev.name,
        date: dateStr,
        dateIso: ev.dates?.start?.localDate ?? ev.dates?.start?.dateTime ?? "",
        venue: ev._embedded?.venues?.[0]?.name ?? "Tampa",
        type,
        emoji,
        color,
        imageUrl,
        ticketUrl: ev.url ?? null,
        isLive: true,
      };
    });

    return NextResponse.json(events.length > 0 ? events : MOCK_EVENTS);
  } catch {
    return NextResponse.json(MOCK_EVENTS);
  }
}
