import type {
  PredictionDto,
  PredictionOutcome,
  TodayFixtureDto,
} from "@/lib/api/types";
import {
  getCompetitionAssetUrl,
  getTeamAssetUrl,
} from "@/lib/assets/football-assets";
import type { TranslationValues } from "@/lib/i18n/i18n";
import type { SupportedLocale } from "@/lib/i18n/locales";

export interface VisualBadge {
  label: string;
  tone: BadgeTone;
  initials: string;
  logoUrl?: string;
}

export type BadgeTone =
  "purple" | "blue" | "red" | "green" | "gold" | "cyan" | "slate";

export type MatchPhase =
  "DRAFT" | "OPEN" | "LOCKED" | "LIVE" | "FINISHED" | "SETTLED";

export type MatchPredictionPresentationState =
  "NONE" | "SAVING" | "EDITABLE" | "LOCKED" | "CORRECT" | "WRONG";

export type MatchCardStatusIntent =
  | "NONE"
  | "SAVING"
  | "DRAFT"
  | "PREDICTIONS_CLOSED"
  | "LOCKED_AFTER_KICKOFF"
  | "LIVE"
  | "AWAITING_SETTLEMENT"
  | "MATCH_FINISHED"
  | "CORRECT"
  | "WRONG";

export interface MatchCardPresentationState {
  phase: MatchPhase;
  predictionState: MatchPredictionPresentationState;
  canSubmitPrediction: boolean;
  selectedOutcome?: PredictionOutcome;
  statusIntent: MatchCardStatusIntent;
  outcomeResults: Partial<Record<PredictionOutcome, "success" | "wrong">>;
  hasStableStatusSlot: true;
}

export interface DeriveMatchCardStateInput {
  fixture: Pick<TodayFixtureDto, "status" | "winningOutcome">;
  prediction?: Pick<
    PredictionDto,
    "selectedOutcome" | "editable" | "resultStatus"
  >;
  pending: boolean;
  rewardRequired: boolean;
}

const competitionBadgeTones: Record<string, BadgeTone> = {
  EPL: "purple",
  LALIGA: "red",
  SERIE_A: "blue",
  BUNDESLIGA: "red",
  LIGUE_1: "green",
  UCL: "cyan",
  UEL: "gold",
};

export function getCompetitionBadge(
  competition: TodayFixtureDto["competition"],
): VisualBadge {
  return {
    label: competition.name,
    tone: competitionBadgeTones[competition.code] ?? "slate",
    initials: initialsForName(competition.name),
    logoUrl: getCompetitionAssetUrl(competition.slug),
  };
}

export function getTeamBadge(
  team: TodayFixtureDto["homeTeam"] | TodayFixtureDto["awayTeam"],
): VisualBadge {
  return {
    label: team.name,
    tone: toneFromText(team.id),
    initials: initialsForName(team.shortName ?? team.name),
    logoUrl: getTeamAssetUrl(team.slug),
  };
}

export function deriveMatchCardState(
  input: DeriveMatchCardStateInput,
): MatchCardPresentationState {
  const phase = toMatchPhase(input.fixture.status);
  const selectedOutcome = input.prediction?.selectedOutcome;
  const predictionState = derivePredictionState(input);
  const canSubmitPrediction =
    phase === "OPEN" &&
    !input.pending &&
    !input.rewardRequired &&
    (!input.prediction || input.prediction.editable);

  return {
    phase,
    predictionState,
    canSubmitPrediction,
    selectedOutcome,
    statusIntent: deriveStatusIntent(phase, predictionState, input.prediction),
    outcomeResults: deriveOutcomeResults(
      phase,
      input.prediction,
      input.fixture.winningOutcome,
    ),
    hasStableStatusSlot: true,
  };
}

export function outcomeDisplayLabel(
  outcome: PredictionOutcome,
): "1" | "X" | "2" {
  switch (outcome) {
    case "HOME":
      return "1";
    case "DRAW":
      return "X";
    case "AWAY":
      return "2";
  }
}

export function trophyAriaValues(
  locale: SupportedLocale,
  points: number,
): TranslationValues {
  return { count: new Intl.NumberFormat(locale).format(points) };
}

export function pointsForOutcome(
  fixture: {
    outcomes: {
      home: { points: number };
      draw: { points: number };
      away: { points: number };
    };
  },
  outcome: PredictionOutcome,
): number {
  switch (outcome) {
    case "HOME":
      return fixture.outcomes.home.points;
    case "DRAW":
      return fixture.outcomes.draw.points;
    case "AWAY":
      return fixture.outcomes.away.points;
  }
}

function derivePredictionState(
  input: DeriveMatchCardStateInput,
): MatchPredictionPresentationState {
  if (input.pending) {
    return "SAVING";
  }

  if (!input.prediction) {
    return "NONE";
  }

  if (input.fixture.status === "SETTLED") {
    if (input.prediction.resultStatus === "CORRECT") {
      return "CORRECT";
    }

    if (input.prediction.resultStatus === "INCORRECT") {
      return "WRONG";
    }
  }

  return input.prediction.editable ? "EDITABLE" : "LOCKED";
}

function deriveStatusIntent(
  phase: MatchPhase,
  predictionState: MatchPredictionPresentationState,
  prediction: DeriveMatchCardStateInput["prediction"],
): MatchCardStatusIntent {
  if (predictionState === "SAVING") {
    return "SAVING";
  }

  if (predictionState === "CORRECT") {
    return "CORRECT";
  }

  if (predictionState === "WRONG") {
    return "WRONG";
  }

  if (predictionState === "LOCKED") {
    return "LOCKED_AFTER_KICKOFF";
  }

  switch (phase) {
    case "DRAFT":
      return "DRAFT";
    case "OPEN":
      return "NONE";
    case "LOCKED":
      return prediction ? "LOCKED_AFTER_KICKOFF" : "PREDICTIONS_CLOSED";
    case "LIVE":
      return "LIVE";
    case "FINISHED":
      return prediction ? "AWAITING_SETTLEMENT" : "MATCH_FINISHED";
    case "SETTLED":
      return "MATCH_FINISHED";
  }
}

function deriveOutcomeResults(
  phase: MatchPhase,
  prediction: DeriveMatchCardStateInput["prediction"],
  winningOutcome: PredictionOutcome | null,
): Partial<Record<PredictionOutcome, "success" | "wrong">> {
  if (!prediction || phase !== "SETTLED") {
    return {};
  }

  if (prediction.resultStatus === "CORRECT") {
    return { [prediction.selectedOutcome]: "success" };
  }

  if (prediction.resultStatus === "INCORRECT") {
    return {
      [prediction.selectedOutcome]: "wrong",
      ...(winningOutcome && winningOutcome !== prediction.selectedOutcome
        ? { [winningOutcome]: "success" as const }
        : {}),
    };
  }

  return {};
}

function toMatchPhase(status: string): MatchPhase {
  return isMatchPhase(status) ? status : "DRAFT";
}

function isMatchPhase(status: string): status is MatchPhase {
  return ["DRAFT", "OPEN", "LOCKED", "LIVE", "FINISHED", "SETTLED"].includes(
    status,
  );
}

export function capitalizeTone(
  tone: VisualBadge["tone"],
): Capitalize<VisualBadge["tone"]> {
  return `${tone[0].toUpperCase()}${tone.slice(1)}` as Capitalize<
    VisualBadge["tone"]
  >;
}

export function initialsForName(name: string): string {
  const words = name
    .replace(/[^A-Za-z0-9А-Яа-яЁё\u0600-\u06FF ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  const letters =
    words.length === 1
      ? words[0].slice(0, 2)
      : `${words[0][0]}${words.at(-1)?.[0] ?? ""}`;

  return letters.toUpperCase();
}

function toneFromText(text: string): BadgeTone {
  const tones: BadgeTone[] = [
    "purple",
    "blue",
    "red",
    "green",
    "gold",
    "cyan",
    "slate",
  ];
  let hash = 0;

  for (const character of text) {
    hash = (hash * 31 + character.charCodeAt(0)) % tones.length;
  }

  return tones[hash] ?? "slate";
}
