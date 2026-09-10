import type React from "react";
import type {
  PredictionDto,
  PredictionOutcome,
  TodayFixtureDto,
} from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import { outcomeLabel } from "../../matches-format";
import type { RewardFlowPresentation } from "../../matches-types";
import MatchCard from "./MatchCard/MatchCard";

interface IFixtureCardProps {
  fixture: TodayFixtureDto;
  prediction?: PredictionDto;
  pending: boolean;
  rewardFlow?: RewardFlowPresentation;
  onStartReward: (fixtureId: string) => Promise<void>;
  onSelectOutcome: (
    fixtureId: string,
    selectedOutcome: PredictionOutcome,
  ) => Promise<void>;
}

const FixtureCard: React.FC<IFixtureCardProps> = ({
  fixture,
  prediction,
  pending,
  rewardFlow,
  onStartReward,
  onSelectOutcome,
}) => {
  const { t } = useTranslation();

  return (
    <MatchCard
      fixture={fixture}
      prediction={prediction}
      pending={pending}
      rewardRequired={rewardFlow !== undefined}
      rewardFlow={rewardFlow}
      onStartReward={onStartReward}
      onSelectOutcome={onSelectOutcome}
      outcomeLabel={(outcome) => outcomeLabel(t, outcome)}
    />
  );
};

export default FixtureCard;
