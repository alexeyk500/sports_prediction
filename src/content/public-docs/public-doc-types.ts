export type PublicDocBlock =
  | {
      kind: "paragraph";
      text: string;
      supportLink?: boolean;
    }
  | {
      kind: "list";
      items: string[];
    }
  | {
      kind: "callout";
      text: string;
      tone: "privacy" | "security" | "info";
      supportLink?: boolean;
    };

export interface IPublicDocSection {
  id: string;
  title: string;
  blocks: PublicDocBlock[];
}

export interface IPublicDocumentHighlight {
  tone: "privacy" | "security";
  title: string;
  text: string;
}

export interface IPublicDocument {
  slug: "privacy" | "terms";
  eyebrow: string;
  title: string;
  subtitle: string;
  version: string;
  lastUpdatedLabel: string;
  contentsLabel: string;
  authoritativeNotice: string | null;
  intro: string[];
  highlightsAriaLabel?: string;
  highlights?: IPublicDocumentHighlight[];
  sections: IPublicDocSection[];
}

export interface IHelpQuestion {
  id: string;
  question: string;
  answer: string[];
  supportLink?: boolean;
}

export interface IHelpCategory {
  id: string;
  title: string;
  description: string;
  icon: "predictions" | "cups" | "leaderboard" | "account";
  questions: IHelpQuestion[];
}

export interface IHelpContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  categoriesAriaLabel: string;
  popularQuestionsTitle: string;
  supportTitle: string;
  supportDescription: string;
  supportButtonLabel: string;
  supportUnavailable: string;
  privacyLinkLabel: string;
  termsLinkLabel: string;
  popularQuestions: IHelpQuestion[];
  categories: IHelpCategory[];
  additionalSections: IHelpCategory[];
}

export interface ITermsSummaryFact {
  label: string;
  lines: string[];
  tone: "neutral" | "positive" | "restrictive" | "informational" | "caution";
}

export interface ITermsSummaryContent {
  beforeTitle: string;
  beforeSubtitle: string;
  facts: ITermsSummaryFact[];
  cupsTitle: string;
  cupsSubtitle: string;
  positiveRules: string[];
  negativeRules: string[];
}

export interface IPublicDocsLocaleContent {
  help: IHelpContent;
  privacy: IPublicDocument;
  terms: IPublicDocument;
  termsSummary: ITermsSummaryContent;
}
