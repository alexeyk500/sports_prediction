import type { Metadata } from "next";
import PublicDocumentPage from "@/components/PublicDocumentPage/PublicDocumentPage";
import { termsOfUse } from "@/content/public-docs/terms-of-use";

export const metadata: Metadata = {
  title: "Terms of Use | Goalstery",
  description: "The rules for using Goalstery, competitions, Cups and prizes.",
};

export default function TermsPage() {
  return <PublicDocumentPage document={termsOfUse} />;
}
