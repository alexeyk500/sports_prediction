"use client";

import { useState } from "react";
import { TrophyIcon } from "@/assets/icons/TrophyIcon";
import type { PredictionDto, PredictionOutcome, TodayFixtureDto } from "@/lib/api/types";
import { formatKickoffTime, formatLocalizedNumber } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/use-translation";
import { PREDICTION_OUTCOME_ORDER } from "./predict-outcomes";
import {
  getCompetitionBadge,
  getTeamBadge,
  outcomeDisplayLabel,
  trophyAriaValues,
  type VisualBadge,
} from "./match-card-presentation";
import styles from "./PredictScreen.module.css";

interface MatchCardProps {
  fixture: TodayFixtureDto;
  prediction?: PredictionDto;
  pending: boolean;
  rewardRequired: boolean;
  onSelectOutcome: (fixtureId: string, selectedOutcome: PredictionOutcome) => Promise<void>;
  fixtureStatusLabel: (status: string) => string;
  outcomeLabel: (outcome: PredictionOutcome) => string;
}

export function MatchCard({
  fixture,
  prediction,
  pending,
  rewardRequired,
  onSelectOutcome,
  fixtureStatusLabel,
  outcomeLabel,
}: MatchCardProps) {
  const { t, locale } = useTranslation();
  const editable = prediction ? prediction.editable : true;
  const showLockedStatus = prediction !== undefined && !editable;
  const showFixtureStatus = prediction === undefined && fixture.status !== "OPEN";
  const showStatusRow = showLockedStatus || showFixtureStatus || pending;

  return (
    <article className={styles.fixtureCard}>
      <div className={styles.fixtureMeta}>
        <LeagueBadge badge={getCompetitionBadge(fixture.competition)} />
        <time dateTime={fixture.kickoffAt}>{formatKickoffTime(locale, fixture.kickoffAt)}</time>
      </div>
      <div className={styles.matchup}>
        <TeamIdentity badge={getTeamBadge(fixture.homeTeam)} name={fixture.homeTeam.name} align="start" />
        <span className={styles.versus}>VS</span>
        <TeamIdentity badge={getTeamBadge(fixture.awayTeam)} name={fixture.awayTeam.name} align="end" />
      </div>
      <div className={styles.outcomes}>
        {PREDICTION_OUTCOME_ORDER.map((outcome) => (
          <PredictionOutcomeButton
            key={outcome}
            fixture={fixture}
            outcome={outcome}
            selected={prediction?.selectedOutcome === outcome}
            disabled={pending || !editable}
            onSelectOutcome={onSelectOutcome}
            outcomeLabel={outcomeLabel(outcome)}
          />
        ))}
      </div>
      {showStatusRow ? (
        <div className={styles.fixtureStatus}>
          {showLockedStatus ? (
            <span className={styles.statusItem}>
              <LockIcon />
              <span>{t("predict.status.lockedAfterKickoff")}</span>
            </span>
          ) : null}
          {showFixtureStatus ? <span>{fixtureStatusLabel(fixture.status)}</span> : null}
          {pending ? <span>{t("predict.status.saving")}</span> : null}
        </div>
      ) : null}
      {rewardRequired ? (
        <div className={styles.rewardPlaceholder}>
          <strong>{t("predict.reward.title")}</strong>
          <span>{t("predict.reward.body")}</span>
        </div>
      ) : null}
    </article>
  );
}

interface MyPickCardProps {
  prediction: PredictionDto;
  fixture?: TodayFixtureDto;
  onSelectOutcome: (fixtureId: string, selectedOutcome: PredictionOutcome) => Promise<void>;
  outcomeLabel: (outcome: PredictionOutcome) => string;
  slotLabel: (slotType: PredictionDto["slotType"]) => string;
}

export function MyPickCard({
  prediction,
  fixture,
  onSelectOutcome,
  outcomeLabel,
  slotLabel,
}: MyPickCardProps) {
  const { t, locale } = useTranslation();

  return (
    <article className={styles.fixtureCard}>
      <div className={styles.fixtureMeta}>
        {fixture ? (
          <LeagueBadge badge={getCompetitionBadge(fixture.competition)} />
        ) : (
          <span dir="auto">{t("predict.status.fixtureFallback")}</span>
        )}
        <time dateTime={prediction.kickoffAt}>{formatKickoffTime(locale, prediction.kickoffAt)}</time>
      </div>
      {fixture ? (
        <div className={styles.matchup}>
          <TeamIdentity badge={getTeamBadge(fixture.homeTeam)} name={fixture.homeTeam.name} align="start" />
          <span className={styles.versus}>VS</span>
          <TeamIdentity badge={getTeamBadge(fixture.awayTeam)} name={fixture.awayTeam.name} align="end" />
        </div>
      ) : null}
      <div className={styles.pickRow}>
        <strong>{outcomeLabel(prediction.selectedOutcome)}</strong>
        <TrophyValue value={prediction.potentialPoints} />
        <span>{slotLabel(prediction.slotType)}</span>
        <span>{prediction.editable ? t("predict.status.editable") : t("predict.status.locked")}</span>
      </div>
      {fixture && prediction.editable ? (
        <div className={styles.outcomes}>
          {PREDICTION_OUTCOME_ORDER.map((outcome) => (
            <PredictionOutcomeButton
              key={outcome}
              fixture={fixture}
              outcome={outcome}
              selected={prediction.selectedOutcome === outcome}
              disabled={false}
              onSelectOutcome={onSelectOutcome}
              outcomeLabel={outcomeLabel(outcome)}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

function LeagueBadge({ badge }: { badge: VisualBadge }) {
  return (
    <span className={styles.leagueIdentity}>
      <Badge badge={badge} size="small" />
      <span dir="auto">{badge.label}</span>
    </span>
  );
}

function TeamIdentity({
  badge,
  name,
}: {
  badge: VisualBadge;
  name: string;
  align: "start" | "end";
}) {
  return (
    <span className={styles.teamIdentity}>
      <Badge badge={badge} size="large" />
      <span className={styles.teamName} dir="auto">
        {name}
      </span>
    </span>
  );
}

function PredictionOutcomeButton({
  fixture,
  outcome,
  selected,
  disabled,
  onSelectOutcome,
  outcomeLabel,
}: {
  fixture: TodayFixtureDto;
  outcome: PredictionOutcome;
  selected: boolean;
  disabled: boolean;
  onSelectOutcome: (fixtureId: string, selectedOutcome: PredictionOutcome) => Promise<void>;
  outcomeLabel: string;
}) {
  const { t, locale } = useTranslation();
  const points = pointsForOutcome(fixture, outcome);

  return (
    <button
      type="button"
      className={selected ? styles.selectedOutcome : styles.outcomeButton}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={t("predict.aria.selectOutcome", {
        outcome: outcomeLabel,
        trophyValue: t("common.trophyCount", trophyAriaValues(locale, points)),
        homeTeam: fixture.homeTeam.name,
        awayTeam: fixture.awayTeam.name,
      })}
      data-outcome={outcome}
      onClick={() => void onSelectOutcome(fixture.id, outcome)}
    >
      <span className={styles.outcomeCode}>{outcomeDisplayLabel(outcome)}</span>
      <TrophyValue value={points} />
    </button>
  );
}

function LockIcon() {
  return (
    <svg className={styles.statusIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4V7Zm3 8.73V17h-2v-1.27a2 2 0 1 1 2 0Z" />
    </svg>
  );
}

function TrophyValue({ value }: { value: number }) {
  const { locale } = useTranslation();

  return (
    <span className={styles.trophyValue}>
      <TrophyIcon className={styles.trophyIcon} />
      <span data-ui="trophy-value">{formatLocalizedNumber(locale, value)}</span>
    </span>
  );
}

function Badge({ badge, size }: { badge: VisualBadge; size: "small" | "large" }) {
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const badgeClass = size === "small" ? styles.badgeSmall : styles.badgeLarge;
  const dataUi = size === "small" ? "league-badge" : "team-badge";
  const logoFailed = badge.logoUrl !== undefined && failedLogoUrl === badge.logoUrl;

  if (badge.logoUrl && !logoFailed) {
    return (
      <span className={`${badgeClass} ${styles.badgeLogo}`} aria-hidden="true" data-ui={dataUi}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Tiny badge logos need native onError fallback for canonical local/CDN asset URLs. */}
        <img src={badge.logoUrl} alt="" onError={() => setFailedLogoUrl(badge.logoUrl ?? null)} />
      </span>
    );
  }

  return (
    <span
      className={`${badgeClass} ${styles[`badgeTone${capitalizeTone(badge.tone)}`]}`}
      aria-hidden="true"
      data-ui={dataUi}
      data-logo-fallback="true"
    >
      {badge.initials}
    </span>
  );
}

function pointsForOutcome(fixture: TodayFixtureDto, outcome: PredictionOutcome): number {
  switch (outcome) {
    case "HOME":
      return fixture.outcomes.home.points;
    case "DRAW":
      return fixture.outcomes.draw.points;
    case "AWAY":
      return fixture.outcomes.away.points;
  }
}

function capitalizeTone(tone: VisualBadge["tone"]): Capitalize<VisualBadge["tone"]> {
  return `${tone[0].toUpperCase()}${tone.slice(1)}` as Capitalize<VisualBadge["tone"]>;
}
