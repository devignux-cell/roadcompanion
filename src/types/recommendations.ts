export type RecFilter =
  | "All"
  | "Food"
  | "Bars"
  | "Music"
  | "Sports"
  | "Events"
  | "Beaches"
  | "Gems"
  | "Festivals";

export const REC_FILTERS: RecFilter[] = [
  "All", "Food", "Bars", "Music", "Sports", "Events", "Beaches", "Gems", "Festivals",
];

export interface RecommendationItem {
  id: string;
  kind: "place" | "event";
  title: string;
  detail: string;    // date (events) | neighborhood (places)
  meta: string;      // venue (events) | category (places)
  badge: string;     // type (events) | tag (places)
  emoji: string;
  color: string;
  imageUrl: string | null;
  tags: RecFilter[];
  href: string | null;
  mapsQuery?: string;
  desc?: string;
}
