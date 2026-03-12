export type PlaceCategory = "Food" | "Bars" | "Beaches" | "Attractions";

export interface Place {
  id: string;
  name: string;
  cat: PlaceCategory;
  tag: string;
  desc: string;
  hood: string;
  emoji: string;
  color: string;
  unsplashQuery: string;
  imageUrl: string | null;
  mapsQuery: string;
}
