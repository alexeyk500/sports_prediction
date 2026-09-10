import type { Metadata } from "next";
import PublicPrivacyLocalePage from "@/components/PublicDocsLocalePages/PublicPrivacyLocalePage";

export const metadata: Metadata = {
  title: "Privacy Policy | Goalstery",
  description: "How Goalstery handles information in the Telegram Mini App.",
};

export default function PrivacyPage() {
  return <PublicPrivacyLocalePage />;
}
