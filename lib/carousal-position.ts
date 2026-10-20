export const CAROUSAL_POSITIONS = [
  "homepage",
  "offer-banner",
  "development",
  "programs",
  "training",
] as const;

export type CarousalPosition = (typeof CAROUSAL_POSITIONS)[number];
