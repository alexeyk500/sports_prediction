export type ActiveTab = "available" | "my-picks";

export type KnownFixtureStatus =
  "DRAFT" | "OPEN" | "LOCKED" | "LIVE" | "FINISHED" | "SETTLED";

export type RewardFlowStatus =
  | "required"
  | "preloading"
  | "ready"
  | "showing"
  | "confirming"
  | "failed"
  | "rejected"
  | "timeout";

export interface RewardFlowPresentation {
  status: RewardFlowStatus;
}
