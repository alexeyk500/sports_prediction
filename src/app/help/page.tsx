import type { Metadata } from "next";
import PublicHelpLocalePage from "@/components/PublicDocsLocalePages/PublicHelpLocalePage";

export const metadata: Metadata = {
  title: "Help & Support | Goalstery",
  description:
    "Help and support for Goalstery predictions, Cups, leaderboards and account questions.",
};

export default function HelpPage() {
  return <PublicHelpLocalePage />;
}
