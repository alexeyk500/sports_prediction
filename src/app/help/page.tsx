import type { Metadata } from "next";
import PublicHelpPage from "@/components/PublicHelpPage/PublicHelpPage";

export const metadata: Metadata = {
  title: "Help & Support | Goalstery",
  description:
    "Help and support for Goalstery predictions, Cups, leaderboards and account questions.",
};

export default function HelpPage() {
  return <PublicHelpPage />;
}
