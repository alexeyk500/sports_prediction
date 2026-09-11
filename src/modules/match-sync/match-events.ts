export const MATCH_OUTBOX_EVENT_TYPES = [
  "match.started",
  "match.finished",
  "match.postponed",
  "match.cancelled",
  "match.rescheduled",
] as const;

export type MatchOutboxEventType = (typeof MATCH_OUTBOX_EVENT_TYPES)[number];
