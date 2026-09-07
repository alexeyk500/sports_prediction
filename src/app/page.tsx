import AppShell from "@/components/navigation/AppShell/AppShell";
import PredictScreen from "@/components/PredictScreen/PredictScreen";

export default function Home() {
  return <AppShell predict={<PredictScreen />} />;
}
