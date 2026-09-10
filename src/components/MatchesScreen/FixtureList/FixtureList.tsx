import type React from "react";
import type {
  PredictionDto,
  PredictionOutcome,
  TodayFixtureDto,
} from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { RewardFlowPresentation } from "../matches-types";
import FixtureCard from "./FixtureCard/FixtureCard";
import styles from "./FixtureList.module.css";

interface IFixtureListProps {
  fixtures: TodayFixtureDto[];
  predictionsByFixture: Map<string, PredictionDto>;
  pendingFixtureId: string | null;
  rewardFlow: ({ fixtureId: string } & RewardFlowPresentation) | null;
  onStartReward: (fixtureId: string) => Promise<void>;
  onSelectOutcome: (
    fixtureId: string,
    selectedOutcome: PredictionOutcome,
  ) => Promise<void>;
}

const FixtureList: React.FC<IFixtureListProps> = ({
  fixtures,
  predictionsByFixture,
  pendingFixtureId,
  rewardFlow,
  onStartReward,
  onSelectOutcome,
}) => {
  const { t } = useTranslation();

  if (fixtures.length === 0) {
    return (
      <section className={styles.statePanel}>
        {t("matches.empty.available")}
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
          rewardFlow={
            rewardFlow?.fixtureId === fixture.id
              ? { status: rewardFlow.status }
              : undefined
          }
          onStartReward={onStartReward}
          onSelectOutcome={onSelectOutcome}
        />
      ))}
    </section>
  );
};

export default FixtureList;
