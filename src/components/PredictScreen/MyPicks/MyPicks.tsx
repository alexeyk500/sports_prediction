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
  onSelectOutcome: (
    fixtureId: string,
    selectedOutcome: PredictionOutcome,
  ) => Promise<void>;
}

const MyPicks: React.FC<IMyPicksProps> = ({
  predictions,
  fixtures,
  onSelectOutcome,
}) => {
  const { t } = useTranslation();
  const fixturesById = new Map(
    fixtures.map((fixture) => [fixture.id, fixture]),
  );

  if (predictions.length === 0) {
    return (
      <section className={styles.statePanel}>
        {t("predict.empty.myPicks")}
      </section>
    );
  }

  return (
    <section className={styles.fixtureList}>
      {predictions.map((prediction) => {
        const fixture = fixturesById.get(prediction.fixtureId);

        return (
          <MyPickCard
            key={prediction.id}
            prediction={prediction}
            fixture={fixture}
            onSelectOutcome={onSelectOutcome}
          />
        );
      })}
    </section>
  );
};

export default MyPicks;
