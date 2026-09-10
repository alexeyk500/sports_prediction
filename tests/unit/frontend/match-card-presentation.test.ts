import { describe, expect, it } from "vitest";
import {
  deriveMatchCardState,
  getCompetitionBadge,
  getTeamBadge,
  initialsForName,
  outcomeDisplayLabel,
  trophyAriaValues,
} from "@/components/MatchesScreen/MatchCardShared/match-card-presentation";
import {
  getCompetitionAssetUrl,
  getTeamAssetUrl,
} from "@/lib/assets/football-assets";
import { PREDICTION_OUTCOME_ORDER } from "@/components/MatchesScreen/matches-outcomes";
import { createTranslator, translationResources } from "@/lib/i18n/i18n";
import type { PredictionDto, TodayFixtureDto } from "@/lib/api/types";

describe("match card presentation", () => {
  it("maps domain outcomes to football 1X2 labels", () => {
    expect(outcomeDisplayLabel("HOME")).toBe("1");
    expect(outcomeDisplayLabel("DRAW")).toBe("X");
    expect(outcomeDisplayLabel("AWAY")).toBe("2");
  });

  it("keeps HOME/DRAW/AWAY mapping independent of RTL direction", () => {
    expect(
      PREDICTION_OUTCOME_ORDER.map((outcome) => [
        outcome,
        outcomeDisplayLabel(outcome),
      ]),
    ).toEqual([
      ["HOME", "1"],
      ["DRAW", "X"],
      ["AWAY", "2"],
    ]);
  });

  it("builds fallback league badge data when no logo URL exists", () => {
    expect(
      getCompetitionBadge({
        id: "competition-1",
        code: "EPL",
        name: "Premier League",
        slug: "premier-league",
      }),
    ).toMatchObject({
      label: "Premier League",
      tone: "purple",
      initials: "PL",
      logoUrl: "/assets/competitions/premier-league.webp",
    });
    expect(
      getCompetitionBadge({
        id: "competition-2",
        code: "UNKNOWN",
        name: "Open Cup",
        slug: "open-cup",
      }),
    ).toMatchObject({
      tone: "slate",
      initials: "OC",
    });
  });

  it("builds canonical competition logo URL from backend slug", () => {
    expect(
      getCompetitionBadge({
        id: "competition-1",
        code: "EPL",
        name: "Renamed League",
        slug: "premier-league",
      }),
    ).toMatchObject({
      initials: "RL",
      logoUrl: "/assets/competitions/premier-league.webp",
    });
  });

  it("builds fallback team badge initials", () => {
    expect(
      getTeamBadge({
        id: "team-1",
        name: "Manchester City",
        slug: "manchester-city",
        shortName: null,
      }),
    ).toMatchObject({
      label: "Manchester City",
      initials: "MC",
      logoUrl: "/assets/teams/manchester-city.webp",
    });
    expect(initialsForName("Ajax")).toBe("AJ");
  });

  it("builds canonical team logo URL from backend slug", () => {
    expect(
      getTeamBadge({
        id: "team-1",
        name: "Bayern München",
        slug: "bayern-munchen",
        shortName: null,
      }),
    ).toMatchObject({
      logoUrl: "/assets/teams/bayern-munchen.webp",
    });
  });

  it("resolves local asset paths from slug only", () => {
    expect(getTeamAssetUrl("arsenal")).toBe("/assets/teams/arsenal.webp");
    expect(getCompetitionAssetUrl("premier-league")).toBe(
      "/assets/competitions/premier-league.webp",
    );
  });

  it("formats trophy value for accessible labels without exposing point text", () => {
    const t = createTranslator("en");
    const trophyValue = t("common.trophyCount", trophyAriaValues("en", 10));

    expect(trophyValue).toBe("10 trophies");
    expect(
      t("matches.aria.selectOutcome", {
        outcome: "Home",
        trophyValue,
        homeTeam: "Arsenal",
        awayTeam: "Chelsea",
      }),
    ).toBe("Select Home, 10 trophies, for Arsenal vs Chelsea");
    expect("pointsShort" in translationResources.en.common).toBe(false);
  });

  it("derives actionable open state without an existing prediction", () => {
    expect(
      deriveMatchCardState({
        fixture: fixture("OPEN"),
        pending: false,
        rewardRequired: false,
      }),
    ).toMatchObject({
      phase: "OPEN",
      predictionState: "NONE",
      canSubmitPrediction: true,
      statusIntent: "NONE",
      hasStableStatusSlot: true,
    });
  });

  it("derives actionable open state with an editable saved prediction", () => {
    expect(
      deriveMatchCardState({
        fixture: fixture("OPEN"),
        prediction: prediction({ editable: true }),
        pending: false,
        rewardRequired: false,
      }),
    ).toMatchObject({
      phase: "OPEN",
      predictionState: "EDITABLE",
      selectedOutcome: "HOME",
      canSubmitPrediction: true,
      statusIntent: "NONE",
    });
  });

  it("preserves selection and blocks mutation while saving", () => {
    expect(
      deriveMatchCardState({
        fixture: fixture("OPEN"),
        prediction: prediction({ editable: true, selectedOutcome: "DRAW" }),
        pending: true,
        rewardRequired: false,
      }),
    ).toMatchObject({
      predictionState: "SAVING",
      selectedOutcome: "DRAW",
      canSubmitPrediction: false,
      statusIntent: "SAVING",
    });
  });

  it.each(["LOCKED", "LIVE", "FINISHED", "SETTLED"] as const)(
    "blocks mutation for %s lifecycle phase",
    (status) => {
      expect(
        deriveMatchCardState({
          fixture: fixture(status),
          prediction: prediction({ editable: false }),
          pending: false,
          rewardRequired: false,
        }).canSubmitPrediction,
      ).toBe(false);
    },
  );

  it("blocks stale open state when prediction is not editable", () => {
    expect(
      deriveMatchCardState({
        fixture: fixture("OPEN"),
        prediction: prediction({ editable: false }),
        pending: false,
        rewardRequired: false,
      }),
    ).toMatchObject({
      predictionState: "LOCKED",
      canSubmitPrediction: false,
      statusIntent: "LOCKED_AFTER_KICKOFF",
    });
  });

  it("blocks reward-required flow without converting outcome click to mutation", () => {
    expect(
      deriveMatchCardState({
        fixture: fixture("OPEN"),
        pending: false,
        rewardRequired: true,
      }).canSubmitPrediction,
    ).toBe(false);
  });

  it("derives semantic settled result treatment from available prediction data", () => {
    expect(
      deriveMatchCardState({
        fixture: fixture("SETTLED", "AWAY"),
        prediction: prediction({
          editable: false,
          selectedOutcome: "AWAY",
          resultStatus: "CORRECT",
        }),
        pending: false,
        rewardRequired: false,
      }),
    ).toMatchObject({
      predictionState: "CORRECT",
      statusIntent: "CORRECT",
      outcomeResults: { AWAY: "success" },
    });

    expect(
      deriveMatchCardState({
        fixture: fixture("SETTLED"),
        prediction: prediction({
          editable: false,
          selectedOutcome: "DRAW",
          resultStatus: "INCORRECT",
        }),
        pending: false,
        rewardRequired: false,
      }),
    ).toMatchObject({
      predictionState: "WRONG",
      statusIntent: "WRONG",
      outcomeResults: { DRAW: "wrong" },
    });
  });

  it("marks the actual winning outcome for a wrong settled prediction", () => {
    expect(
      deriveMatchCardState({
        fixture: fixture("SETTLED", "AWAY"),
        prediction: prediction({
          editable: false,
          selectedOutcome: "HOME",
          resultStatus: "INCORRECT",
        }),
        pending: false,
        rewardRequired: false,
      }),
    ).toMatchObject({
      predictionState: "WRONG",
      selectedOutcome: "HOME",
      outcomeResults: { HOME: "wrong", AWAY: "success" },
    });
  });

  it("marks draw as the actual winning outcome for a wrong away prediction", () => {
    expect(
      deriveMatchCardState({
        fixture: fixture("SETTLED", "DRAW"),
        prediction: prediction({
          editable: false,
          selectedOutcome: "AWAY",
          resultStatus: "INCORRECT",
        }),
        pending: false,
        rewardRequired: false,
      }),
    ).toMatchObject({
      predictionState: "WRONG",
      selectedOutcome: "AWAY",
      outcomeResults: { AWAY: "wrong", DRAW: "success" },
    });
  });

  it("does not fabricate a correct outcome when settled result is missing", () => {
    expect(
      deriveMatchCardState({
        fixture: fixture("SETTLED", null),
        prediction: prediction({
          editable: false,
          selectedOutcome: "HOME",
          resultStatus: "INCORRECT",
        }),
        pending: false,
        rewardRequired: false,
      }),
    ).toMatchObject({
      predictionState: "WRONG",
      selectedOutcome: "HOME",
      outcomeResults: { HOME: "wrong" },
    });
  });
});

function fixture(
  status: string,
  winningOutcome: TodayFixtureDto["winningOutcome"] = null,
): TodayFixtureDto {
  return {
    id: "fixture-1",
    kickoffAt: "2026-09-05T15:00:00.000Z",
    competition: {
      id: "competition-1",
      code: "EPL",
      name: "Premier League",
      slug: "premier-league",
    },
    homeTeam: {
      id: "team-1",
      name: "Arsenal",
      slug: "arsenal",
      shortName: null,
    },
    awayTeam: {
      id: "team-2",
      name: "Chelsea",
      slug: "chelsea",
      shortName: null,
    },
    status,
    winningOutcome,
    outcomes: {
      home: { points: 13 },
      draw: { points: 24 },
      away: { points: 27 },
    },
  };
}

function prediction(overrides: Partial<PredictionDto> = {}): PredictionDto {
  return {
    id: "prediction-1",
    fixtureId: "fixture-1",
    selectedOutcome: "HOME",
    slotType: "FREE",
    potentialPoints: 13,
    earnedPoints: 0,
    resultStatus: "PENDING",
    kickoffAt: "2026-09-05T15:00:00.000Z",
    editable: true,
    fixture: fixture("OPEN"),
    ...overrides,
  };
}
