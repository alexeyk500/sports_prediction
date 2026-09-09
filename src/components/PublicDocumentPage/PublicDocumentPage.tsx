import type React from "react";
import Age18Icon from "@/assets/icons/Age18Icon";
import ChevronDownIcon from "@/assets/icons/ChevronDownIcon";
import FileTextIcon from "@/assets/icons/FileTextIcon";
import FreeParticipationIcon from "@/assets/icons/FreeParticipationIcon";
import NoMonetaryValueIcon from "@/assets/icons/NoMonetaryValueIcon";
import NoWageringIcon from "@/assets/icons/NoWageringIcon";
import RegionalRestrictionsIcon from "@/assets/icons/RegionalRestrictionsIcon";
import ShieldIcon from "@/assets/icons/ShieldIcon";
import TermsSummaryCheckIcon from "@/assets/icons/TermsSummaryCheckIcon";
import TermsSummaryTrophyIcon from "@/assets/icons/TermsSummaryTrophyIcon";
import TermsSummaryXIcon from "@/assets/icons/TermsSummaryXIcon";
import type {
  IPublicDocument,
  PublicDocBlock,
} from "@/content/public-docs/public-doc-types";
import PublicPageShell from "@/components/PublicPageShell/PublicPageShell";
import styles from "./PublicDocumentPage.module.css";

interface IPublicDocumentPageProps {
  document: IPublicDocument;
}

const beforeYouPlayItems = [
  {
    label: "18+ only",
    lines: ["18+", "only"],
    tone: "neutral",
    icon: Age18Icon,
  },
  {
    label: "Free participation",
    lines: ["Free", "participation"],
    tone: "positive",
    icon: FreeParticipationIcon,
  },
  {
    label: "No wagering",
    lines: ["No", "wagering"],
    tone: "restrictive",
    icon: NoWageringIcon,
  },
  {
    label: "Cups have no monetary value",
    lines: ["Cups have", "no monetary", "value"],
    tone: "informational",
    icon: NoMonetaryValueIcon,
  },
  {
    label: "Prize Cups may have regional restrictions",
    lines: ["Prize Cups", "may have", "regional", "restrictions"],
    tone: "caution",
    icon: RegionalRestrictionsIcon,
  },
];

const cupsPositive = [
  "Earned through play",
  "Used for rankings",
  "Help you compete",
];
const cupsNegative = [
  "Cannot be purchased",
  "Cannot be transferred",
  "Cannot be withdrawn",
  "No monetary value",
];

const PublicDocumentPage: React.FC<IPublicDocumentPageProps> = ({
  document,
}) => {
  const isTerms = document.slug === "terms";

  return (
    <PublicPageShell>
      <article className={styles.document}>
        <div className={styles.hero}>
          <p className={styles.eyebrow}>{document.eyebrow}</p>
          <h1>{document.title}</h1>
          <p className={styles.subtitle}>{document.subtitle}</p>
          <p className={styles.meta}>
            <span>{document.version}</span>
            <span aria-hidden="true">·</span>
            <span>{document.lastUpdatedLabel}</span>
          </p>
        </div>

        <details className={styles.contents}>
          <summary>
            <FileTextIcon />
            <span>Contents</span>
            <ChevronDownIcon className={styles.contentsChevron} />
          </summary>
          <ol>
            {document.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.title}</a>
              </li>
            ))}
          </ol>
        </details>

        <div className={styles.intro}>
          {document.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {!isTerms ? (
          <div className={styles.calloutGrid} aria-label="Privacy highlights">
            <HighlightCard
              tone="privacy"
              title="Your Telegram privacy"
              text="Goalstery does not request access to your Telegram messages, contacts or phone number."
              icon={<ShieldIcon />}
            />
            <HighlightCard
              tone="security"
              title="Crypto safety"
              text="We will never ask for your seed phrase, private key or wallet password."
              icon={<ShieldIcon />}
            />
          </div>
        ) : null}

        {isTerms ? (
          <>
            <section
              className={styles.beforePlay}
              aria-labelledby="before-you-play"
            >
              <h2 id="before-you-play">Before you play</h2>
              <p>A quick overview of the key rules.</p>
              <div className={styles.beforePlayList}>
                {beforeYouPlayItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <span key={item.label} data-tone={item.tone}>
                      <Icon className={styles.beforePlayIcon} />
                      <span aria-label={item.label}>
                        {item.lines.map((line) => (
                          <span key={line}>{line}</span>
                        ))}
                      </span>
                    </span>
                  );
                })}
              </div>
            </section>
            <section
              className={styles.cupsSummary}
              aria-labelledby="cups-summary"
            >
              <div className={styles.cupsHeader}>
                <TermsSummaryTrophyIcon className={styles.summaryIcon} />
                <div>
                  <h2 id="cups-summary">Cups</h2>
                  <p>Goalstery scoring points</p>
                </div>
              </div>
              <div className={styles.cupsColumns}>
                <ul>
                  {cupsPositive.map((item) => (
                    <li key={item} data-kind="positive">
                      <TermsSummaryCheckIcon />
                      {item}
                    </li>
                  ))}
                </ul>
                <ul>
                  {cupsNegative.map((item) => (
                    <li key={item} data-kind="negative">
                      <TermsSummaryXIcon />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        ) : null}

        <div className={styles.sections}>
          {document.sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className={styles.section}
            >
              <div className={styles.sectionHeading}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h2>{section.title}</h2>
              </div>
              <div className={styles.body}>
                {section.blocks.map((block, blockIndex) => (
                  <Block key={`${section.id}-${blockIndex}`} block={block} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </PublicPageShell>
  );
};

interface IHighlightCardProps {
  tone: "privacy" | "security";
  title: string;
  text: string;
  icon: React.ReactNode;
}

const HighlightCard: React.FC<IHighlightCardProps> = ({
  tone,
  title,
  text,
  icon,
}) => (
  <section className={styles.highlight} data-tone={tone}>
    <span className={styles.highlightIcon}>{icon}</span>
    <span>
      <strong>{title}</strong>
      <span>{text}</span>
    </span>
  </section>
);

interface IBlockProps {
  block: PublicDocBlock;
}

const Block: React.FC<IBlockProps> = ({ block }) => {
  if (block.kind === "list") {
    return (
      <ul>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  if (block.kind === "callout") {
    return (
      <aside className={styles.inlineCallout} data-tone={block.tone}>
        {block.text}
      </aside>
    );
  }

  return <p>{block.text}</p>;
};

export default PublicDocumentPage;
