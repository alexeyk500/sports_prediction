import AppShell from "@/components/navigation/AppShell/AppShell";
import MatchesScreen from "@/components/MatchesScreen/MatchesScreen";

export default function Home() {
  return <AppShell matches={<MatchesScreen />} />;
}
