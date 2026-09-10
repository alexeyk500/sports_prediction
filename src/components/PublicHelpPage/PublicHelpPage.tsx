import type React from "react";
import Link from "next/link";
import ChevronDownIcon from "@/assets/icons/ChevronDownIcon";
import FootballIcon from "@/assets/icons/FootballIcon";
import LeaderboardIcon from "@/assets/icons/LeaderboardIcon";
import TelegramIcon from "@/assets/icons/TelegramIcon";
import TrophyOutlineIcon from "@/assets/icons/TrophyOutlineIcon";
import UserIcon from "@/assets/icons/UserIcon";
import PublicPageShell from "@/components/PublicPageShell/PublicPageShell";
import type {
  IHelpCategory,
  IHelpContent,
  IHelpQuestion,
} from "@/content/public-docs/public-doc-types";
import { directionForLocale, type SupportedLocale } from "@/lib/i18n/locales";
import { supportDestination } from "@/content/public-docs/support-destination";
import styles from "./PublicHelpPage.module.css";

interface IPublicHelpPageProps {
  content: IHelpContent;
  locale: SupportedLocale;
}

const PublicHelpPage: React.FC<IPublicHelpPageProps> = ({
  content,
  locale,
}) => (
  <PublicPageShell>
    <div className={styles.page} lang={locale} dir={directionForLocale(locale)}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p>{content.subtitle}</p>
      </header>

      <nav
        className={styles.categoryGrid}
        aria-label={content.categoriesAriaLabel}
      >
        {content.categories.map((category) => (
          <a
            key={category.id}
            href={`#${category.id}`}
            className={styles.categoryCard}
          >
            <CategoryIcon category={category} />
            <span>
              <strong>{category.title}</strong>
              <span>{category.description}</span>
            </span>
          </a>
        ))}
      </nav>

      <section className={styles.popular} aria-labelledby="popular-questions">
        <div className={styles.sectionTitle}>
          <h2 id="popular-questions">{content.popularQuestionsTitle}</h2>
        </div>
        <div className={styles.faqList}>
          {content.popularQuestions.map((question) => (
            <FaqItem key={question.id} question={question} />
          ))}
        </div>
      </section>

      <SupportCta content={content} />

      <div className={styles.sections}>
        {[...content.categories, ...content.additionalSections].map(
          (category) => (
            <section
              key={category.id}
              id={category.id}
              className={styles.helpSection}
            >
              <div className={styles.helpSectionHeader}>
                <CategoryIcon category={category} />
                <span>
                  <h2>{category.title}</h2>
                  <p>{category.description}</p>
                </span>
              </div>
              <div className={styles.faqList}>
                {category.questions.map((question) => (
                  <FaqItem key={question.id} question={question} />
                ))}
              </div>
            </section>
          ),
        )}
      </div>

      <footer className={styles.footer}>
        <Link href="/privacy">{content.privacyLinkLabel}</Link>
        <span aria-hidden="true">·</span>
        <Link href="/terms">{content.termsLinkLabel}</Link>
      </footer>
    </div>
  </PublicPageShell>
);

interface ICategoryIconProps {
  category: IHelpCategory;
}

const CategoryIcon: React.FC<ICategoryIconProps> = ({ category }) => {
  if (category.icon === "predictions") {
    return <FootballIcon className={styles.categoryIcon} />;
  }

  if (category.icon === "cups") {
    return <TrophyOutlineIcon className={styles.categoryIcon} />;
  }

  if (category.icon === "leaderboard") {
    return <LeaderboardIcon className={styles.categoryIcon} />;
  }

  return <UserIcon className={styles.categoryIcon} />;
};

interface IFaqItemProps {
  question: IHelpQuestion;
}

const FaqItem: React.FC<IFaqItemProps> = ({ question }) => (
  <details className={styles.faqItem}>
    <summary>
      <span>{question.question}</span>
      <ChevronDownIcon />
    </summary>
    <div>
      {question.answer.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {question.supportLink && supportDestination.telegramUrl ? (
        <a
          className={styles.inlineSupportLink}
          href={supportDestination.telegramUrl}
          target="_blank"
          rel="noreferrer noopener"
        >
          <bdi>{supportDestination.displayUsername}</bdi>
        </a>
      ) : null}
    </div>
  </details>
);

interface ISupportCtaProps {
  content: IHelpContent;
}

const SupportCta: React.FC<ISupportCtaProps> = ({ content }) => (
  <section className={styles.supportCta} aria-labelledby="support-cta-title">
    <span className={styles.telegramBadge} aria-hidden="true">
      <TelegramIcon />
    </span>
    <div>
      <h2 id="support-cta-title">{content.supportTitle}</h2>
      <p>{content.supportDescription}</p>
    </div>
    {supportDestination.telegramUrl ? (
      <a
        className={styles.supportButton}
        href={supportDestination.telegramUrl}
        target="_blank"
        rel="noreferrer noopener"
      >
        {content.supportButtonLabel}
      </a>
    ) : (
      <p className={styles.supportUnavailable}>{content.supportUnavailable}</p>
    )}
  </section>
);

export default PublicHelpPage;
