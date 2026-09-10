import type { Metadata } from "next";
import PublicTermsLocalePage from "@/components/PublicDocsLocalePages/PublicTermsLocalePage";

export const metadata: Metadata = {
  title: "Terms of Use | Goalstery",
  description: "The rules for using Goalstery, competitions, Cups and prizes.",
};

export default function TermsPage() {
  return <PublicTermsLocalePage />;
}
