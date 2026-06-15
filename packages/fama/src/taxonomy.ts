/**
 * Normalised theme topics. The per-review analyzer is told to map each theme it
 * finds to the closest of these, so themes aggregate cleanly across a batch
 * (a review saying "the waiter" and one saying "reception" both map to `staff`).
 * Cross-vertical on purpose — hotels, restaurants and clinics share most of them.
 */
export const THEME_TOPICS = [
  "staff",
  "service_speed",
  "professionalism",
  "communication",
  "cleanliness",
  "food_quality",
  "drinks_quality",
  "breakfast",
  "value_for_money",
  "pricing",
  "atmosphere",
  "location",
  "noise",
  "comfort",
  "room_quality",
  "facilities",
  "wifi",
  "parking",
  "wait_time",
  "booking_process",
  "accessibility",
] as const;

export type ThemeTopic = (typeof THEME_TOPICS)[number];

/** Human label for a topic id (for reports/UI). */
export function topicLabel(topic: string): string {
  return topic.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
