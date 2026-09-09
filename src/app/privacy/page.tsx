import type { Metadata } from "next";
import PublicDocumentPage from "@/components/PublicDocumentPage/PublicDocumentPage";
import { privacyPolicy } from "@/content/public-docs/privacy-policy";

export const metadata: Metadata = {
  title: "Privacy Policy | Goalstery",
  description: "How Goalstery handles information in the Telegram Mini App.",
};

export default function PrivacyPage() {
  return <PublicDocumentPage document={privacyPolicy} />;
}
