export type PublicDocBlock =
  | {
      kind: "paragraph";
      text: string;
    }
  | {
      kind: "list";
      items: string[];
    }
  | {
      kind: "callout";
      text: string;
      tone: "privacy" | "security" | "info";
    };

export interface IPublicDocSection {
  id: string;
  title: string;
  blocks: PublicDocBlock[];
}

export interface IPublicDocument {
  slug: "privacy" | "terms";
  eyebrow: string;
  title: string;
  subtitle: string;
  version: string;
  lastUpdatedLabel: string;
  intro: string[];
  sections: IPublicDocSection[];
}

export interface IHelpQuestion {
  id: string;
  question: string;
  answer: string[];
}

export interface IHelpCategory {
  id: string;
  title: string;
  description: string;
  icon: "predictions" | "cups" | "leaderboard" | "account";
  questions: IHelpQuestion[];
}
