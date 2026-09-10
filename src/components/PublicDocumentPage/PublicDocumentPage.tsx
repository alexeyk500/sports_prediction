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
  IPublicDocumentHighlight,
  ITermsSummaryContent,
  PublicDocBlock,
} from "@/content/public-docs/public-doc-types";
import { supportDestination } from "@/content/public-docs/support-destination";
import { directionForLocale, type SupportedLocale } from "@/lib/i18n/locales";
import PublicPageShell from "@/components/PublicPageShell/PublicPageShell";
import styles from "./PublicDocumentPage.module.css";

interface IPublicDocumentPageProps {
  document: IPublicDocument;
  locale: SupportedLocale;
  termsSummary?: ITermsSummaryContent;
}

const beforeYouPlayIcons = [
  Age18Icon,
  FreeParticipationIcon,
  NoWageringIcon,
  NoMonetaryValueIcon,
  RegionalRestrictionsIcon,
] as const;

const PublicDocumentPage: React.FC<IPublicDocumentPageProps> = ({
  document,
  locale,
  termsSummary,
}) => {
  const isTerms = document.slug === "terms";
  const direction = directionForLocale(locale);

  return (
    <PublicPageShell>
      <article className={styles.document} lang={locale} dir={direction}>
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
            <span>{document.contentsLabel}</span>
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
          {document.authoritativeNotice ? (
            <aside className={styles.authoritativeNotice}>
              {document.authoritativeNotice}
            </aside>
          ) : null}
          {document.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {document.highlights ? (
          <div
            className={styles.calloutGrid}
            aria-label={document.highlightsAriaLabel}
          >
            {document.highlights.map((highlight) => (
              <HighlightCard key={highlight.title} highlight={highlight} />
            ))}
          </div>
        ) : null}

        {isTerms ? (
          <>
            <section
              className={styles.beforePlay}
              aria-labelledby="before-you-play"
            >
              <h2 id="before-you-play">{termsSummary?.beforeTitle}</h2>
              <p>{termsSummary?.beforeSubtitle}</p>
              <div className={styles.beforePlayList}>
                {termsSummary?.facts.map((item, index) => {
                  const Icon = beforeYouPlayIcons[index];

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
                  <h2 id="cups-summary">{termsSummary?.cupsTitle}</h2>
                  <p>{termsSummary?.cupsSubtitle}</p>
                </div>
              </div>
              <div className={styles.cupsColumns}>
                <ul>
                  {termsSummary?.positiveRules.map((item) => (
                    <li key={item} data-kind="positive">
                      <TermsSummaryCheckIcon />
                      {item}
                    </li>
                  ))}
                </ul>
                <ul>
                  {termsSummary?.negativeRules.map((item) => (
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
  highlight: IPublicDocumentHighlight;
}

const HighlightCard: React.FC<IHighlightCardProps> = ({ highlight }) => (
  <section className={styles.highlight} data-tone={highlight.tone}>
    <span className={styles.highlightIcon}>
      <ShieldIcon />
    </span>
    <span>
      <strong>{highlight.title}</strong>
      <span>{highlight.text}</span>
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

  return (
    <p>
      {block.text}
      {block.supportLink && supportDestination.telegramUrl ? (
        <>
          {" "}
          <a
            className={styles.inlineSupportLink}
            href={supportDestination.telegramUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            <bdi>{supportDestination.displayUsername}</bdi>
          </a>
        </>
      ) : null}
    </p>
  );
};

export default PublicDocumentPage;
