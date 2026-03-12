import { notFound } from "next/navigation";
import { PLACES } from "@/lib/data/places";
import { MOCK_EVENTS } from "@/lib/data/events.mock";
import { COLORS } from "@/lib/constants/colors";
import { getAccountByUsername } from "@/lib/data/account";
import type { Event } from "@/types/events";
import type { Place } from "@/types/places";
import type { RecommendationItem, RecFilter } from "@/types/recommendations";
import RecommendationsClient from "./RecommendationsClient";

interface TMImage { url: string; ratio: string; width: number; }
interface TMClassification { segment?: { name: string }; }
interface TMEvent {
  id: string; name: string;
  dates?: { start?: { dateTime?: string; localDate?: string } };
  _embedded?: { venues?: Array<{ name: string }> };
  images?: TMImage[]; url?: string; classifications?: TMClassification[];
}
interface TMResponse { _embedded?: { events?: TMEvent[] }; }

function classificationToMeta(c: TMClassification[] | undefined) {
  const seg = c?.[0]?.segment?.name ?? "";
  if (seg === "Music") return { type: "Music", emoji: "🎵", color: COLORS.purple };
  if (seg === "Sports") return { type: "Sports", emoji: "🏆", color: COLORS.accent };
  if (seg === "Arts & Theatre") return { type: "Arts", emoji: "🎭", color: COLORS.teal };
  if (seg === "Film") return { type: "Film", emoji: "🎬", color: COLORS.gold };
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
  if (!apiKey) return { events: MOCK_EVENTS, isLive: false };
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
        id: ev.id, title: ev.name,
        date: formatDate(ev.dates?.start?.dateTime, ev.dates?.start?.localDate),
        dateIso: ev.dates?.start?.localDate ?? ev.dates?.start?.dateTime ?? "",
        venue: ev._embedded?.venues?.[0]?.name ?? "Tampa",
        type, emoji, color, imageUrl: pickBestImage(ev.images),
        ticketUrl: ev.url ?? null, isLive: true,
      };
    });
    return { events: events.length > 0 ? events : MOCK_EVENTS, isLive: events.length > 0 };
  } catch {
    return { events: MOCK_EVENTS, isLive: false };
  }
}

function placeToItem(place: Place): RecommendationItem {
  const tags: RecFilter[] = ["All"];
  if (place.cat === "Food") tags.push("Food");
  if (place.cat === "Bars") tags.push("Bars");
  if (place.cat === "Beaches") tags.push("Beaches");
  if (place.cat === "Attractions") tags.push("Gems");
  return {
    id: place.id, kind: "place", title: place.name, detail: place.hood,
    meta: place.cat, badge: place.tag, emoji: place.emoji, color: place.color,
    imageUrl: place.imageUrl, tags, href: null, mapsQuery: place.mapsQuery, desc: place.desc,
  };
}

function eventToItem(event: Event): RecommendationItem {
  const tags: RecFilter[] = ["All", "Events"];
  if (event.type === "Music") { tags.push("Music", "Festivals"); }
  if (event.type === "Sports") tags.push("Sports");
  if (event.type === "Arts") tags.push("Festivals");
  if (event.type === "Food") tags.push("Food");
  if (event.type === "Market") tags.push("Festivals");
  return {
    id: event.id, kind: "event", title: event.title, detail: event.date,
    meta: event.venue, badge: event.type, emoji: event.emoji, color: event.color,
    imageUrl: event.imageUrl, tags, href: event.ticketUrl,
  };
}

export default async function RecommendationsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  if (!getAccountByUsername(username)) notFound();

  const { events, isLive } = await getEvents();
  const items: RecommendationItem[] = [
    ...events.map(eventToItem),
    ...PLACES.map(placeToItem),
  ];
  return <RecommendationsClient items={items} isLive={isLive} username={username} />;
}
