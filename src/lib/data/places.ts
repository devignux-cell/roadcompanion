import type { Place } from "@/types/places";
import { COLORS } from "@/lib/constants/colors";

import columbiaImg from "@/lib/images/Columbia-Restaurant.jpg";
import uleleImg from "@/lib/images/ulele-twilight-exterior0_7d173620-5056-a36a-087a05e984216791.jpg";
import armatureImg from "@/lib/images/armature.jpeg";
import bernsImg from "@/lib/images/Bern-s-interior0_7e3307d2-5056-a36a-08478d3f0f609045.jpg";
import buschImg from "@/lib/images/busch.jpg";
import channelsideImg from "@/lib/images/channelsidebayplaza.jpg";
import sparkmanImg from "@/lib/images/Sparkman-Wharf-Lawn---Evening-Wide_67E4E1BF-5056-A36A-08499EF871A55CE9-67e4d20b5056a36_67e561db-5056-a36a-08c22d6c2b77e399.jpg";
import clearwaterImg from "@/lib/images/Pier-60-Day-Clearwater-Beach-3dee97d2-c825-41ea-ad80-cd2eece9070a.jpg";
import riverwalkImg from "@/lib/images/riverwalk.jpg";

export const PLACES: Place[] = [
  {
    id: "columbia-restaurant",
    name: "Columbia Restaurant",
    cat: "Food",
    tag: "Historic",
    desc: "Florida's oldest restaurant. Flamenco shows nightly in a stunning 1905 building.",
    hood: "Ybor City",
    emoji: "🍽️",
    color: COLORS.accent,
    unsplashQuery: "spanish restaurant historic florida",
    imageUrl: columbiaImg.src,
    mapsQuery: "Columbia Restaurant Ybor City Tampa FL",
  },
  {
    id: "ulele",
    name: "Ulele",
    cat: "Food",
    tag: "Waterfront",
    desc: "Native-inspired cuisine on the Hillsborough River. Beautiful outdoor dining.",
    hood: "Heights",
    emoji: "🌊",
    color: COLORS.teal,
    unsplashQuery: "waterfront restaurant river florida",
    imageUrl: uleleImg.src,
    mapsQuery: "Ulele Tampa Heights FL",
  },
  {
    id: "armature-works",
    name: "Armature Works",
    cat: "Food",
    tag: "Market",
    desc: "Tampa's coolest food hall with river views, craft cocktails, and rotating vendors.",
    hood: "Heights",
    emoji: "🏛️",
    color: COLORS.gold,
    unsplashQuery: "food hall market industrial interior",
    imageUrl: armatureImg.src,
    mapsQuery: "Armature Works Tampa FL",
  },
  {
    id: "berns-steak-house",
    name: "Bern's Steak House",
    cat: "Food",
    tag: "Iconic",
    desc: "Legendary steakhouse with the world's largest private wine cellar. A Tampa institution.",
    hood: "Hyde Park",
    emoji: "🥩",
    color: COLORS.accent,
    unsplashQuery: "fine dining steakhouse wine cellar",
    imageUrl: bernsImg.src,
    mapsQuery: "Bern's Steak House Tampa FL",
  },
  {
    id: "busch-gardens",
    name: "Busch Gardens",
    cat: "Attractions",
    tag: "Thrill",
    desc: "World-class rides and live exotic animals. Fun for all ages.",
    hood: "Temple Terrace",
    emoji: "🎢",
    color: COLORS.purple,
    unsplashQuery: "theme park roller coaster thrill",
    imageUrl: buschImg.src,
    mapsQuery: "Busch Gardens Tampa FL",
  },
  {
    id: "channelside-bay-plaza",
    name: "Channelside Bay Plaza",
    cat: "Bars",
    tag: "Nightlife",
    desc: "Waterfront bars and live music right on the bay. Perfect for a night out.",
    hood: "Downtown",
    emoji: "🍹",
    color: "#FF87C3",
    unsplashQuery: "waterfront bar nightlife marina",
    imageUrl: channelsideImg.src,
    mapsQuery: "Channelside Bay Plaza Tampa FL",
  },
  {
    id: "sparkman-wharf",
    name: "Sparkman Wharf",
    cat: "Bars",
    tag: "Outdoor",
    desc: "Container bars, fire pits, food trucks, and great waterfront vibes.",
    hood: "Downtown",
    emoji: "⚓",
    color: COLORS.teal,
    unsplashQuery: "outdoor bar fire pit waterfront container",
    imageUrl: sparkmanImg.src,
    mapsQuery: "Sparkman Wharf Tampa FL",
  },
  {
    id: "clearwater-beach",
    name: "Clearwater Beach",
    cat: "Beaches",
    tag: "30 min away",
    desc: "Consistently ranked America's best beach. White sand, clear Gulf water.",
    hood: "Pinellas",
    emoji: "🏖️",
    color: COLORS.gold,
    unsplashQuery: "clearwater beach florida gulf white sand",
    imageUrl: clearwaterImg.src,
    mapsQuery: "Clearwater Beach FL",
  },
  {
    id: "tampa-riverwalk",
    name: "The Tampa Riverwalk",
    cat: "Attractions",
    tag: "Free",
    desc: "2.6 miles of beautiful waterfront walkway connecting parks, museums, and restaurants.",
    hood: "Downtown",
    emoji: "🌿",
    color: COLORS.teal,
    unsplashQuery: "riverwalk waterfront path urban park",
    imageUrl: riverwalkImg.src,
    mapsQuery: "Tampa Riverwalk FL",
  },
];

export const EXPLORE_CATEGORIES = ["All", "Food", "Bars", "Beaches", "Attractions"] as const;
export type ExploreCategory = (typeof EXPLORE_CATEGORIES)[number];
