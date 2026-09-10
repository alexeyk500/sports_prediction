import type React from "react";
import type {
  PredictionDto,
  PredictionOutcome,
  TodayFixtureDto,
} from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import MyPickCard from "./MyPickCard/MyPickCard";
import styles from "./MyPicks.module.css";

interface IMyPicksProps {
  predictions: PredictionDto[];
  fixtures: TodayFixtureDto[];
  pendingFixtureId: string | null;
  onSelectOutcome: (
    fixtureId: string,
    selectedOutcome: PredictionOutcome,
  ) => Promise<void>;
}

const MyPicks: React.FC<IMyPicksProps> = ({
  predictions,
  fixtures,
  pendingFixtureId,
  onSelectOutcome,
}) => {
  const { t } = useTranslation();
  const fixturesById = new Map(
    fixtures.map((fixture) => [fixture.id, fixture]),
  );

  if (predictions.length === 0) {
    return (
      <section className={styles.statePanel}>
        {t("matches.empty.myPicks")}
      </section>
    );
  }

  return (
    <section className={styles.fixtureList}>
      {predictions.map((prediction) => {
        const fixture =
          fixturesById.get(prediction.fixtureId) ?? prediction.fixture;

        return (
          <MyPickCard
            key={prediction.id}
            prediction={prediction}
            fixture={fixture}
            pending={pendingFixtureId === prediction.fixtureId}
            onSelectOutcome={onSelectOutcome}
          />
        );
      })}
    </section>
  );
};

export default MyPicks;
