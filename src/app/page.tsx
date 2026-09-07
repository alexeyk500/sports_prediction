import AppShell from "@/components/navigation/AppShell";
import PredictScreen from "@/components/predict/PredictScreen";

export default function Home() {
  return <AppShell predict={<PredictScreen />} />;
}
