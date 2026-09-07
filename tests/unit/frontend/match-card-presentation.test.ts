import { describe, expect, it } from "vitest";
import {
  getCompetitionBadge,
  getTeamBadge,
  initialsForName,
  outcomeDisplayLabel,
  trophyAriaValues,
} from "@/components/PredictScreen/MatchCardShared/match-card-presentation";
import { getCompetitionAssetUrl, getTeamAssetUrl } from "@/lib/assets/football-assets";
import { PREDICTION_OUTCOME_ORDER } from "@/components/PredictScreen/predict-outcomes";
import { createTranslator, translationResources } from "@/lib/i18n/i18n";

describe("match card presentation", () => {
  it("maps domain outcomes to football 1X2 labels", () => {
    expect(outcomeDisplayLabel("HOME")).toBe("1");
    expect(outcomeDisplayLabel("DRAW")).toBe("X");
    expect(outcomeDisplayLabel("AWAY")).toBe("2");
  });

  it("keeps HOME/DRAW/AWAY mapping independent of RTL direction", () => {
    expect(PREDICTION_OUTCOME_ORDER.map((outcome) => [outcome, outcomeDisplayLabel(outcome)])).toEqual([
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
    expect(getCompetitionAssetUrl("premier-league")).toBe("/assets/competitions/premier-league.webp");
  });

  it("formats trophy value for accessible labels without exposing point text", () => {
    const t = createTranslator("en");
    const trophyValue = t("common.trophyCount", trophyAriaValues("en", 10));

    expect(trophyValue).toBe("10 trophies");
    expect(t("predict.aria.selectOutcome", {
      outcome: "Home",
      trophyValue,
      homeTeam: "Arsenal",
      awayTeam: "Chelsea",
    })).toBe("Select Home, 10 trophies, for Arsenal vs Chelsea");
    expect("pointsShort" in translationResources.en.common).toBe(false);
  });
});
