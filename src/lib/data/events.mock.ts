import type { Event } from "@/types/events";
import { COLORS } from "@/lib/constants/colors";

export const MOCK_EVENTS: Event[] = [
  {
    id: "mock-1",
    title: "Tampa Bay Beer Week",
    date: "Mar 20–27",
    dateIso: "2026-03-20",
    venue: "Various venues",
    type: "Food",
    emoji: "🍺",
    color: COLORS.gold,
    imageUrl: null,
    ticketUrl: 'https://tampabaybeerweek.com/',
    isLive: false,
  },
  {
    id: "mock-2",
    title: "Ybor City Night Market",
    date: "Every Sat",
    dateIso: "2026-03-14",
    venue: "7th Ave, Ybor City",
    type: "Market",
    emoji: "🌙",
    color: COLORS.teal,
    imageUrl: null,
    ticketUrl: 'https://yborcitynightmarket.com/',
    isLive: false,
  },
  {
    id: "mock-3",
    title: "Lightning vs Wild",
    date: "Mar 24",
    dateIso: "2026-03-24",
    venue: "Benchmark International Arena",
    type: "Sports",
    emoji: "🏒",
    color: "#00B4D8",
    imageUrl: null,
    ticketUrl: 'https://www.ticketmaster.com/tampa-bay-lightning-vs-minnesota-wild-tampa-florida-03-24-2026/event/0D0062FEFEF849EF?landing=c',
    isLive: false,
  },
];
