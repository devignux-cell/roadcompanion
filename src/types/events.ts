export interface Event {
  id: string;
  title: string;
  date: string;
  dateIso: string;
  venue: string;
  type: string;
  emoji: string;
  color: string;
  imageUrl: string | null;
  ticketUrl: string | null;
  isLive: boolean;
}

export interface TravelLink {
  id: string;
  label: string;
  desc: string;
  icon: string;
  color: string;
  url: string;
  unsplashQuery: string;
  imageUrl: string | null;
}
