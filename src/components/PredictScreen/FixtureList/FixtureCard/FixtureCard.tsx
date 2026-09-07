import type React from "react";
import type {
  PredictionDto,
  PredictionOutcome,
  TodayFixtureDto,
} from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import { fixtureStatusLabel, outcomeLabel } from "../../predict-format";
import MatchCard from "./MatchCard/MatchCard";

interface IFixtureCardProps {
  fixture: TodayFixtureDto;
  prediction?: PredictionDto;
  pending: boolean;
  rewardRequired: boolean;
  onSelectOutcome: (
    fixtureId: string,
    selectedOutcome: PredictionOutcome,
  ) => Promise<void>;
}

const FixtureCard: React.FC<IFixtureCardProps> = ({
  fixture,
  prediction,
  pending,
  rewardRequired,
  onSelectOutcome,
}) => {
  const { t } = useTranslation();

  return (
    <MatchCard
      fixture={fixture}
      prediction={prediction}
      pending={pending}
      rewardRequired={rewardRequired}
      onSelectOutcome={onSelectOutcome}
      fixtureStatusLabel={(status) => fixtureStatusLabel(t, status)}
      outcomeLabel={(outcome) => outcomeLabel(t, outcome)}
    />
  );
};

export default FixtureCard;
