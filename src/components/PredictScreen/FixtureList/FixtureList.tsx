import type React from "react";
import type {
  PredictionDto,
  PredictionOutcome,
  TodayFixtureDto,
} from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import FixtureCard from "./FixtureCard/FixtureCard";
import styles from "./FixtureList.module.css";

interface IFixtureListProps {
  fixtures: TodayFixtureDto[];
  predictionsByFixture: Map<string, PredictionDto>;
  pendingFixtureId: string | null;
  rewardPromptFixtureId: string | null;
  onSelectOutcome: (
    fixtureId: string,
    selectedOutcome: PredictionOutcome,
  ) => Promise<void>;
}

const FixtureList: React.FC<IFixtureListProps> = ({
  fixtures,
  predictionsByFixture,
  pendingFixtureId,
  rewardPromptFixtureId,
  onSelectOutcome,
}) => {
  const { t } = useTranslation();

  if (fixtures.length === 0) {
    return (
      <section className={styles.statePanel}>
        {t("predict.empty.available")}
      </section>
    );
  }

  return (
    <section className={styles.fixtureList}>
      {fixtures.map((fixture) => (
        <FixtureCard
          key={fixture.id}
          fixture={fixture}
          prediction={predictionsByFixture.get(fixture.id)}
          pending={pendingFixtureId === fixture.id}
          rewardRequired={rewardPromptFixtureId === fixture.id}
          onSelectOutcome={onSelectOutcome}
        />
      ))}
    </section>
  );
};

export default FixtureList;
