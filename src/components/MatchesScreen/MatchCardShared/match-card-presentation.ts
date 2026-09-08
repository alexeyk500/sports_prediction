import type { PredictionOutcome, TodayFixtureDto } from "@/lib/api/types";
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
