import {
  additionalHelpSections,
  helpCategories,
  popularHelpQuestions,
} from "./help-support";
import { privacyPolicy } from "./privacy-policy";
import type {
  IHelpCategory,
  IHelpContent,
  IHelpQuestion,
  IPublicDocsLocaleContent,
  IPublicDocument,
  ITermsSummaryContent,
  PublicDocBlock,
} from "./public-doc-types";
import { termsOfUse } from "./terms-of-use";
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from "@/lib/i18n/locales";

type TranslatedLocale = Exclude<SupportedLocale, "en">;

interface IHelpLocaleText {
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
  categories: Record<string, { title: string; description: string }>;
  questions: Record<string, { question: string; answer: string[] }>;
}

interface ILegalLocaleText {
  eyebrow: string;
  title: string;
  subtitle: string;
  version: string;
  lastUpdatedLabel: string;
  contentsLabel: string;
  authoritativeNotice: string;
  intro: string[];
  highlightsAriaLabel?: string;
  highlights?: IPublicDocument["highlights"];
  sections: Record<string, { title: string; blocks: Array<string | string[]> }>;
}

const enTermsSummary: ITermsSummaryContent = {
  beforeTitle: "Before you play",
  beforeSubtitle: "A quick overview of the key rules.",
  facts: [
    { label: "18+ only", lines: ["18+", "only"], tone: "neutral" },
    {
      label: "Free participation",
      lines: ["Free", "participation"],
      tone: "positive",
    },
    { label: "No wagering", lines: ["No", "wagering"], tone: "restrictive" },
    {
      label: "Cups have no monetary value",
      lines: ["Cups have", "no monetary", "value"],
      tone: "informational",
    },
    {
      label: "Prize Cups may have regional restrictions",
      lines: ["Prize Cups", "may have", "regional", "restrictions"],
      tone: "caution",
    },
  ],
  cupsTitle: "Cups",
  cupsSubtitle: "Goalstery scoring points",
  positiveRules: [
    "Earned through play",
    "Used for rankings",
    "Help you compete",
  ],
  negativeRules: [
    "Cannot be purchased",
    "Cannot be transferred",
    "Cannot be withdrawn",
    "No monetary value",
  ],
};

const enHelp: IHelpContent = {
  eyebrow: "SUPPORT & LEGAL",
  title: "Help & Support",
  subtitle: "How can we help you?",
  categoriesAriaLabel: "Help categories",
  popularQuestionsTitle: "Popular questions",
  supportTitle: "Need more help?",
  supportDescription:
    "Contact the Goalstery support team through the official Telegram support account shown inside Goalstery.",
  supportButtonLabel: "Contact Support",
  supportUnavailable:
    "Official support account is not configured yet. Use only the support account identified inside Goalstery.",
  privacyLinkLabel: "Privacy Policy",
  termsLinkLabel: "Terms of Use",
  popularQuestions: popularHelpQuestions,
  categories: helpCategories,
  additionalSections: additionalHelpSections,
};

export function resolvePublicDocsLocaleContent(
  locale: unknown,
  registry: Partial<
    Record<SupportedLocale, IPublicDocsLocaleContent>
  > = publicDocsByLocale,
): IPublicDocsLocaleContent {
  const resolvedLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;

  return (
    registry[resolvedLocale] ??
    registry[DEFAULT_LOCALE] ??
    publicDocsByLocale.en
  );
}

function localizeHelp(locale: TranslatedLocale): IHelpContent {
  const text = helpTextByLocale[locale];

  return {
    eyebrow: text.eyebrow,
    title: text.title,
    subtitle: text.subtitle,
    categoriesAriaLabel: text.categoriesAriaLabel,
    popularQuestionsTitle: text.popularQuestionsTitle,
    supportTitle: text.supportTitle,
    supportDescription: text.supportDescription,
    supportButtonLabel: text.supportButtonLabel,
    supportUnavailable: text.supportUnavailable,
    privacyLinkLabel: text.privacyLinkLabel,
    termsLinkLabel: text.termsLinkLabel,
    popularQuestions: popularHelpQuestions.map((question) =>
      localizeQuestion(question, text),
    ),
    categories: helpCategories.map((category) =>
      localizeCategory(category, text),
    ),
    additionalSections: additionalHelpSections.map((category) =>
      localizeCategory(category, text),
    ),
  };
}

function localizeCategory(
  category: IHelpCategory,
  text: IHelpLocaleText,
): IHelpCategory {
  const categoryText = text.categories[category.id];

  return {
    ...category,
    title: categoryText.title,
    description: categoryText.description,
    questions: category.questions.map((question) =>
      localizeQuestion(question, text),
    ),
  };
}

function localizeQuestion(
  question: IHelpQuestion,
  text: IHelpLocaleText,
): IHelpQuestion {
  const questionText = text.questions[question.id];

  return {
    ...question,
    question: questionText.question,
    answer: questionText.answer,
  };
}

function localizeLegalDocument(
  document: IPublicDocument,
  text: ILegalLocaleText,
): IPublicDocument {
  return {
    ...document,
    eyebrow: text.eyebrow,
    title: text.title,
    subtitle: text.subtitle,
    version: text.version,
    lastUpdatedLabel: text.lastUpdatedLabel,
    contentsLabel: text.contentsLabel,
    authoritativeNotice: text.authoritativeNotice,
    intro: text.intro,
    highlightsAriaLabel: text.highlightsAriaLabel,
    highlights: text.highlights,
    sections: document.sections.map((section) => {
      const sectionText = text.sections[section.id] ?? {
        title: section.title,
        blocks: section.blocks.map((block) =>
          block.kind === "list" ? block.items : block.text,
        ),
      };

      return {
        ...section,
        title: sectionText.title,
        blocks: section.blocks.map((block, index) =>
          localizeLegalBlock(block, sectionText.blocks[index]),
        ),
      };
    }),
  };
}

function localizeLegalBlock(
  block: PublicDocBlock,
  translated: string | string[],
): PublicDocBlock {
  if (block.kind === "list") {
    return { ...block, items: translated as string[] };
  }

  return { ...block, text: translated as string };
}

const termsSummaryByLocale: Record<TranslatedLocale, ITermsSummaryContent> = {
  ru: {
    beforeTitle: "Перед игрой",
    beforeSubtitle: "Краткий обзор ключевых правил.",
    facts: [
      { label: "Только 18+", lines: ["Только", "18+"], tone: "neutral" },
      {
        label: "Бесплатное участие",
        lines: ["Бесплатное", "участие"],
        tone: "positive",
      },
      { label: "Без ставок", lines: ["Без", "ставок"], tone: "restrictive" },
      {
        label: "Cups не имеют денежной стоимости",
        lines: ["Cups", "без денежной", "стоимости"],
        tone: "informational",
      },
      {
        label: "Для Prize Cups могут действовать региональные ограничения",
        lines: ["Prize Cups", "могут иметь", "региональные", "ограничения"],
        tone: "caution",
      },
    ],
    cupsTitle: "Cups",
    cupsSubtitle: "Очки Goalstery",
    positiveRules: [
      "Зарабатываются в игре",
      "Используются для рейтингов",
      "Помогают соревноваться",
    ],
    negativeRules: [
      "Нельзя купить",
      "Нельзя передать",
      "Нельзя вывести",
      "Нет денежной стоимости",
    ],
  },
  de: {
    beforeTitle: "Bevor du spielst",
    beforeSubtitle: "Ein kurzer Überblick über die wichtigsten Regeln.",
    facts: [
      { label: "Nur ab 18", lines: ["Nur", "ab 18"], tone: "neutral" },
      {
        label: "Kostenlose Teilnahme",
        lines: ["Kostenlose", "Teilnahme"],
        tone: "positive",
      },
      {
        label: "Keine Wetten",
        lines: ["Keine", "Wetten"],
        tone: "restrictive",
      },
      {
        label: "Cups haben keinen Geldwert",
        lines: ["Cups", "ohne", "Geldwert"],
        tone: "informational",
      },
      {
        label: "Prize Cups können regionale Beschränkungen haben",
        lines: ["Prize Cups", "können", "regional", "begrenzt sein"],
        tone: "caution",
      },
    ],
    cupsTitle: "Cups",
    cupsSubtitle: "Goalstery-Punkte",
    positiveRules: [
      "Durch Spielen verdient",
      "Für Ranglisten genutzt",
      "Helfen beim Wettbewerb",
    ],
    negativeRules: [
      "Nicht kaufbar",
      "Nicht übertragbar",
      "Nicht auszahlbar",
      "Kein Geldwert",
    ],
  },
  es: {
    beforeTitle: "Antes de jugar",
    beforeSubtitle: "Un resumen breve de las reglas clave.",
    facts: [
      { label: "Solo 18+", lines: ["Solo", "18+"], tone: "neutral" },
      {
        label: "Participación gratuita",
        lines: ["Participación", "gratuita"],
        tone: "positive",
      },
      {
        label: "Sin apuestas",
        lines: ["Sin", "apuestas"],
        tone: "restrictive",
      },
      {
        label: "Los Cups no tienen valor monetario",
        lines: ["Cups sin", "valor", "monetario"],
        tone: "informational",
      },
      {
        label: "Los Prize Cups pueden tener restricciones regionales",
        lines: ["Prize Cups", "pueden tener", "restricciones", "regionales"],
        tone: "caution",
      },
    ],
    cupsTitle: "Cups",
    cupsSubtitle: "Puntos de Goalstery",
    positiveRules: [
      "Se ganan jugando",
      "Se usan en rankings",
      "Ayudan a competir",
    ],
    negativeRules: [
      "No se pueden comprar",
      "No se pueden transferir",
      "No se pueden retirar",
      "Sin valor monetario",
    ],
  },
  ar: {
    beforeTitle: "قبل اللعب",
    beforeSubtitle: "نظرة سريعة على القواعد الأساسية.",
    facts: [
      { label: "لمن يبلغ 18+ فقط", lines: ["18+", "فقط"], tone: "neutral" },
      {
        label: "مشاركة مجانية",
        lines: ["مشاركة", "مجانية"],
        tone: "positive",
      },
      { label: "لا مراهنات", lines: ["لا", "مراهنات"], tone: "restrictive" },
      {
        label: "لا تملك Cups قيمة مالية",
        lines: ["Cups", "بلا قيمة", "مالية"],
        tone: "informational",
      },
      {
        label: "قد تخضع Prize Cups لقيود إقليمية",
        lines: ["Prize Cups", "قد تخضع", "لقيود", "إقليمية"],
        tone: "caution",
      },
    ],
    cupsTitle: "Cups",
    cupsSubtitle: "نقاط Goalstery",
    positiveRules: [
      "تكتسب من اللعب",
      "تستخدم في التصنيفات",
      "تساعدك على المنافسة",
    ],
    negativeRules: [
      "لا يمكن شراؤها",
      "لا يمكن نقلها",
      "لا يمكن سحبها",
      "لا قيمة مالية لها",
    ],
  },
};

const helpTextByLocale: Record<TranslatedLocale, IHelpLocaleText> = {
  ru: {
    eyebrow: "ПОДДЕРЖКА И ДОКУМЕНТЫ",
    title: "Помощь и поддержка",
    subtitle: "Чем мы можем помочь?",
    categoriesAriaLabel: "Разделы помощи",
    popularQuestionsTitle: "Популярные вопросы",
    supportTitle: "Нужна помощь?",
    supportDescription:
      "Свяжитесь с командой поддержки Goalstery через официальный аккаунт поддержки в Telegram, указанный внутри Goalstery.",
    supportButtonLabel: "Связаться с поддержкой",
    supportUnavailable:
      "Официальный аккаунт поддержки пока не настроен. Используйте только аккаунт поддержки, указанный внутри Goalstery.",
    privacyLinkLabel: "Политика конфиденциальности",
    termsLinkLabel: "Условия использования",
    categories: {
      predictions: {
        title: "Прогнозы",
        description: "Как работают прогнозы, дедлайны и подсчёт",
      },
      cups: {
        title: "Cups",
        description: "Очки, соревнования и Prize Cups",
      },
      leaderboard: {
        title: "Лидерборд",
        description: "Рейтинги, результаты и пересчёты",
      },
      account: {
        title: "Аккаунт",
        description: "Профиль, настройки и управление аккаунтом",
      },
      "fair-play": {
        title: "Честная игра",
        description: "Разрешённый анализ и запрещённые злоупотребления",
      },
      "match-data": {
        title: "Данные матчей",
        description: "Спортивные данные, исправления и расчёт",
      },
      "privacy-security": {
        title: "Конфиденциальность и безопасность",
        description: "Трекинг, реклама и безопасность аккаунта",
      },
      troubleshooting: {
        title: "Устранение проблем",
        description: "Ожидающие прогнозы, рейтинги и доступ",
      },
    },
    questions: {
      "how-predictions-work": {
        question: "Как работают прогнозы?",
        answer: [
          "Goalstery позволяет делать прогнозы на футбольные матчи. Доступные типы прогнозов могут отличаться в зависимости от матча и иметь разную сложность и награду в Cups.",
          "Выберите доступный матч, сделайте прогноз и отправьте его до дедлайна. Goalstery сохраняет отправленный прогноз и позже оценивает его по рассчитанному результату матча.",
        ],
      },
      "prediction-lock": {
        question: "Когда прогноз блокируется?",
        answer: [
          "У каждого прогноза есть дедлайн. После дедлайна или иной блокировки Goalstery изменить такой прогноз уже нельзя.",
        ],
      },
      "cups-calculated": {
        question: "Как начисляются Cups?",
        answer: [
          "Правильные прогнозы дают Cups по правилам подсчёта, применимым к конкретному прогнозу. Разные типы прогнозов могут иметь разные значения награды, и применимая награда должна показываться до отправки.",
        ],
      },
      "postponed-match": {
        question: "Что происходит, если матч перенесён?",
        answer: [
          "Если матч перенесён, отменён, прерван, приостановлен или иначе не имеет результата, пригодного для расчёта, затронутые прогнозы могут оставаться в ожидании, пока Goalstery не определит, что данных достаточно для расчёта или нужно другое решение.",
        ],
      },
      "real-prizes": {
        question: "Можно ли выиграть реальные призы?",
        answer: [
          "Некоторые Cups в Goalstery могут предлагать отдельно объявленные реальные призы, включая криптовалютные призы, такие как USDT или GRAM. Не каждый Cup имеет реальный приз, а доступность Goalstery не гарантирует право участия в каждом Prize Cup.",
        ],
      },
      "contact-support": {
        question: "Как связаться с поддержкой?",
        answer: [
          "Свяжитесь с командой поддержки Goalstery через официальный аккаунт поддержки в Telegram, указанный внутри Goalstery. Используйте только этот аккаунт, чтобы избежать мошеннических аккаунтов поддержки.",
        ],
      },
      "after-match": {
        question: "Что происходит после матча?",
        answer: [
          "Когда у Goalstery появляется достаточно информации о результате матча, прогноз оценивается. В зависимости от типа прогноза и результата он может быть отмечен как правильный, неправильный или оставаться в ожидании, пока матч не разрешён.",
          "Правильные прогнозы дают Cups по правилам подсчёта, применимым к этому прогнозу.",
        ],
      },
      "settled-change": {
        question: "Может ли рассчитанный прогноз измениться позже?",
        answer: [
          "В необычных случаях — да. Поставщики данных или официальные соревнования могут исправить ранее опубликованную информацию, также возможны технические ошибки или ошибки расчёта.",
          "Когда это нужно для точности результатов и целостности соревнования, Goalstery может исправить расчёт и пересчитать затронутые прогнозы, Cups, рейтинги или результаты соревнований.",
        ],
      },
      "what-are-cups": {
        question: "Что такое Cups?",
        answer: [
          "Cups — это игровые очки Goalstery. Вы получаете Cups за игру, включая правильные прогнозы.",
          "Cups используются для оценки результата и позиций в рейтингах Goalstery.",
        ],
      },
      "cups-money-value": {
        question: "Есть ли у Cups денежная стоимость?",
        answer: [
          "Нет. Cups нельзя покупать, продавать, выводить, передавать другому пользователю или обменивать на деньги, криптовалюту, товары или услуги.",
          "Cups — только внутриигровой механизм подсчёта и не являются криптовалютой, токенами, деньгами, хранимой стоимостью или финансовым балансом.",
        ],
      },
      "free-prize-cups": {
        question: "Нужно ли платить за участие в Prize Cup?",
        answer: [
          "Нет. Участие в Prize Cups Goalstery бесплатное. Goalstery не требует вступительный взнос деньгами, криптовалютой, Telegram Stars, Cups или другой ценностью.",
        ],
      },
      "claim-crypto-prize": {
        question: "Как получить криптовалютный приз?",
        answer: [
          "Если вы выиграли подходящий криптовалютный приз, вас могут попросить связаться с официальным аккаунтом поддержки Goalstery в Telegram и предоставить совместимый публичный адрес криптовалютного кошелька для ручной отправки приза.",
          "Всегда внимательно проверяйте адрес кошелька и сеть перед отправкой. Blockchain-транзакции могут быть необратимыми.",
        ],
      },
      "wallet-secrets": {
        question: "Попросит ли Goalstery seed phrase или private key?",
        answer: [
          "Нет. Goalstery никогда не требует seed phrase, private key, wallet password или похожие секретные данные для отправки приза.",
          "Для криптовалютной выплаты Goalstery нужен только подходящий публичный адрес кошелька и информация, разумно необходимая для проверки требования приза.",
        ],
      },
      "leaderboard-work": {
        question: "Как работает лидерборд?",
        answer: [
          "Лидерборды Goalstery ранжируют игроков по применимым правилам соревнования и их результатам в Goalstery.",
          "В зависимости от экрана или соревнования Goalstery может показывать лидеров, игроков вокруг вашей позиции или более широкий список участников.",
        ],
      },
      "leaderboard-change": {
        question: "Почему моя позиция может измениться?",
        answer: [
          "Позиция может измениться после расчёта ваших прогнозов, расчёта прогнозов других игроков, появления результатов ожидающих матчей, исправления ошибки расчёта или пересчёта данных соревнования.",
        ],
      },
      "result-corrected": {
        question: "Что происходит, если результат исправлен?",
        answer: [
          "Goalstery может пересчитать затронутые Cups и рейтинги. Если исправление влияет на результат соревнования, позиции в лидерборде и определение победителя тоже могут измениться.",
        ],
      },
      "account-created": {
        question: "Как создаётся мой аккаунт Goalstery?",
        answer: [
          "Goalstery работает как Telegram Mini App. Ваш аккаунт Telegram используется для входа и идентификации, поэтому отдельный пароль Goalstery не нужен.",
        ],
      },
      "telegram-info": {
        question: "Какую информацию Telegram получает Goalstery?",
        answer: [
          "Goalstery может получать информацию, доступную через интерфейс Telegram Mini App и необходимую для идентификации и предоставления сервиса: Telegram user ID, username, display name, profile photo, language и похожие данные профиля.",
          "Goalstery не запрашивает доступ к сообщениям Telegram, контактам или номеру телефона в рамках обычного использования.",
        ],
      },
      "multiple-accounts": {
        question: "Можно ли использовать несколько аккаунтов?",
        answer: [
          "Один аккаунт Telegram соответствует одному аккаунту Goalstery. Использовать несколько аккаунтов для нечестного преимущества, манипуляции соревнованиями или рейтингами, обхода ограничений или иных злоупотреблений Goalstery запрещено.",
        ],
      },
      "delete-account": {
        question: "Как удалить аккаунт Goalstery?",
        answer: [
          "Свяжитесь с официальным аккаунтом поддержки Goalstery в Telegram и запросите удаление аккаунта. Goalstery обработает запрос и удалит или анонимизирует связанные персональные данные, где это применимо.",
          "Некоторые исторические данные соревнований могут сохраняться в анонимизированном виде, если это нужно для целостности завершённых соревнований и лидербордов.",
        ],
      },
      "statistics-ai": {
        question: "Можно ли использовать статистику или AI для прогнозов?",
        answer: [
          "Да. Можно использовать футбольную статистику, исследования, математические модели, искусственный интеллект и другие аналитические инструменты, чтобы выбрать прогноз.",
        ],
      },
      "not-allowed": {
        question: "Что запрещено?",
        answer: [
          "Goalstery не допускает нечестного или злоупотребляющего взаимодействия с сервисом: автоматических ботов для отправки прогнозов, эксплуатации ошибок, манипуляций Cups, рейтингами, соревнованиями или лидербордами, мультиаккаунтинга для преимущества, обхода ограничений, вмешательства в API или инфраструктуру, подделки eligibility data или мошенничества.",
        ],
      },
      "rule-break": {
        question: "Что будет за нарушение правил?",
        answer: [
          "В зависимости от нарушения Goalstery может исправить затронутые результаты, признать прогнозы недействительными, скорректировать Cups или рейтинги, лишить права участия в соревновании или призе либо навсегда заблокировать аккаунт.",
        ],
      },
      "football-data": {
        question: "Откуда Goalstery получает футбольные данные?",
        answer: [
          "Goalstery может получать расписания, счёт, статус матчей и другую футбольную информацию от сторонних sports-data источников, включая football-data.org. Такие данные иногда задерживаются, бывают неполными или исправляются после публикации.",
        ],
      },
      "scoring-result": {
        question: "Какой результат Goalstery использует для подсчёта?",
        answer: [
          "Goalstery окончательно определяет данные матча, используемые для расчёта прогнозов и соревнований. При необходимости Goalstery может учитывать официальную информацию соревнований, sports-data providers и другие надёжные источники.",
        ],
      },
      tracking: {
        question: "Goalstery отслеживает меня?",
        answer: [
          "Goalstery сейчас не использует отдельную систему поведенческой аналитики или пользовательского трекинга. Некоторая техническая информация может обрабатываться Telegram, Cloudflare, серверной инфраструктурой Goalstery или другой инфраструктурой, нужной для доставки и защиты сервиса.",
        ],
      },
      advertising: {
        question: "Goalstery показывает рекламу?",
        answer: [
          "Goalstery может показывать рекламу. Если будут введены сторонние рекламные сервисы, у них могут быть собственные privacy practices, а Privacy Policy Goalstery будет обновлена, если практики существенно изменятся.",
        ],
      },
      "protect-account": {
        question: "Как защитить аккаунт?",
        answer: [
          "Защищайте свой аккаунт Telegram и не передавайте к нему доступ. Для криптовалютных призов никогда не раскрывайте seed phrase, private key, wallet password или authentication secrets. Goalstery не требует эти секреты для отправки приза.",
        ],
      },
      "prediction-pending": {
        question: "Мой прогноз всё ещё ожидает расчёта",
        answer: [
          "Прогноз может оставаться pending, пока Goalstery ждёт достаточную информацию о результате матча, особенно если матч перенесён, приостановлен, прерван, отменён или иначе не разрешён. Если вы считаете, что завершённый матч ошибочно остаётся pending, свяжитесь с поддержкой Goalstery.",
        ],
      },
      "cups-ranking-changed": {
        question: "Мои Cups или рейтинг изменились",
        answer: [
          "Cups и рейтинги могут меняться по мере расчёта прогнозов и получения результатов другими игроками. Они также могут измениться, если Goalstery исправляет неточные данные матча, расчёт, scoring или результаты соревнования.",
        ],
      },
      "settled-incorrectly": {
        question: "Мне кажется, мой прогноз рассчитан неверно",
        answer: [
          "Свяжитесь с поддержкой Goalstery и предоставьте достаточно информации, чтобы определить матч и прогноз. Goalstery может проверить расчёт и исправить его, если это уместно.",
        ],
      },
      "cannot-access-prize-cup": {
        question: "Я не могу открыть Prize Cup",
        answer: [
          "У конкретного Prize Cup могут быть eligibility или географические ограничения. Доступ к Goalstery сам по себе не гарантирует доступ к каждому Prize Cup. Если вы считаете, что должны иметь право участия, свяжитесь с поддержкой Goalstery.",
        ],
      },
    },
  },
  de: {
    eyebrow: "SUPPORT & RECHTLICHES",
    title: "Hilfe & Support",
    subtitle: "Wie können wir helfen?",
    categoriesAriaLabel: "Hilfekategorien",
    popularQuestionsTitle: "Häufige Fragen",
    supportTitle: "Brauchst du weitere Hilfe?",
    supportDescription:
      "Kontaktiere das Goalstery-Supportteam über das offizielle Telegram-Supportkonto, das in Goalstery angezeigt wird.",
    supportButtonLabel: "Support kontaktieren",
    supportUnavailable:
      "Das offizielle Supportkonto ist noch nicht konfiguriert. Nutze nur das in Goalstery angegebene Supportkonto.",
    privacyLinkLabel: "Datenschutzerklärung",
    termsLinkLabel: "Nutzungsbedingungen",
    categories: {
      predictions: {
        title: "Vorhersagen",
        description: "Funktionsweise, Fristen und Wertung",
      },
      cups: {
        title: "Cups",
        description: "Punkte, Wettbewerbe und Prize Cups",
      },
      leaderboard: {
        title: "Rangliste",
        description: "Platzierungen, Ergebnisse und Berechnungen",
      },
      account: {
        title: "Konto",
        description: "Profil, Einstellungen und Kontoverwaltung",
      },
      "fair-play": {
        title: "Fair Play",
        description: "Erlaubte Analyse und verbotener Missbrauch",
      },
      "match-data": {
        title: "Spieldaten",
        description: "Sportdaten, Korrekturen und Abrechnung",
      },
      "privacy-security": {
        title: "Datenschutz & Sicherheit",
        description: "Tracking, Werbung und Kontosicherheit",
      },
      troubleshooting: {
        title: "Fehlerbehebung",
        description: "Offene Vorhersagen, Ranglisten und Zugriff",
      },
    },
    questions: {
      "how-predictions-work": {
        question: "Wie funktionieren Vorhersagen?",
        answer: [
          "Goalstery lässt dich Vorhersagen zu Fußballspielen abgeben. Verfügbare Vorhersagetypen können je nach Spiel variieren und unterschiedliche Schwierigkeitsgrade sowie Cups-Belohnungen haben.",
          "Wähle ein verfügbares Spiel, gib deine Vorhersage ab und sende sie vor Ablauf der Frist. Goalstery speichert die Vorhersage und bewertet sie später anhand des festgestellten Spielergebnisses.",
        ],
      },
      "prediction-lock": {
        question: "Wann wird eine Vorhersage gesperrt?",
        answer: [
          "Jede Vorhersage hat eine Frist. Nach Ablauf der Frist oder nachdem Goalstery die Vorhersage anderweitig gesperrt hat, kannst du sie nicht mehr ändern.",
        ],
      },
      "cups-calculated": {
        question: "Wie werden Cups berechnet?",
        answer: [
          "Richtige Vorhersagen vergeben Cups nach den für diese Vorhersage geltenden Wertungsregeln. Vorhersagetypen können je nach Art oder Schwierigkeit unterschiedliche Werte haben, und die anwendbare Belohnung sollte vor dem Absenden angezeigt werden.",
        ],
      },
      "postponed-match": {
        question: "Was passiert, wenn ein Spiel verschoben wird?",
        answer: [
          "Wenn ein Spiel verschoben, abgesagt, abgebrochen, unterbrochen oder anderweitig nicht für die Abrechnung geeignet ist, können betroffene Vorhersagen offen bleiben, bis Goalstery feststellt, dass genügend Informationen für die Abrechnung vorliegen oder eine andere Lösung angemessen ist.",
        ],
      },
      "real-prizes": {
        question: "Kann ich echte Preise gewinnen?",
        answer: [
          "Einige Goalstery Cups können separat angekündigte reale Preise anbieten, einschließlich Kryptowährungspreisen wie USDT oder GRAM. Nicht jeder Cup hat einen realen Preis, und die Verfügbarkeit von Goalstery garantiert keine Teilnahmeberechtigung für jeden Prize Cup.",
        ],
      },
      "contact-support": {
        question: "Wie kontaktiere ich den Support?",
        answer: [
          "Kontaktiere das Goalstery-Supportteam über das offizielle Telegram-Supportkonto, das in Goalstery angezeigt wird. Nutze nur dieses Konto, um Nachahmung oder betrügerische Supportkonten zu vermeiden.",
        ],
      },
      "after-match": {
        question: "Was passiert nach dem Spiel?",
        answer: [
          "Sobald Goalstery ausreichende Informationen zum Spielergebnis hat, wird deine Vorhersage bewertet. Je nach Vorhersagetyp und Ergebnis kann sie als richtig, falsch oder weiterhin offen markiert werden, solange das Spiel ungeklärt ist.",
          "Richtige Vorhersagen vergeben Cups nach den für diese Vorhersage geltenden Wertungsregeln.",
        ],
      },
      "settled-change": {
        question: "Kann eine abgerechnete Vorhersage später geändert werden?",
        answer: [
          "In ungewöhnlichen Fällen ja. Datenanbieter oder offizielle Wettbewerbe können zuvor gemeldete Informationen korrigieren, und auch technische oder Abrechnungsfehler können auftreten.",
          "Wenn es zur Genauigkeit der Ergebnisse und zur Integrität des Wettbewerbs nötig ist, kann Goalstery eine Abrechnung korrigieren und betroffene Vorhersagen, Cups, Ranglisten oder Wettbewerbsergebnisse neu berechnen.",
        ],
      },
      "what-are-cups": {
        question: "Was sind Cups?",
        answer: [
          "Cups sind die In-App-Wertungspunkte von Goalstery. Du verdienst Cups durch das Spielen, unter anderem durch richtige Vorhersagen.",
          "Deine Cups können verwendet werden, um deine Leistung zu messen und Ranglisten in Goalstery zu bestimmen.",
        ],
      },
      "cups-money-value": {
        question: "Haben Cups einen Geldwert?",
        answer: [
          "Nein. Cups können nicht gekauft, verkauft, ausgezahlt, an andere Nutzer übertragen oder gegen Geld, Kryptowährung, Waren oder Dienstleistungen eingetauscht werden.",
          "Cups sind nur ein In-App-Wertungsmechanismus und keine Kryptowährung, Token, Geld, gespeicherter Wert oder finanzielles Guthaben.",
        ],
      },
      "free-prize-cups": {
        question: "Muss ich für einen Prize Cup bezahlen?",
        answer: [
          "Nein. Die Teilnahme an Goalstery Prize Cups ist kostenlos. Goalstery verlangt kein Startgeld in Geld, Kryptowährung, Telegram Stars, Cups oder einem anderen Wertgegenstand.",
        ],
      },
      "claim-crypto-prize": {
        question: "Wie beanspruche ich einen Kryptowährungspreis?",
        answer: [
          "Wenn du einen berechtigten Kryptowährungspreis gewinnst, wirst du möglicherweise gebeten, das offizielle Goalstery-Telegram-Supportkonto zu kontaktieren und eine kompatible öffentliche Wallet-Adresse anzugeben, damit der Preis manuell gesendet werden kann.",
          "Prüfe Wallet-Adresse und Netzwerk immer sorgfältig, bevor du sie angibst. Blockchain-Transaktionen können unumkehrbar sein.",
        ],
      },
      "wallet-secrets": {
        question: "Fragt Goalstery jemals nach Seed Phrase oder Private Key?",
        answer: [
          "Nein. Goalstery benötigt niemals deine Seed Phrase, deinen Private Key, dein Wallet-Passwort oder ähnliche geheime Zugangsdaten, um dir einen Preis zu senden.",
          "Für eine Kryptowährungszahlung benötigt Goalstery nur die passende öffentliche Wallet-Adresse und Informationen, die zur angemessenen Prüfung des Preisanspruchs erforderlich sind.",
        ],
      },
      "leaderboard-work": {
        question: "Wie funktioniert die Rangliste?",
        answer: [
          "Goalstery-Ranglisten ordnen teilnehmende Spieler nach den geltenden Wettbewerbsregeln und ihren Goalstery-Ergebnissen.",
          "Je nach Bildschirm oder Wettbewerb kann Goalstery führende Spieler, Spieler in der Nähe deiner Position oder eine größere Teilnehmerliste anzeigen.",
        ],
      },
      "leaderboard-change": {
        question: "Warum kann sich meine Ranglistenposition ändern?",
        answer: [
          "Deine Position kann sich ändern, wenn deine Vorhersagen abgerechnet werden, andere Spieler Ergebnisse erhalten, offene Spiele Ergebnisse bekommen, ein Abrechnungs- oder Wertungsfehler korrigiert wird oder Wettbewerbsdaten neu berechnet werden.",
        ],
      },
      "result-corrected": {
        question: "Was passiert, wenn ein Ergebnis korrigiert wird?",
        answer: [
          "Goalstery kann betroffene Cups und Ranglisten neu berechnen. Wenn eine Korrektur ein Wettbewerbsergebnis betrifft, können sich auch Ranglistenpositionen und Gewinnerermittlung ändern.",
        ],
      },
      "account-created": {
        question: "Wie wird mein Goalstery-Konto erstellt?",
        answer: [
          "Goalstery funktioniert als Telegram Mini App. Dein Telegram-Konto wird zur Authentifizierung und Identifizierung genutzt, daher brauchst du kein separates Goalstery-Passwort.",
        ],
      },
      "telegram-info": {
        question: "Welche Telegram-Informationen erhält Goalstery?",
        answer: [
          "Goalstery kann Informationen erhalten, die über die Telegram Mini App-Schnittstelle verfügbar sind und zur Identifizierung sowie Bereitstellung des Service erforderlich sind, etwa Telegram user ID, username, display name, profile photo, language und ähnliche Profildaten.",
          "Goalstery fordert im normalen Gebrauch keinen Zugriff auf deine Telegram-Nachrichten, Kontakte oder Telefonnummer an.",
        ],
      },
      "multiple-accounts": {
        question: "Kann ich mehrere Konten verwenden?",
        answer: [
          "Ein Telegram-Konto entspricht einem Goalstery-Konto. Mehrere Konten zu verwenden, um sich einen unfairen Vorteil zu verschaffen, Wettbewerbe oder Ranglisten zu manipulieren, Beschränkungen zu umgehen oder Goalstery anderweitig zu missbrauchen, ist verboten.",
        ],
      },
      "delete-account": {
        question: "Wie lösche ich mein Goalstery-Konto?",
        answer: [
          "Kontaktiere das offizielle Goalstery-Telegram-Supportkonto und beantrage die Löschung des Kontos. Goalstery bearbeitet den Antrag und löscht oder anonymisiert zugehörige personenbezogene Informationen, soweit angemessen.",
          "Einige historische Wettbewerbsinformationen können anonymisiert aufbewahrt werden, wenn dies notwendig ist, um die Integrität abgeschlossener Wettbewerbe und Ranglisten zu wahren.",
        ],
      },
      "statistics-ai": {
        question: "Kann ich Statistiken oder KI für Vorhersagen nutzen?",
        answer: [
          "Ja. Du darfst Fußballstatistiken, Recherchen, mathematische Modelle, künstliche Intelligenz oder andere Analysewerkzeuge nutzen, um deine Vorhersage zu wählen.",
        ],
      },
      "not-allowed": {
        question: "Was ist nicht erlaubt?",
        answer: [
          "Goalstery erlaubt keine unfaire oder missbräuchliche Nutzung des Service. Du darfst keine Bots zur automatischen Interaktion oder Abgabe von Vorhersagen nutzen, keine Fehler ausnutzen, Cups, Ranglisten, Wettbewerbsergebnisse oder Leaderboards manipulieren, keine Mehrfachkonten für unfaire Vorteile einsetzen, Schutzmaßnahmen umgehen, APIs oder Infrastruktur stören, eligibility information fälschen oder Betrug beziehungsweise ähnlichen Missbrauch begehen.",
        ],
      },
      "rule-break": {
        question: "Was kann passieren, wenn ich die Regeln verletze?",
        answer: [
          "Je nach Verstoß kann Goalstery betroffene Ergebnisse korrigieren, Vorhersagen ungültig machen, Cups oder Ranglisten anpassen, die Teilnahmeberechtigung für einen Wettbewerb oder Preis entfernen oder das Konto dauerhaft sperren.",
        ],
      },
      "football-data": {
        question: "Woher bekommt Goalstery Fußballdaten?",
        answer: [
          "Goalstery kann Spielpläne, Ergebnisse, Spielstatus und andere Fußballinformationen von Drittanbietern für Sportdaten beziehen, einschließlich football-data.org. Solche Daten können verzögert, unvollständig oder nach Veröffentlichung korrigiert werden.",
        ],
      },
      "scoring-result": {
        question: "Welches Ergebnis nutzt Goalstery für die Wertung?",
        answer: [
          "Goalstery trifft die endgültige Bestimmung der Spieldaten, die für eigene Vorhersageabrechnungen und Wettbewerbe verwendet werden. Bei Bedarf kann Goalstery offizielle Wettbewerbsinformationen, Sportdatenanbieter und andere zuverlässige Quellen berücksichtigen.",
        ],
      },
      tracking: {
        question: "Verfolgt Goalstery mich?",
        answer: [
          "Goalstery betreibt derzeit kein eigenes System für Verhaltensanalyse oder Nutzertracking. Einige technische Informationen können notwendigerweise von Telegram, Cloudflare, Goalsterys Serverinfrastruktur oder anderer Infrastruktur verarbeitet werden, die zur Bereitstellung und Absicherung des Service erforderlich ist.",
        ],
      },
      advertising: {
        question: "Zeigt Goalstery Werbung?",
        answer: [
          "Goalstery kann Werbung anzeigen. Wenn Drittanbieter-Werbedienste eingeführt werden, können diese eigene Datenschutzpraktiken haben, und die Goalstery-Datenschutzerklärung wird gegebenenfalls aktualisiert, wenn sich Praktiken wesentlich ändern.",
        ],
      },
      "protect-account": {
        question: "Wie kann ich mein Konto schützen?",
        answer: [
          "Halte dein Telegram-Konto sicher und gib anderen Personen keinen Zugriff darauf. Bei Kryptowährungspreisen teile niemals Seed Phrases, Private Keys, Wallet-Passwörter oder Authentifizierungsgeheimnisse. Goalstery benötigt diese Geheimnisse nicht, um einen Preis zu senden.",
        ],
      },
      "prediction-pending": {
        question: "Meine Vorhersage ist noch offen",
        answer: [
          "Eine Vorhersage kann offen bleiben, während Goalstery auf ausreichende Informationen zum Spielergebnis wartet, besonders wenn ein Spiel verschoben, unterbrochen, abgebrochen, abgesagt oder anderweitig ungeklärt ist. Wenn du glaubst, dass ein abgeschlossenes Spiel fälschlich offen geblieben ist, kontaktiere Goalstery Support.",
        ],
      },
      "cups-ranking-changed": {
        question: "Meine Cups oder meine Rangliste haben sich geändert",
        answer: [
          "Cups und Ranglisten können sich ändern, wenn Vorhersagen abgerechnet werden und andere Spieler ihre Ergebnisse erhalten. Sie können sich auch ändern, wenn Goalstery ungenaue Spieldaten, Abrechnungsinformationen, Wertung oder Wettbewerbsergebnisse korrigiert.",
        ],
      },
      "settled-incorrectly": {
        question: "Ich glaube, meine Vorhersage wurde falsch abgerechnet",
        answer: [
          "Kontaktiere Goalstery Support und gib genügend Informationen an, um Spiel und Vorhersage zu identifizieren. Goalstery kann die Abrechnung prüfen und sie gegebenenfalls korrigieren.",
        ],
      },
      "cannot-access-prize-cup": {
        question: "Ich kann nicht auf einen Prize Cup zugreifen",
        answer: [
          "Ein bestimmter Prize Cup kann Teilnahme- oder geografische Beschränkungen haben. Der Zugriff auf Goalstery selbst garantiert keinen Zugriff auf jeden Prize Cup. Wenn du glaubst, berechtigt zu sein, kontaktiere Goalstery Support.",
        ],
      },
    },
  },
  es: {
    eyebrow: "SOPORTE Y LEGAL",
    title: "Ayuda y soporte",
    subtitle: "¿Cómo podemos ayudarte?",
    categoriesAriaLabel: "Categorías de ayuda",
    popularQuestionsTitle: "Preguntas frecuentes",
    supportTitle: "¿Necesitas más ayuda?",
    supportDescription:
      "Contacta al equipo de soporte de Goalstery mediante la cuenta oficial de soporte de Telegram que se muestra dentro de Goalstery.",
    supportButtonLabel: "Contactar soporte",
    supportUnavailable:
      "La cuenta oficial de soporte aún no está configurada. Usa solo la cuenta de soporte indicada dentro de Goalstery.",
    privacyLinkLabel: "Política de privacidad",
    termsLinkLabel: "Términos de uso",
    categories: {
      predictions: {
        title: "Predicciones",
        description: "Cómo funcionan, plazos y puntuación",
      },
      cups: {
        title: "Cups",
        description: "Puntos, competiciones y Prize Cups",
      },
      leaderboard: {
        title: "Clasificación",
        description: "Rankings, resultados y cálculos",
      },
      account: {
        title: "Cuenta",
        description: "Perfil, ajustes y gestión de cuenta",
      },
      "fair-play": {
        title: "Juego limpio",
        description: "Análisis permitido y abuso prohibido",
      },
      "match-data": {
        title: "Datos de partidos",
        description: "Datos deportivos, correcciones y liquidación",
      },
      "privacy-security": {
        title: "Privacidad y seguridad",
        description: "Seguimiento, anuncios y seguridad de la cuenta",
      },
      troubleshooting: {
        title: "Solución de problemas",
        description: "Predicciones pendientes, rankings y acceso",
      },
    },
    questions: {
      "how-predictions-work": {
        question: "¿Cómo funcionan las predicciones?",
        answer: [
          "Goalstery te permite hacer predicciones sobre partidos de fútbol. Los tipos disponibles pueden variar según el partido y tener distintos niveles de dificultad y recompensas en Cups.",
          "Selecciona un partido disponible, elige tu predicción y envíala antes del plazo. Goalstery registra las predicciones enviadas y luego las evalúa con el resultado liquidado del partido.",
        ],
      },
      "prediction-lock": {
        question: "¿Cuándo se bloquea una predicción?",
        answer: [
          "Cada predicción tiene un plazo. Una vez vencido el plazo aplicable o bloqueada de otro modo por Goalstery, ya no puedes cambiar esa predicción.",
        ],
      },
      "cups-calculated": {
        question: "¿Cómo se calculan los Cups?",
        answer: [
          "Las predicciones correctas otorgan Cups según las reglas de puntuación aplicables a esa predicción. Los tipos de predicción pueden tener valores distintos según su naturaleza o dificultad, y la recompensa aplicable debe mostrarse antes de enviarla.",
        ],
      },
      "postponed-match": {
        question: "¿Qué pasa si se aplaza un partido?",
        answer: [
          "Si un partido se aplaza, cancela, abandona, suspende o no tiene un resultado adecuado para liquidación, las predicciones afectadas pueden permanecer pendientes hasta que Goalstery determine que hay información suficiente para liquidarlas o que corresponde otra resolución.",
        ],
      },
      "real-prizes": {
        question: "¿Puedo ganar premios reales?",
        answer: [
          "Algunos Goalstery Cups pueden ofrecer premios reales anunciados por separado, incluidos premios en criptomonedas como USDT o GRAM. No todos los Cups tienen premio real, y la disponibilidad de Goalstery no garantiza la elegibilidad para cada Prize Cup.",
        ],
      },
      "contact-support": {
        question: "¿Cómo contacto con soporte?",
        answer: [
          "Contacta al equipo de soporte de Goalstery mediante la cuenta oficial de soporte de Telegram que se muestra dentro de Goalstery. Usa solo esa cuenta para evitar suplantaciones o cuentas fraudulentas.",
        ],
      },
      "after-match": {
        question: "¿Qué ocurre después del partido?",
        answer: [
          "Cuando Goalstery tiene suficiente información sobre el resultado, tu predicción se evalúa. Según el tipo y el resultado, puede marcarse como correcta, incorrecta o seguir pendiente mientras el partido no esté resuelto.",
          "Las predicciones correctas otorgan Cups según las reglas de puntuación aplicables a esa predicción.",
        ],
      },
      "settled-change": {
        question: "¿Puede cambiar una predicción ya liquidada?",
        answer: [
          "En casos inusuales, sí. Los proveedores de datos o competiciones oficiales pueden corregir información previamente reportada, y también pueden producirse errores técnicos o de liquidación.",
          "Cuando sea necesario para mantener resultados precisos e integridad competitiva, Goalstery puede corregir una liquidación y recalcular predicciones, Cups, rankings o resultados de competiciones afectados.",
        ],
      },
      "what-are-cups": {
        question: "¿Qué son los Cups?",
        answer: [
          "Los Cups son los puntos de puntuación dentro de Goalstery. Los ganas jugando, incluso al hacer predicciones correctas.",
          "Tus Cups pueden usarse para medir tu rendimiento y determinar rankings dentro de Goalstery.",
        ],
      },
      "cups-money-value": {
        question: "¿Los Cups tienen valor monetario?",
        answer: [
          "No. Los Cups no se pueden comprar, vender, retirar, transferir a otro usuario ni cambiar por dinero, criptomonedas, bienes o servicios.",
          "Los Cups son solo un mecanismo de puntuación interno y no son criptomoneda, tokens, dinero, valor almacenado ni saldo financiero.",
        ],
      },
      "free-prize-cups": {
        question: "¿Tengo que pagar para entrar en un Prize Cup?",
        answer: [
          "No. La participación en los Prize Cups de Goalstery es gratuita. Goalstery no exige una cuota de entrada en dinero, criptomonedas, Telegram Stars, Cups u otro elemento de valor.",
        ],
      },
      "claim-crypto-prize": {
        question: "¿Cómo reclamo un premio en criptomonedas?",
        answer: [
          "Si ganas un premio elegible en criptomonedas, es posible que debas contactar la cuenta oficial de soporte de Goalstery en Telegram y proporcionar una dirección pública compatible de wallet para que el premio se envíe manualmente.",
          "Comprueba siempre cuidadosamente la dirección de wallet y la red antes de proporcionarlas. Las transacciones blockchain pueden ser irreversibles.",
        ],
      },
      "wallet-secrets": {
        question: "¿Goalstery pedirá alguna vez mi seed phrase o private key?",
        answer: [
          "No. Goalstery nunca necesita tu seed phrase, private key, contraseña de wallet ni credenciales secretas similares para enviarte un premio.",
          "Para recibir un pago en criptomonedas, Goalstery solo necesita la dirección pública adecuada de wallet y cualquier información razonablemente necesaria para verificar la reclamación del premio.",
        ],
      },
      "leaderboard-work": {
        question: "¿Cómo funciona la clasificación?",
        answer: [
          "Las clasificaciones de Goalstery ordenan a los jugadores participantes según las reglas aplicables de la competición y sus resultados en Goalstery.",
          "Según la pantalla o competición, Goalstery puede mostrar los mejores jugadores, jugadores cerca de tu posición actual o una lista más amplia de participantes.",
        ],
      },
      "leaderboard-change": {
        question: "¿Por qué puede cambiar mi posición?",
        answer: [
          "Tu posición puede cambiar cuando se liquidan tus predicciones, se liquidan las de otros jugadores, los partidos pendientes reciben resultados, se corrige un error de liquidación o puntuación, o se recalculan datos de la competición.",
        ],
      },
      "result-corrected": {
        question: "¿Qué pasa si se corrige un resultado?",
        answer: [
          "Goalstery puede recalcular los Cups y rankings afectados. Si una corrección afecta el resultado de una competición, también pueden cambiar las posiciones y la determinación del ganador.",
        ],
      },
      "account-created": {
        question: "¿Cómo se crea mi cuenta de Goalstery?",
        answer: [
          "Goalstery funciona como Telegram Mini App. Tu cuenta de Telegram se usa para autenticarte e identificarte, por lo que no necesitas crear una contraseña separada de Goalstery.",
        ],
      },
      "telegram-info": {
        question: "¿Qué información de Telegram recibe Goalstery?",
        answer: [
          "Goalstery puede recibir información disponible mediante la interfaz de Telegram Mini App que sea necesaria para identificarte y proporcionar el Servicio, como Telegram user ID, username, display name, profile photo, language y datos de perfil similares.",
          "Goalstery no solicita acceso a tus mensajes de Telegram, contactos ni número de teléfono como parte del uso normal.",
        ],
      },
      "multiple-accounts": {
        question: "¿Puedo usar varias cuentas?",
        answer: [
          "Una cuenta de Telegram corresponde a una cuenta de Goalstery. Está prohibido usar varias cuentas para obtener una ventaja injusta, manipular competiciones o rankings, eludir restricciones o abusar de Goalstery.",
        ],
      },
      "delete-account": {
        question: "¿Cómo elimino mi cuenta de Goalstery?",
        answer: [
          "Contacta la cuenta oficial de soporte de Goalstery en Telegram y solicita la eliminación de la cuenta. Goalstery procesará la solicitud y eliminará o anonimizará la información personal asociada según corresponda.",
          "Algunos datos históricos de competiciones pueden conservarse de forma anonimizada cuando sea necesario para preservar la integridad de competiciones y clasificaciones completadas.",
        ],
      },
      "statistics-ai": {
        question: "¿Puedo usar estadísticas o AI para hacer predicciones?",
        answer: [
          "Sí. Puedes usar estadísticas de fútbol, investigación, modelos matemáticos, inteligencia artificial u otras herramientas analíticas para decidir qué predicción hacer.",
        ],
      },
      "not-allowed": {
        question: "¿Qué no está permitido?",
        answer: [
          "Goalstery no permite una interacción injusta o abusiva con el Servicio. No debes usar bots para interactuar automáticamente con Goalstery o enviar predicciones, explotar errores, manipular Cups, rankings, resultados de competiciones o clasificaciones, usar varias cuentas para ventaja injusta, eludir protecciones, interferir con APIs o infraestructura, falsificar eligibility information ni participar en fraude o abuso similar.",
        ],
      },
      "rule-break": {
        question: "¿Qué puede pasar si incumplo las reglas?",
        answer: [
          "Según la infracción, Goalstery puede corregir resultados afectados, invalidar predicciones, ajustar Cups o rankings, retirar la elegibilidad para una competición o premio, o bloquear permanentemente la cuenta.",
        ],
      },
      "football-data": {
        question: "¿De dónde obtiene Goalstery los datos de fútbol?",
        answer: [
          "Goalstery puede obtener calendarios, marcadores, estado de partidos y otra información de fútbol de fuentes externas de datos deportivos, incluido football-data.org. Estos datos pueden retrasarse, estar incompletos o corregirse tras su publicación.",
        ],
      },
      "scoring-result": {
        question: "¿Qué resultado usa Goalstery para puntuar?",
        answer: [
          "Goalstery toma la determinación final sobre la información del partido usada para su propia liquidación de predicciones y competiciones. Cuando sea necesario, Goalstery puede considerar información oficial de competiciones, proveedores de datos deportivos y otras fuentes fiables.",
        ],
      },
      tracking: {
        question: "¿Goalstery me rastrea?",
        answer: [
          "Goalstery no opera actualmente un sistema dedicado de analítica de comportamiento o seguimiento de usuarios. Cierta información técnica puede ser procesada necesariamente por Telegram, Cloudflare, la infraestructura de servidores de Goalstery u otra infraestructura necesaria para entregar y proteger el Servicio.",
        ],
      },
      advertising: {
        question: "¿Goalstery muestra anuncios?",
        answer: [
          "Goalstery puede mostrar publicidad. Si se introducen servicios publicitarios de terceros, esos servicios pueden tener sus propias prácticas de privacidad, y la Política de privacidad de Goalstery se actualizará cuando corresponda si las prácticas cambian materialmente.",
        ],
      },
      "protect-account": {
        question: "¿Cómo puedo proteger mi cuenta?",
        answer: [
          "Mantén segura tu cuenta de Telegram y no des acceso a otras personas. Para premios en criptomonedas, nunca compartas seed phrases, private keys, contraseñas de wallet ni secretos de autenticación. Goalstery no requiere esos secretos para entregar un premio.",
        ],
      },
      "prediction-pending": {
        question: "Mi predicción sigue pendiente",
        answer: [
          "Una predicción puede seguir pendiente mientras Goalstery espera información suficiente sobre el resultado del partido, especialmente si el partido se aplaza, suspende, abandona, cancela o queda sin resolver. Si crees que un partido completado sigue pendiente por error, contacta a soporte de Goalstery.",
        ],
      },
      "cups-ranking-changed": {
        question: "Mis Cups o ranking cambiaron",
        answer: [
          "Los Cups y rankings pueden cambiar a medida que se liquidan predicciones y otros jugadores reciben sus resultados. También pueden cambiar si Goalstery corrige datos de partido, información de liquidación, puntuación o resultados de competición inexactos.",
        ],
      },
      "settled-incorrectly": {
        question: "Creo que mi predicción fue liquidada incorrectamente",
        answer: [
          "Contacta a soporte de Goalstery y proporciona información suficiente para identificar el partido y la predicción. Goalstery puede revisar la liquidación y corregirla cuando corresponda.",
        ],
      },
      "cannot-access-prize-cup": {
        question: "No puedo acceder a un Prize Cup",
        answer: [
          "Un Prize Cup concreto puede tener restricciones de elegibilidad o geográficas. El acceso a Goalstery no garantiza acceso a cada Prize Cup. Si crees que deberías ser elegible, contacta a soporte de Goalstery.",
        ],
      },
    },
  },
  ar: {
    eyebrow: "الدعم والوثائق القانونية",
    title: "المساعدة والدعم",
    subtitle: "كيف يمكننا مساعدتك؟",
    categoriesAriaLabel: "فئات المساعدة",
    popularQuestionsTitle: "الأسئلة الشائعة",
    supportTitle: "هل تحتاج إلى مزيد من المساعدة؟",
    supportDescription:
      "تواصل مع فريق دعم Goalstery عبر حساب دعم Telegram الرسمي المعروض داخل Goalstery.",
    supportButtonLabel: "تواصل مع الدعم",
    supportUnavailable:
      "لم يتم إعداد حساب الدعم الرسمي بعد. استخدم فقط حساب الدعم المحدد داخل Goalstery.",
    privacyLinkLabel: "سياسة الخصوصية",
    termsLinkLabel: "شروط الاستخدام",
    categories: {
      predictions: {
        title: "التوقعات",
        description: "كيفية العمل والمواعيد النهائية والتسجيل",
      },
      cups: {
        title: "Cups",
        description: "النقاط والمسابقات وPrize Cups",
      },
      leaderboard: {
        title: "لوحة الترتيب",
        description: "الترتيبات والنتائج والحسابات",
      },
      account: {
        title: "الحساب",
        description: "الملف الشخصي والإعدادات وإدارة الحساب",
      },
      "fair-play": {
        title: "اللعب النزيه",
        description: "التحليل المسموح وإساءة الاستخدام المحظورة",
      },
      "match-data": {
        title: "بيانات المباريات",
        description: "البيانات الرياضية والتصحيحات والتسوية",
      },
      "privacy-security": {
        title: "الخصوصية والأمان",
        description: "التتبع والإعلانات وأمان الحساب",
      },
      troubleshooting: {
        title: "استكشاف الأخطاء",
        description: "التوقعات المعلقة والترتيبات والوصول",
      },
    },
    questions: {
      "how-predictions-work": {
        question: "كيف تعمل التوقعات؟",
        answer: [
          "يتيح لك Goalstery تقديم توقعات حول مباريات كرة القدم. قد تختلف أنواع التوقعات المتاحة حسب المباراة وقد تكون لها مستويات صعوبة ومكافآت Cups مختلفة.",
          "اختر مباراة متاحة، وحدد توقعك، وأرسله قبل الموعد النهائي. يسجل Goalstery التوقعات المرسلة ثم يقيمها لاحقا باستخدام نتيجة المباراة التي تمت تسويتها.",
        ],
      },
      "prediction-lock": {
        question: "متى يتم قفل التوقع؟",
        answer: [
          "لكل توقع موعد نهائي. بعد انتهاء الموعد النهائي المعمول به أو بعد قفل التوقع من Goalstery بطريقة أخرى، لا يمكنك تغيير ذلك التوقع.",
        ],
      },
      "cups-calculated": {
        question: "كيف يتم حساب Cups؟",
        answer: [
          "تمنح التوقعات الصحيحة Cups وفقا لقواعد التسجيل المطبقة على ذلك التوقع. قد تكون لأنواع التوقعات قيم تسجيل مختلفة حسب طبيعتها أو صعوبتها، ويجب عرض المكافأة المطبقة قبل الإرسال.",
        ],
      },
      "postponed-match": {
        question: "ماذا يحدث إذا تم تأجيل مباراة؟",
        answer: [
          "إذا تم تأجيل مباراة أو إلغاؤها أو التخلي عنها أو تعليقها أو لم تكن لها نتيجة مناسبة للتسوية، فقد تبقى التوقعات المتأثرة معلقة حتى يقرر Goalstery أن المعلومات كافية لتسويتها أو أن حلا آخر مناسب.",
        ],
      },
      "real-prizes": {
        question: "هل يمكنني الفوز بجوائز حقيقية؟",
        answer: [
          "قد تقدم بعض Goalstery Cups جوائز حقيقية معلنة بشكل منفصل، بما في ذلك جوائز عملات مشفرة مثل USDT أو GRAM. ليس لكل Cup جائزة حقيقية، وتوفر Goalstery لا يضمن الأهلية لكل Prize Cup.",
        ],
      },
      "contact-support": {
        question: "كيف أتواصل مع الدعم؟",
        answer: [
          "تواصل مع فريق دعم Goalstery عبر حساب دعم Telegram الرسمي المعروض داخل Goalstery. استخدم هذا الحساب فقط لتجنب انتحال الهوية أو حسابات الدعم الاحتيالية.",
        ],
      },
      "after-match": {
        question: "ماذا يحدث بعد المباراة؟",
        answer: [
          "بعد أن تتوفر لدى Goalstery معلومات كافية عن نتيجة المباراة، يتم تقييم توقعك. حسب نوع التوقع والنتيجة، قد يتم وسمه كصحيح أو خاطئ أو يبقى معلقا بينما المباراة غير محسومة.",
          "تمنح التوقعات الصحيحة Cups وفقا لقواعد التسجيل المطبقة على ذلك التوقع.",
        ],
      },
      "settled-change": {
        question: "هل يمكن أن يتغير توقع تمت تسويته لاحقا؟",
        answer: [
          "في حالات غير عادية، نعم. قد يصحح مزودو بيانات المباريات أو المسابقات الرسمية معلومات تم الإبلاغ عنها سابقا، وقد تحدث أيضا أخطاء تقنية أو أخطاء تسوية.",
          "عند الضرورة للحفاظ على دقة النتائج ونزاهة المنافسة، قد يصحح Goalstery التسوية ويعيد حساب التوقعات أو Cups أو الترتيبات أو نتائج المسابقات المتأثرة.",
        ],
      },
      "what-are-cups": {
        question: "ما هي Cups؟",
        answer: [
          "Cups هي نقاط التسجيل داخل Goalstery. تكسب Cups من خلال اللعب، بما في ذلك تقديم توقعات صحيحة.",
          "يمكن استخدام Cups لقياس أدائك وتحديد الترتيبات في Goalstery.",
        ],
      },
      "cups-money-value": {
        question: "هل تملك Cups قيمة مالية؟",
        answer: [
          "لا. لا يمكن شراء Cups أو بيعها أو سحبها أو نقلها إلى مستخدم آخر أو استبدالها بمال أو عملة مشفرة أو سلع أو خدمات.",
          "Cups هي فقط آلية تسجيل داخل التطبيق وليست عملة مشفرة أو رموزا أو مالا أو قيمة مخزنة أو رصيدا ماليا.",
        ],
      },
      "free-prize-cups": {
        question: "هل يجب أن أدفع للدخول في Prize Cup؟",
        answer: [
          "لا. المشاركة في Goalstery Prize Cups مجانية. لا يطلب Goalstery رسوم دخول بمال أو عملة مشفرة أو Telegram Stars أو Cups أو أي شيء آخر ذي قيمة.",
        ],
      },
      "claim-crypto-prize": {
        question: "كيف أطالب بجائزة عملة مشفرة؟",
        answer: [
          "إذا فزت بجائزة عملة مشفرة مؤهلة، فقد يطلب منك التواصل مع حساب دعم Goalstery الرسمي على Telegram وتقديم عنوان محفظة عام متوافق حتى يمكن إرسال الجائزة يدويا.",
          "تحقق دائما من عنوان المحفظة والشبكة بعناية قبل تقديمهما. قد تكون معاملات blockchain غير قابلة للعكس.",
        ],
      },
      "wallet-secrets": {
        question: "هل سيطلب Goalstery عبارة seed phrase أو private key؟",
        answer: [
          "لا. لن يحتاج Goalstery أبدا إلى seed phrase أو private key أو wallet password أو بيانات سرية مماثلة لإرسال جائزة إليك.",
          "لتلقي دفعة بعملة مشفرة، يحتاج Goalstery فقط إلى عنوان المحفظة العام المناسب وأي معلومات مطلوبة بشكل معقول للتحقق من مطالبة الجائزة.",
        ],
      },
      "leaderboard-work": {
        question: "كيف تعمل لوحة الترتيب؟",
        answer: [
          "ترتب لوحات Goalstery اللاعبين المشاركين وفقا لقواعد المسابقة المعمول بها ونتائجهم في Goalstery.",
          "بحسب الشاشة أو المسابقة، قد يعرض Goalstery اللاعبين الأعلى ترتيبا أو اللاعبين حول مركزك الحالي أو قائمة أوسع من المشاركين.",
        ],
      },
      "leaderboard-change": {
        question: "لماذا قد يتغير مركزي في الترتيب؟",
        answer: [
          "قد يتغير مركزك عندما تتم تسوية توقعاتك أو توقعات لاعبين آخرين، أو عندما تحصل المباريات المعلقة على نتائج، أو عند تصحيح خطأ في التسوية أو التسجيل، أو عند إعادة حساب بيانات المسابقة.",
        ],
      },
      "result-corrected": {
        question: "ماذا يحدث إذا تم تصحيح نتيجة؟",
        answer: [
          "قد يعيد Goalstery حساب Cups والترتيبات المتأثرة. إذا أثر التصحيح في نتيجة مسابقة، فقد تتغير مراكز لوحة الترتيب وتحديد الفائز أيضا.",
        ],
      },
      "account-created": {
        question: "كيف يتم إنشاء حسابي في Goalstery؟",
        answer: [
          "يعمل Goalstery كتطبيق Telegram Mini App. يستخدم حساب Telegram الخاص بك للمصادقة والتعريف، لذلك لا تحتاج إلى إنشاء كلمة مرور منفصلة لـ Goalstery.",
        ],
      },
      "telegram-info": {
        question: "ما معلومات Telegram التي يتلقاها Goalstery؟",
        answer: [
          "قد يتلقى Goalstery معلومات متاحة عبر واجهة Telegram Mini App وضرورية للتعرف عليك وتقديم الخدمة، مثل Telegram user ID وusername وdisplay name وprofile photo وlanguage ومعلومات ملف شخصي مماثلة.",
          "لا يطلب Goalstery الوصول إلى رسائل Telegram أو جهات الاتصال أو رقم الهاتف كجزء من الاستخدام العادي.",
        ],
      },
      "multiple-accounts": {
        question: "هل يمكنني استخدام عدة حسابات؟",
        answer: [
          "يمثل حساب Telegram حسابا في Goalstery. يحظر استخدام عدة حسابات للحصول على ميزة غير عادلة أو التلاعب بالمسابقات أو الترتيبات أو تجاوز القيود أو إساءة استخدام Goalstery بأي طريقة أخرى.",
        ],
      },
      "delete-account": {
        question: "كيف أحذف حسابي في Goalstery؟",
        answer: [
          "تواصل مع حساب دعم Goalstery الرسمي على Telegram واطلب حذف الحساب. سيعالج Goalstery الطلب ويحذف أو يخفي هوية المعلومات الشخصية المرتبطة حسب الاقتضاء.",
          "قد يتم الاحتفاظ ببعض معلومات المسابقات التاريخية بشكل مجهول عندما يكون ذلك ضروريا للحفاظ على نزاهة المسابقات ولوحات الترتيب المكتملة.",
        ],
      },
      "statistics-ai": {
        question: "هل يمكنني استخدام الإحصاءات أو AI للمساعدة في التوقعات؟",
        answer: [
          "نعم. يمكنك استخدام إحصاءات كرة القدم أو البحث أو النماذج الرياضية أو الذكاء الاصطناعي أو أدوات تحليلية أخرى لمساعدتك في تحديد التوقع الذي تريد تقديمه.",
        ],
      },
      "not-allowed": {
        question: "ما غير المسموح؟",
        answer: [
          "لا يسمح Goalstery بالتفاعل غير العادل أو المسيء مع الخدمة. يجب ألا تستخدم bots للتفاعل تلقائيا مع Goalstery أو إرسال توقعات، أو تستغل أخطاء، أو تتلاعب بـ Cups أو الترتيبات أو نتائج المسابقات أو لوحات الترتيب، أو تستخدم حسابات متعددة للحصول على ميزة غير عادلة، أو تتجاوز الحماية، أو تتدخل في APIs أو البنية التحتية، أو تزيف eligibility information، أو ترتكب احتيالا أو إساءة مماثلة.",
        ],
      },
      "rule-break": {
        question: "ماذا قد يحدث إذا خرقت القواعد؟",
        answer: [
          "بحسب المخالفة، قد يصحح Goalstery النتائج المتأثرة أو يبطل التوقعات أو يعدل Cups أو الترتيبات أو يزيل الأهلية لمسابقة أو جائزة أو يحظر الحساب نهائيا.",
        ],
      },
      "football-data": {
        question: "من أين يحصل Goalstery على بيانات كرة القدم؟",
        answer: [
          "قد يحصل Goalstery على الجداول والنتائج وحالة المباريات ومعلومات كرة قدم أخرى من مصادر بيانات رياضية خارجية، بما في ذلك football-data.org. قد تكون بيانات الرياضة الخارجية متأخرة أو غير كاملة أو مصححة بعد النشر.",
        ],
      },
      "scoring-result": {
        question: "أي نتيجة يستخدمها Goalstery للتسجيل؟",
        answer: [
          "يتخذ Goalstery القرار النهائي بشأن معلومات المباراة المستخدمة لتسوية توقعاته ومسابقاته. عند الحاجة، قد يراعي Goalstery معلومات المسابقات الرسمية ومزودي البيانات الرياضية ومصادر موثوقة أخرى.",
        ],
      },
      tracking: {
        question: "هل يتتبعني Goalstery؟",
        answer: [
          "لا يشغل Goalstery حاليا نظاما مخصصا للتحليلات السلوكية أو تتبع المستخدمين. قد تتم معالجة بعض المعلومات التقنية بالضرورة بواسطة Telegram أو Cloudflare أو بنية خوادم Goalstery أو بنية أخرى لازمة لتقديم الخدمة وتأمينها.",
        ],
      },
      advertising: {
        question: "هل يعرض Goalstery إعلانات؟",
        answer: [
          "قد يعرض Goalstery إعلانات. إذا تم إدخال خدمات إعلانية من طرف ثالث، فقد تكون لهذه الخدمات ممارسات خصوصية خاصة بها، وسيتم تحديث سياسة خصوصية Goalstery عند الاقتضاء إذا تغيرت الممارسات بشكل جوهري.",
        ],
      },
      "protect-account": {
        question: "كيف أحمي حسابي؟",
        answer: [
          "حافظ على أمان حساب Telegram الخاص بك ولا تمنح الآخرين الوصول إليه. بالنسبة لجوائز العملات المشفرة، لا تشارك أبدا seed phrases أو private keys أو wallet passwords أو أسرار المصادقة. لا يتطلب Goalstery هذه الأسرار لتسليم جائزة.",
        ],
      },
      "prediction-pending": {
        question: "توقعي لا يزال معلقا",
        answer: [
          "قد يبقى التوقع معلقا بينما ينتظر Goalstery معلومات كافية عن نتيجة المباراة، خاصة إذا تم تأجيل المباراة أو تعليقها أو التخلي عنها أو إلغاؤها أو بقيت غير محسومة. إذا كنت تعتقد أن مباراة مكتملة بقيت معلقة بالخطأ، فتواصل مع دعم Goalstery.",
        ],
      },
      "cups-ranking-changed": {
        question: "تغيرت Cups أو ترتيبي",
        answer: [
          "قد تتغير Cups والترتيبات مع تسوية التوقعات وحصول لاعبين آخرين على نتائجهم. وقد تتغير أيضا إذا صحح Goalstery بيانات مباراة أو معلومات تسوية أو تسجيل أو نتائج مسابقة غير دقيقة.",
        ],
      },
      "settled-incorrectly": {
        question: "أعتقد أن توقعي تمت تسويته بشكل غير صحيح",
        answer: [
          "تواصل مع دعم Goalstery وقدم معلومات كافية لتحديد المباراة والتوقع. يمكن لـ Goalstery مراجعة التسوية وتصحيحها عند الاقتضاء.",
        ],
      },
      "cannot-access-prize-cup": {
        question: "لا يمكنني الوصول إلى Prize Cup",
        answer: [
          "قد تكون لدى Prize Cup معينة قيود أهلية أو قيود جغرافية. الوصول إلى Goalstery نفسه لا يضمن الوصول إلى كل Prize Cup. إذا كنت تعتقد أنك مؤهل، فتواصل مع دعم Goalstery.",
        ],
      },
    },
  },
};

const privacyTextByLocale: Record<TranslatedLocale, ILegalLocaleText> = {
  ru: {
    eyebrow: "ПОДДЕРЖКА И ДОКУМЕНТЫ",
    title: "Политика конфиденциальности",
    subtitle: "Как Goalstery обрабатывает ваши данные.",
    version: "Версия 1.0",
    lastUpdatedLabel: "Обновлено 9 сентября 2026",
    contentsLabel: "Содержание",
    authoritativeNotice:
      "Английская версия этой Политики конфиденциальности является авторитетной. Этот перевод предоставлен для удобства.",
    highlightsAriaLabel: "Основные положения конфиденциальности",
    highlights: [
      {
        tone: "privacy",
        title: "Конфиденциальность Telegram",
        text: "Goalstery не запрашивает доступ к вашим сообщениям Telegram, контактам или номеру телефона.",
      },
      {
        tone: "security",
        title: "Безопасность криптовалюты",
        text: "Мы никогда не попросим seed phrase, private key или wallet password.",
      },
    ],
    intro: [
      "Эта Политика конфиденциальности объясняет, как Goalstery обрабатывает информацию, когда вы используете Telegram Mini App Goalstery.",
      "Используя Goalstery, вы подтверждаете практики, описанные в этой Политике конфиденциальности.",
    ],
    sections: {
      "information-we-receive": {
        title: "Информация, которую мы получаем",
        blocks: [
          "Goalstery работает как Telegram Mini App. Когда вы используете Goalstery, мы можем получать данные аккаунта, доступные через интерфейс Telegram Mini App и необходимые для вашей идентификации и предоставления Сервиса.",
          [
            "ваш Telegram user ID",
            "username",
            "имя и фамилию или отображаемое имя",
            "фото профиля или сведения об аватаре",
            "язык или другую связанную с аккаунтом информацию, доступную через Telegram",
          ],
          "Goalstery не требует отдельного имени пользователя или пароля. Telegram является независимым сервисом и обрабатывает информацию согласно собственным условиям и практикам конфиденциальности.",
          "Goalstery не запрашивает доступ к вашим сообщениям Telegram, контактам или номеру телефона.",
        ],
      },
      "goalstery-activity-data": {
        title: "Данные активности в Goalstery",
        blocks: [
          "Мы обрабатываем информацию, создаваемую при использовании Goalstery, включая прогнозы, результаты прогнозов, Cups и другие данные подсчёта, позиции в лидербордах, участие в Cups и соревнованиях, активность по матчам, настройки профиля, временные метки и другую информацию, необходимую для работы Сервиса.",
          "Эта информация используется для работы gameplay, подсчёта, соревнований, лидербордов, аккаунта и связанных функций Goalstery.",
        ],
      },
      "technical-data": {
        title: "Технические данные",
        blocks: [
          "Goalstery намеренно не ведёт отдельный продуктовый аналитический профиль на основе вашего IP-адреса, браузера, устройства или похожих технических идентификаторов.",
          "Ограниченная техническая информация может временно и по необходимости обрабатываться серверами, сетевой инфраструктурой, хостингом, Cloudflare, Telegram или другой инфраструктурой, требуемой для доставки и защиты Сервиса, маршрутизации, безопасности, предотвращения злоупотреблений, диагностики и надёжной работы.",
        ],
      },
      "analytics-and-tracking": {
        title: "Аналитика и отслеживание",
        blocks: [
          "Goalstery сейчас не использует отдельную систему поведенческой аналитики или пользовательского трекинга. Если это существенно изменится, эта Политика конфиденциальности будет обновлена надлежащим образом.",
        ],
      },
      advertising: {
        title: "Реклама",
        blocks: [
          "Goalstery может показывать рекламу. Goalstery сейчас не указывает конкретного рекламного провайдера в этой Политике конфиденциальности.",
          "Если будут введены сторонние рекламные сервисы, они могут обрабатывать определённую техническую, рекламную или интерактивную информацию согласно собственным политикам конфиденциальности и применимому праву. Перед введением рекламного провайдера, обработка которым существенно влияет на описанные здесь практики, Goalstery может обновить эту Политику конфиденциальности и предоставить дополнительную информацию, где это уместно.",
        ],
      },
      "how-we-use-information": {
        title: "Как мы используем информацию",
        blocks: [
          [
            "предоставлять и эксплуатировать Сервис",
            "аутентифицировать и идентифицировать пользователей через Telegram",
            "обрабатывать прогнозы и результаты матчей",
            "рассчитывать Cups, рейтинги и результаты соревнований",
            "управлять лидербордами и Cups",
            "сохранять пользовательские настройки",
            "предотвращать мошенничество, читинг, злоупотребления, манипуляции и несанкционированный доступ",
            "расследовать технические проблемы и поддерживать безопасность",
            "отвечать на запросы поддержки",
            "соблюдать применимые юридические обязанности, когда это требуется",
          ],
          "Мы не продаём вашу персональную информацию.",
        ],
      },
      "infrastructure-and-service-providers": {
        title: "Инфраструктура и поставщики услуг",
        blocks: [
          "Goalstery работает на собственной серверной инфраструктуре, включая частно управляемый VPS, и использует Cloudflare для инфраструктурных сервисов, которые могут включать доставку по сети, безопасность, маршрутизацию трафика и защиту Сервиса.",
          "Goalstery полагается на Telegram как на платформу доступа к Mini App. Футбольная и матчевая информация может поступать от сторонних sports-data providers, включая football-data.org, которые используются для спортивной информации и не предназначены для получения профилей пользователей Goalstery только из-за отправки прогноза.",
          "Дополнительная инфраструктура или поставщики услуг могут вводиться, когда это необходимо для работы Goalstery. Эта Политика конфиденциальности будет обновлена, если изменение существенно влияет на описанную здесь обработку.",
        ],
      },
      "prize-information": {
        title: "Информация о призах",
        blocks: [
          "Некоторые соревнования Goalstery могут предлагать реальные призы, включая криптовалютные призы, такие как USDT или GRAM. Участие обычно не требует предоставления адреса криптовалютного кошелька.",
          "Если вы имеете право получить криптовалютный приз, вас могут попросить связаться с поддержкой Goalstery и добровольно предоставить адрес кошелька, необходимый для доставки приза. Информация о кошельке будет использоваться для проверки и обработки соответствующей выплаты приза и связанных вопросов поддержки или соблюдения требований.",
          "Goalstery никогда не попросит вашу seed phrase, private key, wallet password или похожие секретные учётные данные.",
        ],
      },
      "data-retention": {
        title: "Хранение данных",
        blocks: [
          "Goalstery хранит информацию столько, сколько разумно необходимо для работы Сервиса, поддержания целостности соревнований и лидербордов, предотвращения злоупотреблений, разрешения споров, соблюдения применимых обязанностей и защиты Сервиса. Сроки хранения могут различаться в зависимости от типа информации и причины хранения.",
        ],
      },
      "account-and-data-deletion": {
        title: "Удаление аккаунта и данных",
        blocks: [
          "Вы можете запросить удаление аккаунта Goalstery и связанной персональной информации, обратившись в поддержку Goalstery через официальный аккаунт поддержки в Telegram.",
          "Когда действительный запрос на удаление обработан, Goalstery удалит или анонимизирует персональную информацию, связанную с аккаунтом, за исключением информации, которую разумно необходимо сохранить для юридических, security, fraud-prevention, dispute-resolution или похожих законных целей.",
          "Если исторические данные соревнований, прогнозов или лидербордов нужно сохранить для поддержания завершённых записей, Goalstery может хранить такую информацию в анонимизированном виде, чтобы она больше не была связана с вашей Telegram-идентичностью.",
        ],
      },
      "age-requirement": {
        title: "Возрастное требование",
        blocks: [
          "Goalstery предназначен только для пользователей, которым исполнилось 18 лет. Если вам меньше 18 лет, вы не должны использовать Goalstery.",
        ],
      },
      "international-use": {
        title: "Международное использование",
        blocks: [
          "Goalstery рассчитан на международную доступность. Поскольку Goalstery работает глобально, информация может обрабатываться в странах, отличных от страны вашего нахождения. Когда применимое право устанавливает специальные требования, Goalstery будет учитывать их применительно к Сервису.",
        ],
      },
      security: {
        title: "Безопасность",
        blocks: [
          "Goalstery использует разумные технические и организационные меры, направленные на защиту информации и поддержание безопасности Сервиса. Однако ни одна система, подключённая к интернету, не может гарантировать абсолютную безопасность.",
          "Вы отвечаете за безопасность своего аккаунта Telegram и любой информации о криптовалютном кошельке, которую решите предоставить для доставки приза.",
        ],
      },
      "your-rights": {
        title: "Ваши права",
        blocks: [
          "В зависимости от места вашего проживания применимое право может предоставлять права в отношении вашей персональной информации, включая права запрашивать доступ, исправление, удаление, ограничение или иные действия. Запросы можно подавать через официальный аккаунт поддержки Goalstery в Telegram, и Goalstery может потребоваться проверить аккаунт перед выполнением.",
        ],
      },
      "changes-to-this-privacy-policy": {
        title: "Изменения этой Политики конфиденциальности",
        blocks: [
          "Goalstery может обновлять эту Политику конфиденциальности при изменении Сервиса, технологий, поставщиков, рекламных практик или применимых требований. Текущая версия и дата обновления будут доступны через Goalstery. Существенные изменения могут сообщаться через Сервис, где это уместно.",
        ],
      },
      contact: {
        title: "Контакты",
        blocks: [
          "По вопросам конфиденциальности, запросам удаления аккаунта или другим связанным с privacy запросам обращайтесь в Goalstery через официальный аккаунт поддержки в Telegram. Следует использовать конкретный официальный аккаунт поддержки, показанный Goalstery, чтобы избежать подделки или мошеннических аккаунтов поддержки.",
        ],
      },
    },
  },
  de: {
    eyebrow: "SUPPORT & RECHTLICHES",
    title: "Datenschutzerklärung",
    subtitle: "Wie Goalstery mit deinen Daten umgeht.",
    version: "Version 1.0",
    lastUpdatedLabel: "Aktualisiert am 9. September 2026",
    contentsLabel: "Inhalt",
    authoritativeNotice:
      "Die englische Fassung dieser Datenschutzerklärung ist maßgeblich. Diese Übersetzung wird zu Informationszwecken bereitgestellt.",
    highlightsAriaLabel: "Datenschutz-Hinweise",
    highlights: [
      {
        tone: "privacy",
        title: "Deine Telegram-Privatsphäre",
        text: "Goalstery fordert keinen Zugriff auf deine Telegram-Nachrichten, Kontakte oder Telefonnummer an.",
      },
      {
        tone: "security",
        title: "Krypto-Sicherheit",
        text: "Wir werden niemals nach deiner Seed Phrase, deinem Private Key oder deinem Wallet-Passwort fragen.",
      },
    ],
    intro: [
      "Diese Datenschutzerklärung erklärt, wie Goalstery Informationen verarbeitet, wenn du die Goalstery Telegram Mini App nutzt.",
      "Durch die Nutzung von Goalstery bestätigst du die in dieser Datenschutzerklärung beschriebenen Praktiken.",
    ],
    sections: {
      "information-we-receive": {
        title: "Informationen, die wir erhalten",
        blocks: [
          "Goalstery wird als Telegram Mini App betrieben. Wenn du Goalstery nutzt, können wir Kontoinformationen erhalten, die über die Telegram Mini App-Schnittstelle verfügbar und notwendig sind, um dich zu identifizieren und den Service bereitzustellen.",
          [
            "deine Telegram user ID",
            "username",
            "Vor- und Nachname oder Anzeigename",
            "Profilfoto oder Avatar-Informationen",
            "Sprache oder andere kontobezogene Informationen, die über Telegram verfügbar sind",
          ],
          "Goalstery verlangt keinen separaten Benutzernamen und kein separates Passwort. Telegram ist ein unabhängiger Dienst und verarbeitet Informationen nach eigenen Bedingungen und Datenschutzpraktiken.",
          "Goalstery fordert keinen Zugriff auf deine Telegram-Nachrichten, Kontakte oder Telefonnummer an.",
        ],
      },
      "goalstery-activity-data": {
        title: "Goalstery-Aktivitätsdaten",
        blocks: [
          "Wir verarbeiten Informationen, die durch deine Nutzung von Goalstery entstehen, einschließlich Vorhersagen, Vorhersageergebnissen, Cups und anderen Wertungsinformationen, Ranglistenpositionen, Teilnahme an Cups und Wettbewerben, spielbezogener Aktivität, Profileinstellungen, Zeitstempeln und anderer Informationen, die für den Betrieb des Service erforderlich sind.",
          "Diese Informationen werden genutzt, um Gameplay, Wertung, Wettbewerbe, Ranglisten, Konto- und zugehörige Funktionen von Goalstery bereitzustellen.",
        ],
      },
      "technical-data": {
        title: "Technische Daten",
        blocks: [
          "Goalstery führt nicht bewusst ein separates Produktanalyseprofil auf Grundlage deiner IP-Adresse, deines Browsers, Geräts oder ähnlicher technischer Kennungen.",
          "Begrenzte technische Informationen können vorübergehend und notwendigerweise von Servern, Netzwerkinfrastruktur, Hosting-Systemen, Cloudflare, Telegram oder anderer Infrastruktur verarbeitet werden, die zur Bereitstellung und Absicherung des Service für Routing, Sicherheit, Missbrauchsprävention, Diagnose und zuverlässigen Betrieb erforderlich ist.",
        ],
      },
      "analytics-and-tracking": {
        title: "Analyse und Tracking",
        blocks: [
          "Goalstery betreibt derzeit kein eigenes System für Verhaltensanalyse oder Nutzertracking. Sollte sich dies wesentlich ändern, wird diese Datenschutzerklärung entsprechend aktualisiert.",
        ],
      },
      advertising: {
        title: "Werbung",
        blocks: [
          "Goalstery kann Werbung anzeigen. Goalstery benennt in dieser Datenschutzerklärung derzeit keinen bestimmten Werbeanbieter.",
          "Wenn Werbedienste Dritter eingeführt werden, können diese bestimmte technische, Werbe- oder Interaktionsinformationen nach ihren eigenen Datenschutzrichtlinien und geltendem Recht verarbeiten. Vor Einführung eines Werbeanbieters, dessen Verarbeitung die hier beschriebenen Praktiken wesentlich beeinflusst, kann Goalstery diese Datenschutzerklärung aktualisieren und gegebenenfalls zusätzliche Informationen bereitstellen.",
        ],
      },
      "how-we-use-information": {
        title: "Wie wir Informationen verwenden",
        blocks: [
          [
            "den Service bereitstellen und betreiben",
            "Nutzer über Telegram authentifizieren und identifizieren",
            "Vorhersagen und Spielergebnisse verarbeiten",
            "Cups, Ranglisten und Wettbewerbsergebnisse berechnen",
            "Ranglisten und Cups betreiben",
            "Nutzereinstellungen verwalten",
            "Betrug, Cheating, Missbrauch, Manipulation und unbefugten Zugriff verhindern",
            "technische Probleme untersuchen und Sicherheit aufrechterhalten",
            "Supportanfragen beantworten",
            "geltende rechtliche Pflichten erfüllen, soweit erforderlich",
          ],
          "Wir verkaufen deine personenbezogenen Informationen nicht.",
        ],
      },
      "infrastructure-and-service-providers": {
        title: "Infrastruktur und Dienstleister",
        blocks: [
          "Goalstery wird mit eigener Serverinfrastruktur betrieben, einschließlich eines privat verwalteten VPS, und nutzt Cloudflare für infrastrukturbzogene Dienste, die Netzwerkbereitstellung, Sicherheit, Traffic-Routing und Schutz des Service umfassen können.",
          "Goalstery nutzt Telegram als Plattform, über die die Mini App aufgerufen wird. Fußball- und Spielinformationen können von Drittanbietern für Sportdaten bezogen werden, einschließlich football-data.org; diese werden für Sportinformationen genutzt und sollen keine Goalstery-Nutzerprofile erhalten, nur weil du eine Vorhersage abgibst.",
          "Zusätzliche Infrastruktur oder Dienstleister können eingeführt werden, wenn dies für den Betrieb von Goalstery erforderlich ist. Diese Datenschutzerklärung wird aktualisiert, wenn eine Änderung die hier beschriebene Verarbeitung wesentlich beeinflusst.",
        ],
      },
      "prize-information": {
        title: "Preisinformationen",
        blocks: [
          "Einige Goalstery-Wettbewerbe können reale Preise anbieten, einschließlich Kryptowährungspreisen wie USDT oder GRAM. Die Teilnahme erfordert normalerweise nicht, dass du eine Kryptowallet-Adresse angibst.",
          "Wenn du berechtigt bist, einen Kryptowährungspreis zu erhalten, kannst du gebeten werden, Goalstery Support zu kontaktieren und freiwillig eine Wallet-Adresse bereitzustellen, die zur Zustellung des Preises erforderlich ist. Wallet-Informationen werden zur Prüfung und Abwicklung der jeweiligen Preiszahlung sowie für zugehörige Support- oder Compliance-Angelegenheiten verwendet.",
          "Goalstery wird niemals nach deiner Seed Phrase, deinem Private Key, deinem Wallet-Passwort oder ähnlichen geheimen Zugangsdaten fragen.",
        ],
      },
      "data-retention": {
        title: "Datenaufbewahrung",
        blocks: [
          "Goalstery bewahrt Informationen so lange auf, wie es für den Betrieb des Service, die Integrität von Wettbewerben und Ranglisten, Missbrauchsprävention, Streitbeilegung, Einhaltung geltender Pflichten und den Schutz des Service angemessen notwendig ist. Aufbewahrungsfristen können je nach Art der Information und Aufbewahrungsgrund variieren.",
        ],
      },
      "account-and-data-deletion": {
        title: "Konto- und Datenlöschung",
        blocks: [
          "Du kannst die Löschung deines Goalstery-Kontos und zugehöriger personenbezogener Informationen beantragen, indem du Goalstery Support über das offizielle Telegram-Supportkonto kontaktierst.",
          "Wenn ein gültiger Löschantrag bearbeitet wird, löscht oder anonymisiert Goalstery personenbezogene Informationen, die mit dem Konto verbunden sind, vorbehaltlich Informationen, die aus rechtlichen, Sicherheits-, Betrugspräventions-, Streitbeilegungs- oder ähnlichen legitimen Gründen angemessen aufbewahrt werden müssen.",
          "Wenn historische Wettbewerbs-, Vorhersage- oder Ranglisteninformationen zur Erhaltung abgeschlossener Aufzeichnungen bewahrt werden müssen, kann Goalstery diese Informationen anonymisiert aufbewahren, sodass sie nicht mehr mit deiner Telegram-Identität verbunden sind.",
        ],
      },
      "age-requirement": {
        title: "Altersanforderung",
        blocks: [
          "Goalstery ist nur für Nutzer bestimmt, die mindestens 18 Jahre alt sind. Wenn du unter 18 bist, darfst du Goalstery nicht nutzen.",
        ],
      },
      "international-use": {
        title: "Internationale Nutzung",
        blocks: [
          "Goalstery soll international zugänglich sein. Da Goalstery global betrieben wird, können Informationen in anderen Ländern verarbeitet werden als dem Land, in dem du dich befindest. Soweit geltendes Recht besondere Anforderungen stellt, wird Goalstery diese Anforderungen in Bezug auf den Service berücksichtigen.",
        ],
      },
      security: {
        title: "Sicherheit",
        blocks: [
          "Goalstery verwendet angemessene technische und organisatorische Maßnahmen, um Informationen zu schützen und die Sicherheit des Service aufrechtzuerhalten. Kein mit dem Internet verbundenes System kann jedoch absolute Sicherheit garantieren.",
          "Du bist verantwortlich für die Sicherheit deines Telegram-Kontos und aller Kryptowallet-Informationen, die du für die Preiszustellung bereitstellst.",
        ],
      },
      "your-rights": {
        title: "Deine Rechte",
        blocks: [
          "Je nachdem, wo du lebst, kann geltendes Recht Rechte in Bezug auf deine personenbezogenen Informationen gewähren, einschließlich Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung oder andere Maßnahmen. Anfragen können über das offizielle Goalstery-Telegram-Supportkonto gestellt werden; Goalstery muss das Konto möglicherweise vor der Bearbeitung prüfen.",
        ],
      },
      "changes-to-this-privacy-policy": {
        title: "Änderungen dieser Datenschutzerklärung",
        blocks: [
          "Goalstery kann diese Datenschutzerklärung aktualisieren, wenn sich der Service, seine Technologie, Anbieter, Werbepraktiken oder geltende Anforderungen ändern. Die aktuelle Version und das Datum der letzten Aktualisierung werden über Goalstery verfügbar gemacht. Wesentliche Änderungen können gegebenenfalls über den Service mitgeteilt werden.",
        ],
      },
      contact: {
        title: "Kontakt",
        blocks: [
          "Bei Datenschutzfragen, Anträgen auf Kontolöschung oder anderen datenschutzbezogenen Anfragen kontaktiere Goalstery über das offizielle Telegram-Supportkonto. Das von Goalstery angezeigte offizielle Supportkonto sollte genutzt werden, um Nachahmung oder betrügerische Supportkonten zu vermeiden.",
        ],
      },
    },
  },
  es: {
    eyebrow: "SOPORTE Y LEGAL",
    title: "Política de privacidad",
    subtitle: "Cómo Goalstery trata tus datos.",
    version: "Versión 1.0",
    lastUpdatedLabel: "Actualizado el 9 de septiembre de 2026",
    contentsLabel: "Contenido",
    authoritativeNotice:
      "La versión inglesa de esta Política de privacidad es la versión autorizada. Esta traducción se proporciona para comodidad del usuario.",
    highlightsAriaLabel: "Aspectos clave de privacidad",
    highlights: [
      {
        tone: "privacy",
        title: "Tu privacidad en Telegram",
        text: "Goalstery no solicita acceso a tus mensajes de Telegram, contactos ni número de teléfono.",
      },
      {
        tone: "security",
        title: "Seguridad cripto",
        text: "Nunca pediremos tu seed phrase, private key ni contraseña de wallet.",
      },
    ],
    intro: [
      "Esta Política de privacidad explica cómo Goalstery trata la información cuando usas la Telegram Mini App de Goalstery.",
      "Al usar Goalstery, reconoces las prácticas descritas en esta Política de privacidad.",
    ],
    sections: {
      "information-we-receive": {
        title: "Información que recibimos",
        blocks: [
          "Goalstery funciona como Telegram Mini App. Cuando usas Goalstery, podemos recibir información de cuenta disponible mediante la interfaz de Telegram Mini App que sea necesaria para identificarte y prestar el Servicio.",
          [
            "tu Telegram user ID",
            "username",
            "nombre y apellido o nombre visible",
            "foto de perfil o información de avatar",
            "idioma u otra información relacionada con la cuenta disponible mediante Telegram",
          ],
          "Goalstery no requiere un nombre de usuario ni contraseña separados. Telegram es un servicio independiente y procesa información según sus propios términos y prácticas de privacidad.",
          "Goalstery no solicita acceso a tus mensajes de Telegram, contactos ni número de teléfono.",
        ],
      },
      "goalstery-activity-data": {
        title: "Datos de actividad en Goalstery",
        blocks: [
          "Procesamos información generada por tu uso de Goalstery, incluidas predicciones, resultados de predicciones, Cups y otra información de puntuación, posiciones en clasificaciones, participación en Cups y competiciones, actividad relacionada con partidos, preferencias de perfil, ajustes, marcas de tiempo y otra información necesaria para operar el Servicio.",
          "Esta información se usa para proporcionar la experiencia de juego, puntuación, competiciones, clasificaciones, cuenta y funciones relacionadas de Goalstery.",
        ],
      },
      "technical-data": {
        title: "Datos técnicos",
        blocks: [
          "Goalstery no mantiene intencionalmente un perfil analítico de producto separado basado en tu dirección IP, navegador, dispositivo u otros identificadores técnicos similares.",
          "Cierta información técnica limitada puede ser procesada temporalmente por servidores, infraestructura de red, sistemas de hosting, Cloudflare, Telegram u otra infraestructura necesaria para entregar y proteger el Servicio con fines de enrutamiento, seguridad, prevención de abuso, diagnóstico y operación fiable.",
        ],
      },
      "analytics-and-tracking": {
        title: "Analítica y seguimiento",
        blocks: [
          "Goalstery no opera actualmente un sistema dedicado de analítica de comportamiento o seguimiento de usuarios. Si esto cambia de forma material, esta Política de privacidad se actualizará según corresponda.",
        ],
      },
      advertising: {
        title: "Publicidad",
        blocks: [
          "Goalstery puede mostrar publicidad. Goalstery no identifica actualmente un proveedor publicitario específico en esta Política de privacidad.",
          "Si se introducen servicios publicitarios de terceros, esos servicios pueden procesar cierta información técnica, publicitaria o de interacción conforme a sus propias políticas de privacidad y la ley aplicable. Antes de introducir un proveedor publicitario cuyo procesamiento afecte materialmente las prácticas descritas aquí, Goalstery puede actualizar esta Política de privacidad y proporcionar información adicional cuando corresponda.",
        ],
      },
      "how-we-use-information": {
        title: "Cómo usamos la información",
        blocks: [
          [
            "prestar y operar el Servicio",
            "autenticar e identificar usuarios mediante Telegram",
            "procesar predicciones y resultados de partidos",
            "calcular Cups, rankings y resultados de competiciones",
            "operar clasificaciones y Cups",
            "mantener preferencias de usuario",
            "prevenir fraude, trampas, abuso, manipulación y acceso no autorizado",
            "investigar problemas técnicos y mantener la seguridad",
            "responder solicitudes de soporte",
            "cumplir obligaciones legales aplicables cuando sea necesario",
          ],
          "No vendemos tu información personal.",
        ],
      },
      "infrastructure-and-service-providers": {
        title: "Infraestructura y proveedores de servicios",
        blocks: [
          "Goalstery se opera usando su propia infraestructura de servidores, incluido un VPS gestionado de forma privada, y usa Cloudflare para servicios de infraestructura que pueden incluir entrega de red, seguridad, enrutamiento de tráfico y protección del Servicio.",
          "Goalstery depende de Telegram como plataforma a través de la cual se accede a la Mini App. La información de fútbol y partidos puede obtenerse de proveedores externos de datos deportivos, incluido football-data.org, que se usan para información deportiva y no están destinados a recibir perfiles de usuarios de Goalstery simplemente porque envías una predicción.",
          "Puede introducirse infraestructura adicional o proveedores de servicios cuando sea necesario para operar Goalstery. Esta Política de privacidad se actualizará cuando un cambio afecte materialmente el procesamiento descrito aquí.",
        ],
      },
      "prize-information": {
        title: "Información sobre premios",
        blocks: [
          "Algunas competiciones de Goalstery pueden ofrecer premios reales, incluidos premios en criptomonedas como USDT o GRAM. La participación normalmente no requiere que proporciones una dirección de wallet de criptomonedas.",
          "Si eres elegible para recibir un premio en criptomonedas, es posible que se te pida contactar a Goalstery Support y proporcionar voluntariamente una dirección de wallet necesaria para entregar el premio. La información de wallet se usará para verificar y procesar el pago del premio aplicable y asuntos relacionados de soporte o cumplimiento.",
          "Goalstery nunca pedirá tu seed phrase, private key, contraseña de wallet ni credenciales secretas similares.",
        ],
      },
      "data-retention": {
        title: "Retención de datos",
        blocks: [
          "Goalstery conserva información durante el tiempo razonablemente necesario para operar el Servicio, mantener la integridad de competiciones y clasificaciones, prevenir abusos, resolver disputas, cumplir obligaciones aplicables y proteger el Servicio. Los plazos de retención pueden variar según el tipo de información y la razón de conservación.",
        ],
      },
      "account-and-data-deletion": {
        title: "Eliminación de cuenta y datos",
        blocks: [
          "Puedes solicitar la eliminación de tu cuenta de Goalstery y la información personal asociada contactando a Goalstery Support mediante la cuenta oficial de soporte de Telegram.",
          "Cuando se procese una solicitud válida de eliminación, Goalstery eliminará o anonimizará la información personal asociada con la cuenta, sujeto a información que deba conservarse razonablemente por motivos legales, de seguridad, prevención de fraude, resolución de disputas o fines legítimos similares.",
          "Cuando sea necesario conservar información histórica de competiciones, predicciones o clasificaciones para mantener registros completados, Goalstery puede conservar esa información de forma anonimizada para que ya no esté asociada con tu identidad de Telegram.",
        ],
      },
      "age-requirement": {
        title: "Requisito de edad",
        blocks: [
          "Goalstery está destinado solo a usuarios que tengan al menos 18 años. Si eres menor de 18 años, no debes usar Goalstery.",
        ],
      },
      "international-use": {
        title: "Uso internacional",
        blocks: [
          "Goalstery está pensado para ser accesible internacionalmente. Como Goalstery opera globalmente, la información puede procesarse en países distintos de aquel en el que te encuentras. Cuando la ley aplicable imponga requisitos específicos, Goalstery abordará esos requisitos según correspondan al Servicio.",
        ],
      },
      security: {
        title: "Seguridad",
        blocks: [
          "Goalstery usa medidas técnicas y organizativas razonables destinadas a proteger la información y mantener la seguridad del Servicio. Sin embargo, ningún sistema conectado a internet puede garantizar seguridad absoluta.",
          "Eres responsable de mantener la seguridad de tu cuenta de Telegram y de cualquier información de wallet de criptomonedas que decidas proporcionar para la entrega de premios.",
        ],
      },
      "your-rights": {
        title: "Tus derechos",
        blocks: [
          "Según dónde vivas, la ley aplicable puede otorgar derechos relativos a tu información personal, incluidos derechos a solicitar acceso, corrección, eliminación, restricción u otras acciones. Las solicitudes pueden enviarse mediante la cuenta oficial de soporte de Goalstery en Telegram, y Goalstery puede necesitar verificar la cuenta antes de actuar.",
        ],
      },
      "changes-to-this-privacy-policy": {
        title: "Cambios en esta Política de privacidad",
        blocks: [
          "Goalstery puede actualizar esta Política de privacidad cuando cambien el Servicio, su tecnología, sus proveedores, sus prácticas publicitarias o los requisitos aplicables. La versión actual y la fecha de última actualización estarán disponibles mediante Goalstery. Los cambios materiales pueden comunicarse mediante el Servicio cuando corresponda.",
        ],
      },
      contact: {
        title: "Contacto",
        blocks: [
          "Para preguntas de privacidad, solicitudes de eliminación de cuenta u otras solicitudes relacionadas con privacidad, contacta a Goalstery mediante su cuenta oficial de soporte de Telegram. Debe usarse la cuenta oficial específica mostrada por Goalstery para evitar suplantaciones o cuentas de soporte fraudulentas.",
        ],
      },
    },
  },
  ar: {
    eyebrow: "الدعم والوثائق القانونية",
    title: "سياسة الخصوصية",
    subtitle: "كيف يتعامل Goalstery مع بياناتك.",
    version: "الإصدار 1.0",
    lastUpdatedLabel: "آخر تحديث 9 سبتمبر 2026",
    contentsLabel: "المحتويات",
    authoritativeNotice:
      "النسخة الإنجليزية من سياسة الخصوصية هذه هي النسخة المعتمدة. توفر هذه الترجمة لراحة المستخدم.",
    highlightsAriaLabel: "أبرز نقاط الخصوصية",
    highlights: [
      {
        tone: "privacy",
        title: "خصوصية Telegram الخاصة بك",
        text: "لا يطلب Goalstery الوصول إلى رسائل Telegram أو جهات الاتصال أو رقم الهاتف.",
      },
      {
        tone: "security",
        title: "أمان العملات المشفرة",
        text: "لن نطلب أبدا seed phrase أو private key أو wallet password.",
      },
    ],
    intro: [
      "توضح سياسة الخصوصية هذه كيف يتعامل Goalstery مع المعلومات عند استخدامك Telegram Mini App الخاص بـ Goalstery.",
      "باستخدام Goalstery، فإنك تقر بالممارسات الموضحة في سياسة الخصوصية هذه.",
    ],
    sections: {
      "information-we-receive": {
        title: "المعلومات التي نتلقاها",
        blocks: [
          "يعمل Goalstery كتطبيق Telegram Mini App. عند استخدام Goalstery، قد نتلقى معلومات حساب متاحة عبر واجهة Telegram Mini App تكون ضرورية للتعرف عليك وتقديم الخدمة.",
          [
            "Telegram user ID الخاص بك",
            "username",
            "الاسم الأول واسم العائلة أو الاسم المعروض",
            "صورة الملف الشخصي أو معلومات الصورة الرمزية",
            "اللغة أو معلومات أخرى مرتبطة بالحساب ومتاحة عبر Telegram",
          ],
          "لا يتطلب Goalstery اسم مستخدم أو كلمة مرور منفصلين. Telegram خدمة مستقلة وتعالج المعلومات وفق شروطها وممارسات الخصوصية الخاصة بها.",
          "لا يطلب Goalstery الوصول إلى رسائل Telegram أو جهات الاتصال أو رقم الهاتف.",
        ],
      },
      "goalstery-activity-data": {
        title: "بيانات النشاط في Goalstery",
        blocks: [
          "نعالج المعلومات الناتجة عن استخدامك Goalstery، بما في ذلك التوقعات ونتائج التوقعات وCups ومعلومات التسجيل الأخرى ومراكز لوحات الترتيب والمشاركة في Cups والمسابقات والنشاط المرتبط بالمباريات وتفضيلات الملف الشخصي والإعدادات والطوابع الزمنية وغيرها من المعلومات الضرورية لتشغيل الخدمة.",
          "تستخدم هذه المعلومات لتوفير وظائف اللعب والتسجيل والمسابقات ولوحات الترتيب والحساب والوظائف ذات الصلة في Goalstery.",
        ],
      },
      "technical-data": {
        title: "البيانات التقنية",
        blocks: [
          "لا يحتفظ Goalstery عمدا بملف تحليلات منتج منفصل يستند إلى عنوان IP أو المتصفح أو الجهاز أو معرفات تقنية مماثلة.",
          "قد تتم معالجة معلومات تقنية محدودة مؤقتا وبالضرورة بواسطة الخوادم أو البنية الشبكية أو أنظمة الاستضافة أو Cloudflare أو Telegram أو بنية أخرى لازمة لتقديم الخدمة وتأمينها لأغراض التوجيه والأمان ومنع إساءة الاستخدام والتشخيص والتشغيل الموثوق.",
        ],
      },
      "analytics-and-tracking": {
        title: "التحليلات والتتبع",
        blocks: [
          "لا يشغل Goalstery حاليا نظاما مخصصا للتحليلات السلوكية أو تتبع المستخدمين. إذا تغير ذلك بشكل جوهري، فسيتم تحديث سياسة الخصوصية هذه حسب الاقتضاء.",
        ],
      },
      advertising: {
        title: "الإعلانات",
        blocks: [
          "قد يعرض Goalstery إعلانات. لا يحدد Goalstery حاليا مزود إعلانات معينا في سياسة الخصوصية هذه.",
          "إذا تم إدخال خدمات إعلانية من طرف ثالث، فقد تعالج تلك الخدمات معلومات تقنية أو إعلانية أو تفاعلية معينة وفقا لسياسات الخصوصية الخاصة بها والقانون المعمول به. قبل إدخال مزود إعلانات تؤثر معالجته بشكل جوهري في الممارسات الموضحة هنا، قد يحدث Goalstery سياسة الخصوصية هذه ويقدم معلومات إضافية عند الاقتضاء.",
        ],
      },
      "how-we-use-information": {
        title: "كيف نستخدم المعلومات",
        blocks: [
          [
            "تقديم الخدمة وتشغيلها",
            "مصادقة المستخدمين والتعرف عليهم عبر Telegram",
            "معالجة التوقعات ونتائج المباريات",
            "حساب Cups والترتيبات ونتائج المسابقات",
            "تشغيل لوحات الترتيب وCups",
            "الحفاظ على تفضيلات المستخدم",
            "منع الاحتيال والغش وإساءة الاستخدام والتلاعب والوصول غير المصرح به",
            "التحقيق في المشكلات التقنية والحفاظ على الأمان",
            "الرد على طلبات الدعم",
            "الامتثال للالتزامات القانونية المعمول بها عند اللزوم",
          ],
          "لا نبيع معلوماتك الشخصية.",
        ],
      },
      "infrastructure-and-service-providers": {
        title: "البنية التحتية ومقدمو الخدمات",
        blocks: [
          "يتم تشغيل Goalstery باستخدام بنيته التحتية الخاصة للخوادم، بما في ذلك VPS مدار بشكل خاص، ويستخدم Cloudflare لخدمات مرتبطة بالبنية التحتية قد تشمل التسليم الشبكي والأمان وتوجيه الحركة وحماية الخدمة.",
          "يعتمد Goalstery على Telegram كمنصة يتم من خلالها الوصول إلى Mini App. قد يتم الحصول على معلومات كرة القدم والمباريات من مزودي بيانات رياضية خارجيين، بما في ذلك football-data.org، وتستخدم هذه المعلومات للأغراض الرياضية ولا يقصد أن يتلقى هؤلاء المزودون ملفات مستخدمي Goalstery لمجرد أنك ترسل توقعا.",
          "قد يتم إدخال بنية تحتية أو مقدمي خدمات إضافيين عند الضرورة لتشغيل Goalstery. سيتم تحديث سياسة الخصوصية هذه عندما يؤثر تغيير ما بشكل جوهري في المعالجة الموضحة هنا.",
        ],
      },
      "prize-information": {
        title: "معلومات الجوائز",
        blocks: [
          "قد تقدم بعض مسابقات Goalstery جوائز حقيقية، بما في ذلك جوائز عملات مشفرة مثل USDT أو GRAM. لا تتطلب المشاركة عادة تقديم عنوان محفظة عملات مشفرة.",
          "إذا كنت مؤهلا لتلقي جائزة عملة مشفرة، فقد يطلب منك التواصل مع دعم Goalstery وتقديم عنوان محفظة طوعا يكون مطلوبا لتسليم الجائزة. ستستخدم معلومات المحفظة للتحقق من دفعة الجائزة المعنية ومعالجتها وما يرتبط بها من دعم أو مسائل امتثال.",
          "لن يطلب Goalstery أبدا seed phrase أو private key أو wallet password أو بيانات اعتماد سرية مماثلة.",
        ],
      },
      "data-retention": {
        title: "الاحتفاظ بالبيانات",
        blocks: [
          "يحتفظ Goalstery بالمعلومات طالما كان ذلك ضروريا بشكل معقول لتشغيل الخدمة والحفاظ على نزاهة المسابقات ولوحات الترتيب ومنع إساءة الاستخدام وحل النزاعات والامتثال للالتزامات المعمول بها وحماية الخدمة. قد تختلف مدد الاحتفاظ بحسب نوع المعلومات وسبب الاحتفاظ بها.",
        ],
      },
      "account-and-data-deletion": {
        title: "حذف الحساب والبيانات",
        blocks: [
          "يمكنك طلب حذف حسابك في Goalstery والمعلومات الشخصية المرتبطة به من خلال التواصل مع دعم Goalstery عبر حساب دعم Telegram الرسمي.",
          "عند معالجة طلب حذف صحيح، سيحذف Goalstery المعلومات الشخصية المرتبطة بالحساب أو يخفي هويتها، مع مراعاة المعلومات التي يجب الاحتفاظ بها بشكل معقول لأغراض قانونية أو أمنية أو منع الاحتيال أو حل النزاعات أو أغراض مشروعة مماثلة.",
          "عندما يلزم الاحتفاظ بمعلومات تاريخية عن المسابقات أو التوقعات أو لوحات الترتيب للحفاظ على السجلات المكتملة، قد يحتفظ Goalstery بتلك المعلومات بشكل مجهول بحيث لا تعود مرتبطة بهويتك في Telegram.",
        ],
      },
      "age-requirement": {
        title: "متطلب العمر",
        blocks: [
          "Goalstery مخصص فقط للمستخدمين الذين يبلغون 18 عاما على الأقل. إذا كان عمرك أقل من 18 عاما، فيجب ألا تستخدم Goalstery.",
        ],
      },
      "international-use": {
        title: "الاستخدام الدولي",
        blocks: [
          "يهدف Goalstery إلى أن يكون متاحا دوليا. وبما أن Goalstery يعمل عالميا، فقد تتم معالجة المعلومات في دول غير الدولة التي توجد فيها. عندما يفرض القانون المعمول به متطلبات محددة، سيتعامل Goalstery مع تلك المتطلبات حسب انطباقها على الخدمة.",
        ],
      },
      security: {
        title: "الأمان",
        blocks: [
          "يستخدم Goalstery تدابير تقنية وتنظيمية معقولة تهدف إلى حماية المعلومات والحفاظ على أمان الخدمة. ومع ذلك، لا يمكن لأي نظام متصل بالإنترنت أن يضمن الأمان المطلق.",
          "أنت مسؤول عن الحفاظ على أمان حساب Telegram الخاص بك وأي معلومات محفظة عملات مشفرة تختار تقديمها لتسليم الجائزة.",
        ],
      },
      "your-rights": {
        title: "حقوقك",
        blocks: [
          "بحسب مكان إقامتك، قد يمنحك القانون المعمول به حقوقا تتعلق بمعلوماتك الشخصية، وقد تشمل حقوق طلب الوصول أو التصحيح أو الحذف أو التقييد أو إجراءات أخرى. يمكن تقديم الطلبات عبر حساب دعم Goalstery الرسمي على Telegram، وقد يحتاج Goalstery إلى التحقق من الحساب قبل اتخاذ إجراء.",
        ],
      },
      "changes-to-this-privacy-policy": {
        title: "التغييرات على سياسة الخصوصية هذه",
        blocks: [
          "قد يحدث Goalstery سياسة الخصوصية هذه عندما تتغير الخدمة أو تقنيتها أو مقدموها أو ممارساتها الإعلانية أو المتطلبات المعمول بها. ستتاح النسخة الحالية وتاريخ آخر تحديث عبر Goalstery. قد يتم إبلاغ التغييرات الجوهرية عبر الخدمة عند الاقتضاء.",
        ],
      },
      contact: {
        title: "التواصل",
        blocks: [
          "لأسئلة الخصوصية أو طلبات حذف الحساب أو غيرها من الطلبات المرتبطة بالخصوصية، تواصل مع Goalstery عبر حساب دعم Telegram الرسمي. يجب استخدام حساب الدعم الرسمي المحدد الذي يعرضه Goalstery لتجنب انتحال الهوية أو حسابات الدعم الاحتيالية.",
        ],
      },
    },
  },
};

const termsTextByLocale: Record<TranslatedLocale, ILegalLocaleText> = {
  ru: {
    eyebrow: "ПОДДЕРЖКА И ДОКУМЕНТЫ",
    title: "Условия использования",
    subtitle: "Правила использования Goalstery.",
    version: "Версия 1.0",
    lastUpdatedLabel: "Обновлено 9 сентября 2026",
    contentsLabel: "Содержание",
    authoritativeNotice:
      "Английская версия этих Условий является авторитетной. Этот перевод предоставлен для удобства.",
    intro: [
      "Эти Условия использования регулируют использование вами Telegram Mini App Goalstery и связанных сервисов.",
      "Используя Goalstery, вы соглашаетесь с этими Условиями. Если вы не согласны с ними, не используйте Goalstery.",
    ],
    sections: {
      eligibility: {
        title: "Право на использование",
        blocks: [
          "Вам должно быть не менее 18 лет, чтобы использовать Goalstery. Вы отвечаете за то, чтобы использование Goalstery было разрешено применимыми к вам законами и правилами.",
          "Goalstery рассчитан на международную доступность, но отдельные функции, соревнования или призы могут быть доступны не в каждой стране или регионе.",
        ],
      },
      "telegram-account": {
        title: "Аккаунт Telegram",
        blocks: [
          "Goalstery использует Telegram для аутентификации и идентификации пользователей. Аккаунт Telegram соответствует аккаунту Goalstery для целей участия в Сервисе.",
          "Вы отвечаете за контроль и безопасность своего аккаунта Telegram и не должны использовать несколько аккаунтов Telegram для получения нечестного преимущества, манипуляции соревнованиями, обхода ограничений или иного злоупотребления Goalstery.",
        ],
      },
      "sports-predictions": {
        title: "Спортивные прогнозы",
        blocks: [
          "Goalstery позволяет пользователям делать прогнозы по футбольным матчам и участвовать в соревнованиях на основе прогнозов. Прогнозы должны отправляться в сроки и на условиях, указанных Goalstery.",
          "После блокировки прогноза или истечения применимого дедлайна его больше нельзя изменить, если Goalstery прямо не предусмотрит иное. Разные типы прогнозов могут иметь разные правила подсчёта в зависимости от их характера или сложности.",
        ],
      },
      "cups-and-in-app-scores": {
        title: "Cups и внутриигровые очки",
        blocks: [
          "Goalstery может использовать Cups, points, rankings или похожие показатели для измерения игрового результата. Cups являются исключительно внутриигровым механизмом подсчёта.",
          [
            "Cups не являются деньгами или криптовалютой",
            "Cups не имеют денежной стоимости",
            "Cups нельзя покупать, продавать, выводить или передавать между пользователями",
            "Cups нельзя обменивать на деньги, криптовалюту, товары или услуги",
            "Cups не являются финансовым счётом, балансом, депозитом, инвестицией или инструментом хранимой стоимости",
          ],
          "Накопление Cups само по себе не создаёт права на получение денег или криптовалюты.",
        ],
      },
      "free-participation": {
        title: "Бесплатное участие",
        blocks: [
          "Участие в соревнованиях Goalstery, включая соревнования, которые могут предлагать призы, не требует вступительного взноса.",
          "Goalstery не требует от пользователей ставить деньги, криптовалюту, Telegram Stars, Cups или иные ценности для участия в Cup. Покупка не требуется для участия в Prize Cup, если будущие правила прямо не установят иную юридически допустимую модель продукта и применимые условия не будут обновлены до такого участия.",
        ],
      },
      "prize-cups": {
        title: "Prize Cups",
        blocks: [
          "Некоторые Cups могут предлагать отдельно объявленные реальные призы, включая криптовалютные призы, такие как USDT или GRAM. Приз отделён от Cups, используемых как внутриигровой механизм подсчёта Goalstery.",
          "Применимый Prize Cup может иметь специальные правила об eligibility, датах, scoring, ranking, размере или типе приза, определении победителя, процедуре получения, географических ограничениях и других условиях конкретного соревнования.",
          "Если правила конкретного соревнования конфликтуют с этими общими Условиями относительно работы такого соревнования, специальные правила могут иметь преимущество в пределах, указанных в них, с учётом применимого права.",
        ],
      },
      "geographic-and-legal-restrictions-on-prize-cups": {
        title: "Географические и правовые ограничения Prize Cups",
        blocks: [
          "Goalstery может ограничить, исключить, приостановить или отказать в участии в конкретном Prize Cup пользователям из определённых стран, территорий или регионов, где проведение соревнования или предоставление приза может быть запрещено, ограничено, непрактично или требовать условий, которые Goalstery не может разумно выполнить.",
          "Доступность общего Сервиса Goalstery не гарантирует eligibility для каждого Prize Cup. Goalstery также может отказать или быть неспособен доставить приз, если это нарушит применимое право или обязательное правовое ограничение.",
          "Где это разумно возможно, применимые географические или eligibility ограничения должны сообщаться как часть правил соответствующего Prize Cup. Пользователи отвечают за то, чтобы участие в Prize Cup и получение приза были законны в их местоположении.",
        ],
      },
      "prize-claims-and-cryptocurrency-payments": {
        title: "Получение призов и криптовалютные выплаты",
        blocks: [
          "Если победитель имеет право на криптовалютный приз, от него может потребоваться связаться с официальным аккаунтом поддержки Goalstery и предоставить действительный адрес криптовалютного кошелька, совместимый с объявленным призом.",
          "Выплаты призов могут обрабатываться вручную. Победитель отвечает за предоставление точного и совместимого адреса кошелька. Blockchain-транзакции могут быть необратимыми, и Goalstery может быть не в состоянии вернуть приз, отправленный на неверный адрес, предоставленный победителем.",
          "Goalstery никогда не потребует private key, seed phrase, wallet password или эквивалентные секретные учётные данные победителя для отправки приза.",
          "Goalstery может потребовать разумную проверку перед доставкой приза, включая проверку того, что заявитель контролирует соответствующий аккаунт Goalstery и соответствует требованиям eligibility применимого Prize Cup.",
        ],
      },
      "taxes-and-other-obligations": {
        title: "Налоги и другие обязанности",
        blocks: [
          "Приз может иметь налоговые, отчётные, регуляторные или иные последствия в зависимости от местонахождения и обстоятельств победителя. Если применимое право не требует иного, получатель отвечает за определение и выполнение обязанностей, возникающих из получения приза. Goalstery не предоставляет налоговые, инвестиционные, финансовые или юридические консультации.",
        ],
      },
      "match-data-and-results": {
        title: "Данные и результаты матчей",
        blocks: [
          "Goalstery может использовать сторонние источники, включая football-data.org и другие подходящие источники, для расписания, статуса матчей, счёта и другой футбольной информации. Сторонние спортивные данные могут содержать задержки, ошибки, исправления или несоответствия.",
          "Goalstery не гарантирует, что сторонняя информация о матчах всегда будет полной, мгновенной или безошибочной. Для scoring, settlement, competitions и leaderboards Goalstery окончательно определяет результат матча и settlement information, используемые Сервисом.",
        ],
      },
      "corrections-and-recalculation": {
        title: "Исправления и пересчёт",
        blocks: [
          "Если информация о матче, settlement information, scoring или результаты соревнования неверны из-за ошибки данных, технической проблемы, ошибки расчёта, исправленного официального результата или похожей причины, Goalstery может исправить затронутую информацию.",
          "Такое исправление может привести к пересчёту prediction outcomes, Cups, rankings, leaderboard positions, competition results и winner determination. Изменения правил scoring обычно должны применяться на будущее, но это не мешает Goalstery исправлять исторические результаты, когда это нужно для устранения ошибки или сохранения целостности соревнования.",
        ],
      },
      "postponed-cancelled-or-unresolved-matches": {
        title: "Перенесённые, отменённые или неразрешённые матчи",
        blocks: [
          "Если матч перенесён, отменён, прерван, приостановлен или иначе не имеет результата, который Goalstery считает подходящим для settlement, затронутые прогнозы могут оставаться pending, пока Goalstery не определит, что информации достаточно для settlement, или не выберет другое подходящее решение по применимым правилам соревнования.",
        ],
      },
      "fair-play": {
        title: "Честная игра",
        blocks: [
          "Goalstery предназначен для честной конкуренции между пользователями. Вы не должны использовать bots или автоматические системы для взаимодействия с Goalstery или отправки прогнозов, эксплуатировать ошибки или непредусмотренное поведение, манипулировать rankings, Cups, competition results или leaderboards, использовать несколько аккаунтов для нечестного преимущества, выдавать себя за другого пользователя, вмешиваться в APIs, servers, infrastructure или security, обходить ограничения, фальсифицировать eligibility information либо участвовать в мошенничестве или ином злоупотреблении.",
          "Использование статистики, математических моделей, искусственного интеллекта, исследований или других аналитических инструментов для выбора прогноза само по себе не запрещено, если взаимодействие с Goalstery соответствует этим Условиям и не является автоматизированным или злоупотребляющим.",
        ],
      },
      enforcement: {
        title: "Меры enforcement",
        blocks: [
          "Если Goalstery разумно определит, что пользователь нарушил эти Условия, злоупотребил Сервисом, манипулировал соревнованием или поставил под угрозу безопасность или целостность Goalstery, Goalstery может принять соответствующие меры.",
          "Это может включать признание затронутых прогнозов недействительными, исправление Cups или рейтингов, удаление пользователя из соревнования, отмену eligibility на приз, полученный через нарушение, постоянную блокировку аккаунта Goalstery и разумные технические меры для предотвращения дальнейших злоупотреблений.",
        ],
      },
      advertising: {
        title: "Реклама",
        blocks: [
          "Goalstery может содержать рекламу или ссылки на сторонние продукты, сервисы или сайты. Наличие рекламы не является одобрением Goalstery, если прямо не указано иное. Сторонние сервисы регулируются собственными условиями и практиками конфиденциальности.",
        ],
      },
      "service-availability": {
        title: "Доступность Сервиса",
        blocks: [
          "Goalstery может развиваться со временем. Функции, типы прогнозов, системы scoring, соревнования, поставщики данных и другие аспекты Сервиса могут добавляться, изменяться, приостанавливаться или прекращаться.",
          "Goalstery не гарантирует непрерывную или безошибочную доступность Сервиса или постоянную доступность конкретного матча, соревнования, функции или Prize Cup. Где это разумно возможно, изменения, существенно влияющие на активное соревнование, должны обрабатываться способом, направленным на сохранение целостности соревнования.",
        ],
      },
      "no-financial-or-betting-advice": {
        title: "Нет финансовых советов или советов по ставкам",
        blocks: [
          "Информация, представленная через Goalstery, предоставляется для работы и использования Сервиса. Goalstery не предоставляет advice по ставкам, инвестициям, финансам, налогам или праву. Пользователи не должны рассматривать прогнозы, рейтинги, статистику или иной контент Goalstery как рекомендации к финансовым транзакциям или ставкам.",
        ],
      },
      "intellectual-property": {
        title: "Интеллектуальная собственность",
        blocks: [
          "Программное обеспечение, интерфейс, branding, оригинальный контент, дизайн и другие proprietary materials Goalstery защищены применимыми правами интеллектуальной собственности. Сторонние trademarks, названия футбольных соревнований, названия команд, данные и другие сторонние материалы остаются собственностью соответствующих владельцев.",
          "Вы можете использовать Goalstery только для предусмотренного личного использования, если Goalstery прямо не разрешит иное.",
        ],
      },
      disclaimer: {
        title: "Отказ от гарантий",
        blocks: [
          "Goalstery предоставляется на условиях доступности. В пределах, разрешённых применимым правом, Goalstery не гарантирует, что Сервис всегда будет непрерывным, полностью точным, безопасным или свободным от дефектов. Ничто в этих Условиях не исключает права или защиты, которые нельзя законно исключить.",
        ],
      },
      "limitation-of-liability": {
        title: "Ограничение ответственности",
        blocks: [
          "В пределах, разрешённых применимым правом, Goalstery не несёт ответственности за indirect, incidental, special или consequential losses, возникающие из использования или невозможности использования Сервиса. Любое ограничение применяется только в той мере, в какой это разрешено законом, применимым к конкретному пользователю или требованию. Ничто не ограничивает ответственность там, где такое ограничение запрещено применимым правом.",
        ],
      },
      "changes-to-these-terms": {
        title: "Изменения этих Условий",
        blocks: [
          "Goalstery может обновлять эти Условия при изменении Сервиса, соревнований, технологий, бизнес-модели или применимых требований. Текущая версия и дата обновления будут доступны через Goalstery. Существенные изменения могут сообщаться через Сервис, где это уместно.",
          "Изменения обычно не должны задним числом менять результаты завершённых соревнований, кроме случаев, когда это необходимо для исправления ошибок, устранения злоупотреблений, соблюдения применимых требований или сохранения целостности соревнования.",
        ],
      },
      language: {
        title: "Язык",
        blocks: [
          "Английская версия этих Условий является авторитетной. Переводы могут предоставляться для удобства. При конфликте или несоответствии между английской версией и переводом английская версия имеет преимущество в пределах, разрешённых применимым правом.",
        ],
      },
      contact: {
        title: "Контакты",
        blocks: [
          "Вопросы об этих Условиях, соревнованиях, получении призов, удалении аккаунта или Сервисе можно направлять через официальный аккаунт поддержки Goalstery в Telegram. Пользователям следует полагаться на аккаунт поддержки, указанный внутри Goalstery, чтобы избежать подделки или мошеннических аккаунтов поддержки.",
        ],
      },
    },
  },
  de: {
    eyebrow: "SUPPORT & RECHTLICHES",
    title: "Nutzungsbedingungen",
    subtitle: "Die Regeln für die Nutzung von Goalstery.",
    version: "Version 1.0",
    lastUpdatedLabel: "Aktualisiert am 9. September 2026",
    contentsLabel: "Inhalt",
    authoritativeNotice:
      "Die englische Fassung dieser Nutzungsbedingungen ist maßgeblich. Diese Übersetzung wird zu Informationszwecken bereitgestellt.",
    intro: [
      "Diese Nutzungsbedingungen regeln deine Nutzung der Goalstery Telegram Mini App und der damit verbundenen Dienste.",
      "Durch die Nutzung von Goalstery stimmst du diesen Bedingungen zu. Wenn du ihnen nicht zustimmst, nutze Goalstery nicht.",
    ],
    sections: {
      eligibility: {
        title: "Teilnahmeberechtigung",
        blocks: [
          "Du musst mindestens 18 Jahre alt sein, um Goalstery zu nutzen. Du bist dafür verantwortlich sicherzustellen, dass deine Nutzung von Goalstery nach den für dich geltenden Gesetzen und Vorschriften erlaubt ist.",
          "Goalstery soll international verfügbar sein, bestimmte Funktionen, Wettbewerbe oder Preise können jedoch nicht in jedem Land oder jeder Region verfügbar sein.",
        ],
      },
      "telegram-account": {
        title: "Telegram-Konto",
        blocks: [
          "Goalstery nutzt Telegram zur Authentifizierung und Identifizierung von Nutzern. Ein Telegram-Konto entspricht für die Teilnahme am Service einem Goalstery-Konto.",
          "Du bist für Kontrolle und Sicherheit deines Telegram-Kontos verantwortlich und darfst nicht mehrere Telegram-Konten verwenden, um einen unfairen Vorteil zu erlangen, Wettbewerbe zu manipulieren, Beschränkungen zu umgehen oder Goalstery anderweitig zu missbrauchen.",
        ],
      },
      "sports-predictions": {
        title: "Sportvorhersagen",
        blocks: [
          "Goalstery ermöglicht Nutzern, Vorhersagen zu Fußballspielen abzugeben und an vorhersagebasierten Wettbewerben teilzunehmen. Vorhersagen müssen innerhalb der von Goalstery angegebenen Zeiten und Bedingungen eingereicht werden.",
          "Sobald eine Vorhersage gesperrt ist oder die geltende Frist abgelaufen ist, kann sie nicht mehr geändert werden, es sei denn, Goalstery sieht ausdrücklich etwas anderes vor. Verschiedene Vorhersagetypen können je nach Art oder Schwierigkeit unterschiedliche Wertungsregeln haben.",
        ],
      },
      "cups-and-in-app-scores": {
        title: "Cups und In-App-Wertungen",
        blocks: [
          "Goalstery kann Cups, Punkte, Ranglisten oder ähnliche Kennzahlen verwenden, um die Spielleistung zu messen. Cups sind ausschließlich ein In-App-Wertungsmechanismus.",
          [
            "Cups sind kein Geld und keine Kryptowährung",
            "Cups haben keinen Barwert",
            "Cups können nicht gekauft, verkauft, ausgezahlt oder zwischen Nutzern übertragen werden",
            "Cups können nicht gegen Geld, Kryptowährung, Waren oder Dienstleistungen eingetauscht werden",
            "Cups stellen kein Finanzkonto, Guthaben, Depot, Investment oder gespeichertes Wertinstrument dar",
          ],
          "Das Ansammeln von Cups begründet für sich genommen keinen Anspruch auf Geld oder Kryptowährung.",
        ],
      },
      "free-participation": {
        title: "Kostenlose Teilnahme",
        blocks: [
          "Die Teilnahme an Goalstery-Wettbewerben, einschließlich Wettbewerben, die Preise anbieten können, erfordert kein Startgeld.",
          "Goalstery verlangt von Nutzern nicht, Geld, Kryptowährung, Telegram Stars, Cups oder andere Wertgegenstände zu setzen, um an einem Cup teilzunehmen. Für die Teilnahme an einem Prize Cup ist kein Kauf erforderlich, sofern künftige Regeln nicht ausdrücklich ein anderes rechtlich zulässiges Produktmodell festlegen und die geltenden Bedingungen vor dieser Teilnahme aktualisiert werden.",
        ],
      },
      "prize-cups": {
        title: "Prize Cups",
        blocks: [
          "Bestimmte Cups können separat angekündigte reale Preise anbieten, einschließlich Kryptowährungspreisen wie USDT oder GRAM. Ein Preis ist getrennt von den Cups, die als In-App-Wertungsmechanismus von Goalstery verwendet werden.",
          "Der jeweilige Prize Cup kann besondere Regeln zu Teilnahmeberechtigung, Terminen, Wertung, Rangfolge, Preisbetrag oder -art, Gewinnerermittlung, Anspruchsverfahren, geografischen Beschränkungen und anderen wettbewerbsspezifischen Bedingungen haben.",
          "Wenn wettbewerbsspezifische Regeln diesen allgemeinen Bedingungen für den Betrieb dieses Wettbewerbs widersprechen, können die speziellen Regeln in dem dort angegebenen Umfang und vorbehaltlich geltenden Rechts Vorrang haben.",
        ],
      },
      "geographic-and-legal-restrictions-on-prize-cups": {
        title: "Geografische und rechtliche Beschränkungen für Prize Cups",
        blocks: [
          "Goalstery kann die Teilnahme an einem bestimmten Prize Cup für Nutzer in bestimmten Ländern, Gebieten oder Regionen beschränken, ausschließen, aussetzen oder verweigern, wenn das Angebot des Wettbewerbs oder Preises verboten, eingeschränkt, unpraktikabel oder an Anforderungen gebunden sein kann, die Goalstery vernünftigerweise nicht erfüllen kann.",
          "Die Verfügbarkeit des allgemeinen Goalstery-Service garantiert keine Berechtigung für jeden Prize Cup. Goalstery kann außerdem ablehnen oder nicht in der Lage sein, einen Preis zu liefern, wenn dies geltendes Recht oder eine verbindliche rechtliche Beschränkung verletzen würde.",
          "Soweit vernünftigerweise möglich, sollten geografische oder Teilnahmebeschränkungen als Teil der jeweiligen Prize Cup-Regeln mitgeteilt werden. Nutzer sind dafür verantwortlich sicherzustellen, dass Teilnahme an einem Prize Cup und Erhalt eines Preises an ihrem Standort rechtmäßig sind.",
        ],
      },
      "prize-claims-and-cryptocurrency-payments": {
        title: "Preisansprüche und Kryptowährungszahlungen",
        blocks: [
          "Wenn ein Gewinner Anspruch auf einen Kryptowährungspreis hat, kann er verpflichtet sein, das offizielle Goalstery-Supportkonto zu kontaktieren und eine gültige Kryptowallet-Adresse anzugeben, die mit dem angekündigten Preis kompatibel ist.",
          "Preiszahlungen können manuell verarbeitet werden. Der Gewinner ist dafür verantwortlich, eine genaue und kompatible Wallet-Adresse bereitzustellen. Blockchain-Transaktionen können unumkehrbar sein, und Goalstery kann einen an eine vom Gewinner angegebene falsche Adresse gesendeten Preis möglicherweise nicht wiederherstellen.",
          "Goalstery wird niemals den Private Key, die Seed Phrase, das Wallet-Passwort oder gleichwertige geheime Zugangsdaten eines Gewinners verlangen, um einen Preis zu senden.",
          "Goalstery kann vor der Zustellung eines Preises eine angemessene Prüfung verlangen, einschließlich der Prüfung, dass der Anspruchsteller das betreffende Goalstery-Konto kontrolliert und die Teilnahmevoraussetzungen des jeweiligen Prize Cup erfüllt.",
        ],
      },
      "taxes-and-other-obligations": {
        title: "Steuern und andere Pflichten",
        blocks: [
          "Ein Preis kann je nach Standort und Umständen des Gewinners steuerliche, meldebezogene, regulatorische oder andere Folgen haben. Sofern geltendes Recht nichts anderes verlangt, ist der Empfänger dafür verantwortlich, Pflichten aus dem Erhalt eines Preises zu bestimmen und zu erfüllen. Goalstery erteilt keine Steuer-, Anlage-, Finanz- oder Rechtsberatung.",
        ],
      },
      "match-data-and-results": {
        title: "Spieldaten und Ergebnisse",
        blocks: [
          "Goalstery kann Drittquellen, einschließlich football-data.org und anderer geeigneter Quellen, für Spielpläne, Spielstatus, Ergebnisse und andere Fußballinformationen verwenden. Sportdaten Dritter können Verzögerungen, Fehler, Korrekturen oder Unstimmigkeiten enthalten.",
          "Goalstery garantiert nicht, dass Spielinformationen Dritter immer vollständig, unmittelbar oder fehlerfrei sind. Für Wertung, Abrechnung, Wettbewerbe und Ranglisten trifft Goalstery die endgültige Bestimmung des Spielergebnisses und der vom Service verwendeten Abrechnungsinformationen.",
        ],
      },
      "corrections-and-recalculation": {
        title: "Korrekturen und Neuberechnung",
        blocks: [
          "Wenn Spielinformationen, Abrechnungsinformationen, Wertung oder Wettbewerbsergebnisse wegen eines Datenfehlers, technischen Problems, Rechenfehlers, korrigierten offiziellen Ergebnisses oder ähnlichen Problems falsch sind, kann Goalstery die betroffenen Informationen korrigieren.",
          "Eine solche Korrektur kann zur Neuberechnung von Vorhersageergebnissen, Cups, Ranglisten, Leaderboard-Positionen, Wettbewerbsergebnissen und Gewinnerermittlung führen. Änderungen an Wertungsregeln sollten grundsätzlich nur künftig gelten, hindern Goalstery aber nicht daran, historische Ergebnisse zu korrigieren, wenn dies zur Fehlerbehebung oder Wahrung der Wettbewerbsintegrität erforderlich ist.",
        ],
      },
      "postponed-cancelled-or-unresolved-matches": {
        title: "Verschobene, abgesagte oder ungeklärte Spiele",
        blocks: [
          "Wenn ein Spiel verschoben, abgesagt, abgebrochen, unterbrochen oder sonst ohne Ergebnis ist, das Goalstery für die Abrechnung geeignet hält, können betroffene Vorhersagen offen bleiben, bis Goalstery feststellt, dass ausreichende Informationen zur Abrechnung vorliegen, oder eine andere angemessene Lösung nach den geltenden Wettbewerbsregeln bestimmt.",
        ],
      },
      "fair-play": {
        title: "Fair Play",
        blocks: [
          "Goalstery soll fairen Wettbewerb zwischen Nutzern ermöglichen. Du darfst keine Bots oder automatisierten Systeme verwenden, um mit Goalstery zu interagieren oder Vorhersagen einzureichen, keine Fehler oder unbeabsichtigtes Verhalten ausnutzen, Ranglisten, Cups, Wettbewerbsergebnisse oder Leaderboards manipulieren, keine Mehrfachkonten für unfaire Vorteile nutzen, dich nicht als anderer Nutzer ausgeben, nicht in APIs, Server, Infrastruktur oder Sicherheit eingreifen, keine Beschränkungen umgehen, keine Teilnahmeinformationen fälschen und keinen Betrug oder sonstigen Missbrauch begehen.",
          "Statistiken, mathematische Modelle, künstliche Intelligenz, Recherchen oder andere Analysewerkzeuge zu nutzen, um eine Vorhersage zu wählen, ist für sich genommen nicht verboten, sofern die Interaktion mit Goalstery diesen Bedingungen entspricht und nicht automatisiert oder missbräuchlich ist.",
        ],
      },
      enforcement: {
        title: "Durchsetzung",
        blocks: [
          "Wenn Goalstery vernünftigerweise feststellt, dass ein Nutzer diese Bedingungen verletzt, den Service missbraucht, einen Wettbewerb manipuliert oder die Sicherheit oder Integrität von Goalstery gefährdet hat, kann Goalstery geeignete Maßnahmen ergreifen.",
          "Dazu können das Ungültigmachen betroffener Vorhersagen, die Korrektur von Cups oder Ranglisten, der Ausschluss des Nutzers aus einem Wettbewerb, die Aufhebung der Preisberechtigung aus einem Verstoß, die dauerhafte Sperrung des Goalstery-Kontos und angemessene technische Maßnahmen zur Verhinderung weiteren Missbrauchs gehören.",
        ],
      },
      advertising: {
        title: "Werbung",
        blocks: [
          "Goalstery kann Werbung oder Links zu Produkten, Diensten oder Websites Dritter enthalten. Das Vorhandensein von Werbung stellt keine Empfehlung durch Goalstery dar, sofern nicht ausdrücklich anders angegeben. Dienste Dritter unterliegen ihren eigenen Bedingungen und Datenschutzpraktiken.",
        ],
      },
      "service-availability": {
        title: "Verfügbarkeit des Service",
        blocks: [
          "Goalstery kann sich im Laufe der Zeit weiterentwickeln. Funktionen, Vorhersagetypen, Wertungssysteme, Wettbewerbe, Datenanbieter und andere Aspekte des Service können hinzugefügt, geändert, ausgesetzt oder eingestellt werden.",
          "Goalstery garantiert keine unterbrechungsfreie oder fehlerfreie Verfügbarkeit des Service oder die dauerhafte Verfügbarkeit eines bestimmten Spiels, Wettbewerbs, Features oder Prize Cup. Soweit vernünftigerweise möglich, sollten Änderungen, die einen aktiven Wettbewerb wesentlich betreffen, in einer Weise behandelt werden, die die Wettbewerbsintegrität wahrt.",
        ],
      },
      "no-financial-or-betting-advice": {
        title: "Keine Finanz- oder Wettberatung",
        blocks: [
          "Informationen, die über Goalstery dargestellt werden, dienen dem Betrieb und der Nutzung des Service. Goalstery erteilt keine Wett-, Anlage-, Finanz-, Steuer- oder Rechtsberatung. Nutzer sollten Goalstery-Vorhersagen, Ranglisten, Statistiken oder andere Inhalte nicht als Empfehlung für Finanztransaktionen oder Wetten verstehen.",
        ],
      },
      "intellectual-property": {
        title: "Geistiges Eigentum",
        blocks: [
          "Software, Oberfläche, Branding, ursprüngliche Inhalte, Design und andere geschützte Materialien von Goalstery sind durch geltende Rechte des geistigen Eigentums geschützt. Marken Dritter, Namen von Fußballwettbewerben, Teamnamen, Daten und andere Materialien Dritter bleiben Eigentum ihrer jeweiligen Inhaber.",
          "Du darfst Goalstery nur für den vorgesehenen persönlichen Gebrauch nutzen, sofern Goalstery nicht ausdrücklich etwas anderes erlaubt.",
        ],
      },
      disclaimer: {
        title: "Haftungsausschluss",
        blocks: [
          "Goalstery wird auf Grundlage der jeweiligen Verfügbarkeit bereitgestellt. Soweit nach geltendem Recht zulässig, garantiert Goalstery nicht, dass der Service jederzeit unterbrechungsfrei, vollständig korrekt, sicher oder frei von Mängeln ist. Nichts in diesen Bedingungen schließt Rechte oder Schutzvorschriften aus, die rechtlich nicht ausgeschlossen werden können.",
        ],
      },
      "limitation-of-liability": {
        title: "Haftungsbeschränkung",
        blocks: [
          "Soweit nach geltendem Recht zulässig, ist Goalstery nicht verantwortlich für mittelbare, zufällige, besondere oder Folgeschäden, die aus der Nutzung oder Unmöglichkeit der Nutzung des Service entstehen. Jede Beschränkung gilt nur in dem Umfang, der nach dem für den jeweiligen Nutzer oder Anspruch geltenden Recht zulässig ist. Nichts beschränkt eine Haftung, soweit eine solche Beschränkung nach geltendem Recht verboten ist.",
        ],
      },
      "changes-to-these-terms": {
        title: "Änderungen dieser Bedingungen",
        blocks: [
          "Goalstery kann diese Bedingungen aktualisieren, wenn sich Service, Wettbewerbe, Technologie, Geschäftsmodell oder geltende Anforderungen ändern. Die aktuelle Version und das Datum der letzten Aktualisierung werden über Goalstery verfügbar gemacht. Wesentliche Änderungen können gegebenenfalls über den Service mitgeteilt werden.",
          "Änderungen sollten abgeschlossene Wettbewerbsergebnisse grundsätzlich nicht rückwirkend verändern, außer wenn dies zur Fehlerkorrektur, Bekämpfung von Missbrauch, Einhaltung geltender Anforderungen oder Wahrung der Wettbewerbsintegrität erforderlich ist.",
        ],
      },
      language: {
        title: "Sprache",
        blocks: [
          "Die englische Fassung dieser Bedingungen ist maßgeblich. Übersetzungen können zur Erleichterung bereitgestellt werden. Bei Konflikten oder Unstimmigkeiten zwischen der englischen Fassung und einer Übersetzung ist die englische Fassung maßgeblich, soweit dies nach geltendem Recht zulässig ist.",
        ],
      },
      contact: {
        title: "Kontakt",
        blocks: [
          "Fragen zu diesen Bedingungen, Wettbewerben, Preisansprüchen, Kontolöschung oder dem Service können über das offizielle Goalstery-Telegram-Supportkonto gestellt werden. Nutzer sollten sich auf das in Goalstery angegebene Supportkonto verlassen, um Nachahmung oder betrügerische Supportkonten zu vermeiden.",
        ],
      },
    },
  },
  es: {
    eyebrow: "SOPORTE Y LEGAL",
    title: "Términos de uso",
    subtitle: "Las reglas para usar Goalstery.",
    version: "Versión 1.0",
    lastUpdatedLabel: "Actualizado el 9 de septiembre de 2026",
    contentsLabel: "Contenido",
    authoritativeNotice:
      "La versión inglesa de estos Términos es la versión autorizada. Esta traducción se proporciona para comodidad del usuario.",
    intro: [
      "Estos Términos de uso rigen tu uso de la Telegram Mini App de Goalstery y los servicios relacionados.",
      "Al usar Goalstery, aceptas estos Términos. Si no los aceptas, no uses Goalstery.",
    ],
    sections: {
      eligibility: {
        title: "Elegibilidad",
        blocks: [
          "Debes tener al menos 18 años para usar Goalstery. Eres responsable de asegurarte de que tu uso de Goalstery esté permitido por las leyes y regulaciones aplicables a ti.",
          "Goalstery está pensado para estar disponible internacionalmente, pero determinadas funciones, competiciones o premios pueden no estar disponibles en todos los países o regiones.",
        ],
      },
      "telegram-account": {
        title: "Cuenta de Telegram",
        blocks: [
          "Goalstery usa Telegram para autenticar e identificar usuarios. Una cuenta de Telegram corresponde a una cuenta de Goalstery a efectos de participación en el Servicio.",
          "Eres responsable de mantener el control y la seguridad de tu cuenta de Telegram y no debes usar varias cuentas de Telegram para obtener una ventaja injusta, manipular competiciones, eludir restricciones o abusar de Goalstery de otro modo.",
        ],
      },
      "sports-predictions": {
        title: "Predicciones deportivas",
        blocks: [
          "Goalstery permite a los usuarios hacer predicciones sobre partidos de fútbol y participar en competiciones basadas en predicciones. Las predicciones deben enviarse dentro del tiempo y las condiciones especificadas por Goalstery.",
          "Una vez que una predicción está bloqueada o ha pasado el plazo aplicable, ya no puede cambiarse salvo que Goalstery disponga expresamente lo contrario. Distintos tipos de predicción pueden tener reglas de puntuación diferentes según su naturaleza o dificultad.",
        ],
      },
      "cups-and-in-app-scores": {
        title: "Cups y puntuaciones dentro de la app",
        blocks: [
          "Goalstery puede usar Cups, puntos, rankings o métricas similares para medir el rendimiento de juego. Los Cups son únicamente un mecanismo de puntuación dentro de la app.",
          [
            "Los Cups no son dinero ni criptomoneda",
            "Los Cups no tienen valor en efectivo",
            "Los Cups no pueden comprarse, venderse, retirarse ni transferirse entre usuarios",
            "Los Cups no pueden cambiarse por dinero, criptomonedas, bienes o servicios",
            "Los Cups no constituyen una cuenta financiera, saldo, depósito, inversión ni instrumento de valor almacenado",
          ],
          "Acumular Cups no crea por sí mismo un derecho a recibir dinero o criptomonedas.",
        ],
      },
      "free-participation": {
        title: "Participación gratuita",
        blocks: [
          "La participación en competiciones de Goalstery, incluidas las que puedan ofrecer premios, no requiere una cuota de entrada.",
          "Goalstery no exige a los usuarios apostar dinero, criptomonedas, Telegram Stars, Cups u otros elementos de valor para entrar en un Cup. No es necesaria ninguna compra para participar en un Prize Cup salvo que reglas futuras establezcan expresamente un modelo de producto distinto legalmente permitido y los términos aplicables se actualicen antes de dicha participación.",
        ],
      },
      "prize-cups": {
        title: "Prize Cups",
        blocks: [
          "Algunos Cups pueden ofrecer premios reales anunciados por separado, incluidos premios en criptomonedas como USDT o GRAM. Un premio es independiente de los Cups usados como mecanismo de puntuación interno de Goalstery.",
          "El Prize Cup aplicable puede tener reglas específicas sobre elegibilidad, fechas, puntuación, ranking, importe o tipo de premio, determinación de ganadores, procedimiento de reclamación, restricciones geográficas y otras condiciones específicas de la competición.",
          "Cuando las reglas específicas de una competición entren en conflicto con estos Términos generales respecto del funcionamiento de esa competición, las reglas específicas podrán prevalecer en la medida indicada en ellas, sujeto a la ley aplicable.",
        ],
      },
      "geographic-and-legal-restrictions-on-prize-cups": {
        title: "Restricciones geográficas y legales de Prize Cups",
        blocks: [
          "Goalstery puede restringir, excluir, suspender o rechazar la participación en un Prize Cup concreto para usuarios de ciertos países, territorios o regiones donde ofrecer la competición o el premio pueda estar prohibido, restringido, resultar impracticable o estar sujeto a requisitos que Goalstery no pueda cumplir razonablemente.",
          "La disponibilidad del Servicio general de Goalstery no garantiza elegibilidad para cada Prize Cup. Goalstery también puede rechazar o no poder entregar un premio cuando hacerlo violaría la ley aplicable o una restricción legal vinculante.",
          "Cuando sea razonablemente posible, las restricciones geográficas o de elegibilidad aplicables deben comunicarse como parte de las reglas del Prize Cup correspondiente. Los usuarios son responsables de asegurarse de que la participación en un Prize Cup y la recepción de un premio sean legales en su ubicación.",
        ],
      },
      "prize-claims-and-cryptocurrency-payments": {
        title: "Reclamaciones de premios y pagos en criptomonedas",
        blocks: [
          "Cuando un ganador tenga derecho a un premio en criptomonedas, puede requerirse que contacte la cuenta oficial de soporte de Goalstery y proporcione una dirección válida de wallet de criptomonedas compatible con el premio anunciado.",
          "Los pagos de premios pueden procesarse manualmente. El ganador es responsable de proporcionar una dirección de wallet exacta y compatible. Las transacciones blockchain pueden ser irreversibles, y Goalstery puede no poder recuperar un premio enviado a una dirección incorrecta proporcionada por el ganador.",
          "Goalstery nunca requerirá la private key, seed phrase, contraseña de wallet o credenciales secretas equivalentes de un ganador para enviar un premio.",
          "Goalstery puede requerir una verificación razonable antes de entregar un premio, incluida la verificación de que el reclamante controla la cuenta Goalstery correspondiente y cumple los requisitos de elegibilidad del Prize Cup aplicable.",
        ],
      },
      "taxes-and-other-obligations": {
        title: "Impuestos y otras obligaciones",
        blocks: [
          "Un premio puede tener consecuencias fiscales, informativas, regulatorias u otras según la ubicación y circunstancias del ganador. Salvo que la ley aplicable requiera lo contrario, el destinatario es responsable de determinar y cumplir las obligaciones derivadas de recibir un premio. Goalstery no proporciona asesoramiento fiscal, de inversión, financiero ni legal.",
        ],
      },
      "match-data-and-results": {
        title: "Datos y resultados de partidos",
        blocks: [
          "Goalstery puede usar fuentes de terceros, incluido football-data.org y otras fuentes apropiadas, para calendarios, estado de partidos, marcadores y otra información de fútbol. Los datos deportivos de terceros pueden contener retrasos, errores, correcciones o inconsistencias.",
          "Goalstery no garantiza que la información de partidos de terceros sea siempre completa, instantánea o libre de errores. Para puntuación, liquidación, competiciones y clasificaciones, Goalstery toma la determinación final del resultado del partido y de la información de liquidación usada por el Servicio.",
        ],
      },
      "corrections-and-recalculation": {
        title: "Correcciones y recálculo",
        blocks: [
          "Si la información del partido, la información de liquidación, la puntuación o los resultados de una competición son incorrectos por un error de datos, problema técnico, error de cálculo, resultado oficial corregido o cuestión similar, Goalstery puede corregir la información afectada.",
          "Dicha corrección puede resultar en el recálculo de resultados de predicciones, Cups, rankings, posiciones de clasificación, resultados de competición y determinación de ganadores. Los cambios en reglas de puntuación normalmente deberían aplicarse hacia el futuro, pero esto no impide que Goalstery corrija resultados históricos cuando sea necesario para solucionar un error o preservar la integridad de la competición.",
        ],
      },
      "postponed-cancelled-or-unresolved-matches": {
        title: "Partidos aplazados, cancelados o no resueltos",
        blocks: [
          "Cuando un partido se aplaza, cancela, abandona, suspende o no tiene un resultado que Goalstery considere adecuado para liquidación, las predicciones afectadas pueden permanecer pendientes hasta que Goalstery determine que existe información suficiente para liquidarlas o determine otra resolución apropiada según las reglas de competición aplicables.",
        ],
      },
      "fair-play": {
        title: "Juego limpio",
        blocks: [
          "Goalstery está destinado a ofrecer competencia justa entre usuarios. No debes usar bots o sistemas automatizados para interactuar con Goalstery o enviar predicciones, explotar errores o comportamientos no previstos, manipular rankings, Cups, resultados de competiciones o clasificaciones, usar varias cuentas para obtener ventaja injusta, suplantar a otro usuario, interferir con APIs, servidores, infraestructura o seguridad, eludir restricciones, falsificar información de elegibilidad ni participar en fraude u otra conducta abusiva.",
          "Usar estadísticas, modelos matemáticos, inteligencia artificial, investigación u otras herramientas analíticas para ayudar a decidir qué predicción hacer no está prohibido por sí mismo, siempre que la interacción con Goalstery cumpla estos Términos y no sea automatizada ni abusiva.",
        ],
      },
      enforcement: {
        title: "Aplicación",
        blocks: [
          "Si Goalstery determina razonablemente que un usuario ha violado estos Términos, abusado del Servicio, manipulado una competición o amenazado la seguridad o integridad de Goalstery, Goalstery puede tomar medidas apropiadas.",
          "Esto puede incluir invalidar predicciones afectadas, corregir Cups o rankings, retirar al usuario de una competición, cancelar la elegibilidad para un premio obtenido mediante una infracción, bloquear permanentemente la cuenta de Goalstery y adoptar medidas técnicas razonables para impedir abuso continuado.",
        ],
      },
      advertising: {
        title: "Publicidad",
        blocks: [
          "Goalstery puede contener publicidad o enlaces a productos, servicios o sitios web de terceros. La presencia de publicidad no constituye una recomendación de Goalstery salvo que se indique expresamente lo contrario. Los servicios de terceros se rigen por sus propios términos y prácticas de privacidad.",
        ],
      },
      "service-availability": {
        title: "Disponibilidad del Servicio",
        blocks: [
          "Goalstery puede evolucionar con el tiempo. Funciones, tipos de predicción, sistemas de puntuación, competiciones, proveedores de datos y otros aspectos del Servicio pueden añadirse, modificarse, suspenderse o discontinuarse.",
          "Goalstery no garantiza disponibilidad ininterrumpida o libre de errores del Servicio ni disponibilidad continua de ningún partido, competición, función o Prize Cup concreto. Cuando sea razonablemente posible, los cambios que afecten materialmente una competición activa deben gestionarse de una forma destinada a preservar la integridad de la competición.",
        ],
      },
      "no-financial-or-betting-advice": {
        title: "Sin asesoramiento financiero ni de apuestas",
        blocks: [
          "La información presentada mediante Goalstery se proporciona para la operación y disfrute del Servicio. Goalstery no proporciona asesoramiento sobre apuestas, inversión, finanzas, impuestos ni asuntos legales. Los usuarios no deben tratar las predicciones, rankings, estadísticas u otro contenido de Goalstery como recomendaciones para realizar transacciones financieras o apuestas.",
        ],
      },
      "intellectual-property": {
        title: "Propiedad intelectual",
        blocks: [
          "El software, interfaz, marca, contenido original, diseño y otros materiales propietarios de Goalstery están protegidos por derechos de propiedad intelectual aplicables. Las marcas de terceros, nombres de competiciones de fútbol, nombres de equipos, datos y otros materiales de terceros siguen siendo propiedad de sus respectivos titulares.",
          "Puedes usar Goalstery solo para su uso personal previsto salvo que Goalstery permita expresamente lo contrario.",
        ],
      },
      disclaimer: {
        title: "Descargo de responsabilidad",
        blocks: [
          "Goalstery se proporciona según disponibilidad. En la medida permitida por la ley aplicable, Goalstery no garantiza que el Servicio sea siempre ininterrumpido, completamente exacto, seguro o libre de defectos. Nada en estos Términos excluye derechos o protecciones que no puedan excluirse legalmente.",
        ],
      },
      "limitation-of-liability": {
        title: "Limitación de responsabilidad",
        blocks: [
          "En la medida permitida por la ley aplicable, Goalstery no será responsable de pérdidas indirectas, incidentales, especiales o consecuentes derivadas del uso o imposibilidad de uso del Servicio. Cualquier limitación se aplica solo en la medida permitida por la ley aplicable al usuario o reclamación concreta. Nada limita la responsabilidad cuando dicha limitación esté prohibida por la ley aplicable.",
        ],
      },
      "changes-to-these-terms": {
        title: "Cambios en estos Términos",
        blocks: [
          "Goalstery puede actualizar estos Términos cuando cambien el Servicio, las competiciones, la tecnología, el modelo de negocio o los requisitos aplicables. La versión actual y la fecha de última actualización estarán disponibles mediante Goalstery. Los cambios materiales pueden comunicarse mediante el Servicio cuando corresponda.",
          "Los cambios normalmente no deberían alterar retroactivamente resultados de competiciones completadas salvo cuando sea necesario para corregir errores, abordar abusos, cumplir requisitos aplicables o preservar la integridad de la competición.",
        ],
      },
      language: {
        title: "Idioma",
        blocks: [
          "La versión inglesa de estos Términos es la versión autorizada. Pueden proporcionarse traducciones para comodidad del usuario. Si existe conflicto o inconsistencia entre la versión inglesa y una traducción, prevalecerá la versión inglesa en la medida permitida por la ley aplicable.",
        ],
      },
      contact: {
        title: "Contacto",
        blocks: [
          "Las preguntas sobre estos Términos, competiciones, reclamaciones de premios, eliminación de cuenta o el Servicio pueden enviarse mediante la cuenta oficial de soporte de Goalstery en Telegram. Los usuarios deben confiar en la cuenta de soporte identificada dentro de Goalstery para evitar suplantaciones o cuentas de soporte fraudulentas.",
        ],
      },
    },
  },
  ar: {
    eyebrow: "الدعم والوثائق القانونية",
    title: "شروط الاستخدام",
    subtitle: "قواعد استخدام Goalstery.",
    version: "الإصدار 1.0",
    lastUpdatedLabel: "آخر تحديث 9 سبتمبر 2026",
    contentsLabel: "المحتويات",
    authoritativeNotice:
      "النسخة الإنجليزية من هذه الشروط هي النسخة المعتمدة. توفر هذه الترجمة لراحة المستخدم.",
    intro: [
      "تحكم شروط الاستخدام هذه استخدامك Telegram Mini App الخاص بـ Goalstery والخدمات ذات الصلة.",
      "باستخدام Goalstery، فإنك توافق على هذه الشروط. إذا لم توافق عليها، فلا تستخدم Goalstery.",
    ],
    sections: {
      eligibility: {
        title: "الأهلية",
        blocks: [
          "يجب أن يكون عمرك 18 عاما على الأقل لاستخدام Goalstery. أنت مسؤول عن التأكد من أن استخدامك Goalstery مسموح به بموجب القوانين واللوائح المنطبقة عليك.",
          "يهدف Goalstery إلى أن يكون متاحا دوليا، لكن بعض الميزات أو المسابقات أو الجوائز قد لا تكون متاحة في كل بلد أو منطقة.",
        ],
      },
      "telegram-account": {
        title: "حساب Telegram",
        blocks: [
          "يستخدم Goalstery Telegram لمصادقة المستخدمين والتعرف عليهم. يقابل حساب Telegram حسابا في Goalstery لأغراض المشاركة في الخدمة.",
          "أنت مسؤول عن الحفاظ على التحكم والأمان في حساب Telegram الخاص بك، ويجب ألا تستخدم عدة حسابات Telegram للحصول على ميزة غير عادلة أو التلاعب بالمسابقات أو تجاوز القيود أو إساءة استخدام Goalstery بطريقة أخرى.",
        ],
      },
      "sports-predictions": {
        title: "التوقعات الرياضية",
        blocks: [
          "يسمح Goalstery للمستخدمين بتقديم توقعات بشأن مباريات كرة القدم والمشاركة في مسابقات قائمة على التوقعات. يجب إرسال التوقعات ضمن الوقت والشروط التي يحددها Goalstery.",
          "بمجرد قفل التوقع أو مرور الموعد النهائي المعمول به، لا يجوز تغييره بعد ذلك ما لم ينص Goalstery صراحة على خلاف ذلك. قد تكون لأنواع التوقعات المختلفة قواعد تسجيل مختلفة بناء على طبيعتها أو صعوبتها.",
        ],
      },
      "cups-and-in-app-scores": {
        title: "Cups والنقاط داخل التطبيق",
        blocks: [
          "قد يستخدم Goalstery Cups أو النقاط أو الترتيبات أو مقاييس مشابهة لقياس أداء اللعب. Cups هي فقط آلية تسجيل داخل التطبيق.",
          [
            "Cups ليست مالا أو عملة مشفرة",
            "Cups لا تملك قيمة نقدية",
            "لا يمكن شراء Cups أو بيعها أو سحبها أو نقلها بين المستخدمين",
            "لا يمكن استبدال Cups بمال أو عملة مشفرة أو سلع أو خدمات",
            "Cups لا تشكل حسابا ماليا أو رصيدا أو وديعة أو استثمارا أو أداة قيمة مخزنة",
          ],
          "لا يؤدي جمع Cups بذاته إلى إنشاء حق في تلقي مال أو عملة مشفرة.",
        ],
      },
      "free-participation": {
        title: "المشاركة المجانية",
        blocks: [
          "لا تتطلب المشاركة في مسابقات Goalstery، بما في ذلك المسابقات التي قد تقدم جوائز، رسوم دخول.",
          "لا يطلب Goalstery من المستخدمين المراهنة بمال أو عملة مشفرة أو Telegram Stars أو Cups أو أي عناصر أخرى ذات قيمة للدخول في Cup. لا يلزم أي شراء للمشاركة في Prize Cup ما لم تضع قواعد مستقبلية صراحة نموذجا مختلفا مسموحا به قانونا ويتم تحديث الشروط المعمول بها قبل تلك المشاركة.",
        ],
      },
      "prize-cups": {
        title: "Prize Cups",
        blocks: [
          "قد تقدم بعض Cups جوائز حقيقية معلنة بشكل منفصل، بما في ذلك جوائز عملات مشفرة مثل USDT أو GRAM. الجائزة منفصلة عن Cups المستخدمة كآلية تسجيل داخل Goalstery.",
          "قد تكون لدى Prize Cup المعنية قواعد محددة بشأن الأهلية والتواريخ والتسجيل والترتيب ومبلغ أو نوع الجائزة وتحديد الفائز وإجراءات المطالبة والقيود الجغرافية وغيرها من الشروط الخاصة بالمسابقة.",
          "عندما تتعارض قواعد مسابقة محددة مع هذه الشروط العامة بشأن تشغيل تلك المسابقة، فقد تكون للقواعد المحددة الأولوية بالقدر المذكور فيها، مع مراعاة القانون المعمول به.",
        ],
      },
      "geographic-and-legal-restrictions-on-prize-cups": {
        title: "القيود الجغرافية والقانونية على Prize Cups",
        blocks: [
          "قد يقيد Goalstery أو يستبعد أو يعلق أو يرفض المشاركة في Prize Cup معينة للمستخدمين في بلدان أو أقاليم أو مناطق محددة حيث قد يكون تقديم المسابقة أو الجائزة محظورا أو مقيدا أو غير عملي أو خاضعا لمتطلبات لا يستطيع Goalstery الوفاء بها بشكل معقول.",
          "لا يضمن توفر خدمة Goalstery العامة الأهلية لكل Prize Cup. قد يرفض Goalstery أيضا أو يعجز عن تسليم جائزة عندما يؤدي ذلك إلى مخالفة القانون المعمول به أو قيد قانوني ملزم.",
          "حيثما كان ذلك ممكنا بشكل معقول، يجب إبلاغ القيود الجغرافية أو قيود الأهلية المعمول بها كجزء من قواعد Prize Cup ذات الصلة. المستخدمون مسؤولون عن التأكد من أن المشاركة في Prize Cup وتلقي الجائزة قانونيان في موقعهم.",
        ],
      },
      "prize-claims-and-cryptocurrency-payments": {
        title: "مطالبات الجوائز ومدفوعات العملات المشفرة",
        blocks: [
          "عندما يكون الفائز مستحقا لجائزة عملة مشفرة، قد يطلب منه التواصل مع حساب دعم Goalstery الرسمي وتقديم عنوان محفظة عملات مشفرة صالح ومتوافق مع الجائزة المعلنة.",
          "قد تتم معالجة مدفوعات الجوائز يدويا. الفائز مسؤول عن تقديم عنوان محفظة دقيق ومتوافق. قد تكون معاملات blockchain غير قابلة للعكس، وقد لا يتمكن Goalstery من استرداد جائزة أرسلت إلى عنوان غير صحيح قدمه الفائز.",
          "لن يطلب Goalstery أبدا private key أو seed phrase أو wallet password أو بيانات اعتماد سرية مكافئة للفائز من أجل إرسال جائزة.",
          "قد يطلب Goalstery تحققا معقولا قبل تسليم الجائزة، بما في ذلك التحقق من أن مقدم المطالبة يسيطر على حساب Goalstery ذي الصلة ويستوفي متطلبات أهلية Prize Cup المعمول بها.",
        ],
      },
      "taxes-and-other-obligations": {
        title: "الضرائب والالتزامات الأخرى",
        blocks: [
          "قد تكون للجائزة آثار ضريبية أو إبلاغية أو تنظيمية أو غيرها بحسب موقع الفائز وظروفه. ما لم يتطلب القانون المعمول به خلاف ذلك، يكون المستلم مسؤولا عن تحديد الالتزامات الناشئة عن تلقي الجائزة والوفاء بها. لا يقدم Goalstery مشورة ضريبية أو استثمارية أو مالية أو قانونية.",
        ],
      },
      "match-data-and-results": {
        title: "بيانات ونتائج المباريات",
        blocks: [
          "قد يستخدم Goalstery مصادر خارجية، بما في ذلك football-data.org ومصادر مناسبة أخرى، للجداول وحالة المباريات والنتائج ومعلومات كرة القدم الأخرى. قد تحتوي بيانات الرياضة الخارجية على تأخيرات أو أخطاء أو تصحيحات أو تناقضات.",
          "لا يضمن Goalstery أن معلومات المباريات الخارجية ستكون دائما كاملة أو فورية أو خالية من الأخطاء. لأغراض التسجيل والتسوية والمسابقات ولوحات الترتيب، يتخذ Goalstery القرار النهائي بشأن نتيجة المباراة ومعلومات التسوية المستخدمة بواسطة الخدمة.",
        ],
      },
      "corrections-and-recalculation": {
        title: "التصحيحات وإعادة الحساب",
        blocks: [
          "إذا كانت معلومات المباراة أو معلومات التسوية أو التسجيل أو نتائج المسابقة غير صحيحة بسبب خطأ بيانات أو مشكلة تقنية أو خطأ حساب أو نتيجة رسمية مصححة أو مسألة مماثلة، فقد يصحح Goalstery المعلومات المتأثرة.",
          "قد يؤدي هذا التصحيح إلى إعادة حساب نتائج التوقعات وCups والترتيبات ومراكز لوحة الترتيب ونتائج المسابقات وتحديد الفائز. ينبغي أن تطبق تغييرات قواعد التسجيل عادة على المستقبل، لكن ذلك لا يمنع Goalstery من تصحيح نتائج تاريخية عند الضرورة لإصلاح خطأ أو الحفاظ على نزاهة المنافسة.",
        ],
      },
      "postponed-cancelled-or-unresolved-matches": {
        title: "المباريات المؤجلة أو الملغاة أو غير المحسومة",
        blocks: [
          "عندما يتم تأجيل مباراة أو إلغاؤها أو التخلي عنها أو تعليقها أو لا تكون لها نتيجة يعتبرها Goalstery مناسبة للتسوية، فقد تبقى التوقعات المتأثرة معلقة حتى يقرر Goalstery أن هناك معلومات كافية لتسويتها أو يحدد حلا مناسبا آخر بموجب قواعد المسابقة المعمول بها.",
        ],
      },
      "fair-play": {
        title: "اللعب النزيه",
        blocks: [
          "يهدف Goalstery إلى توفير منافسة عادلة بين المستخدمين. يجب ألا تستخدم bots أو أنظمة آلية للتفاعل مع Goalstery أو إرسال توقعات، أو تستغل أخطاء أو سلوكا غير مقصود، أو تتلاعب بالترتيبات أو Cups أو نتائج المسابقات أو لوحات الترتيب، أو تستخدم عدة حسابات للحصول على ميزة غير عادلة، أو تنتحل مستخدما آخر، أو تتدخل في APIs أو الخوادم أو البنية التحتية أو الأمان، أو تتجاوز القيود، أو تزيف معلومات الأهلية، أو تشارك في احتيال أو سلوك مسيء آخر.",
          "استخدام الإحصاءات أو النماذج الرياضية أو الذكاء الاصطناعي أو البحث أو أدوات تحليلية أخرى للمساعدة في اختيار التوقع ليس محظورا بذاته، بشرط أن يظل التفاعل مع Goalstery متوافقا مع هذه الشروط وألا يكون آليا أو مسيئا.",
        ],
      },
      enforcement: {
        title: "الإنفاذ",
        blocks: [
          "إذا قرر Goalstery بشكل معقول أن مستخدما خالف هذه الشروط أو أساء استخدام الخدمة أو تلاعب بمسابقة أو هدد أمان Goalstery أو نزاهته، فيجوز لـ Goalstery اتخاذ إجراء مناسب.",
          "قد يشمل ذلك إبطال التوقعات المتأثرة، وتصحيح Cups أو الترتيبات، وإزالة المستخدم من مسابقة، وإلغاء الأهلية لجائزة تم الحصول عليها من خلال مخالفة، وحظر حساب Goalstery نهائيا، واتخاذ تدابير تقنية معقولة لمنع استمرار الإساءة.",
        ],
      },
      advertising: {
        title: "الإعلانات",
        blocks: [
          "قد يحتوي Goalstery على إعلانات أو روابط إلى منتجات أو خدمات أو مواقع طرف ثالث. وجود الإعلانات لا يشكل تأييدا من Goalstery ما لم يذكر خلاف ذلك صراحة. تخضع خدمات الطرف الثالث لشروطها وممارسات الخصوصية الخاصة بها.",
        ],
      },
      "service-availability": {
        title: "توفر الخدمة",
        blocks: [
          "قد يتطور Goalstery بمرور الوقت. قد تتم إضافة أو تعديل أو تعليق أو إيقاف الميزات وأنواع التوقعات وأنظمة التسجيل والمسابقات ومزودي البيانات والجوانب الأخرى من الخدمة.",
          "لا يضمن Goalstery توفر الخدمة دون انقطاع أو أخطاء، ولا التوفر المستمر لأي مباراة أو مسابقة أو ميزة أو Prize Cup معينة. حيثما كان ذلك ممكنا بشكل معقول، يجب التعامل مع التغييرات التي تؤثر بشكل جوهري في مسابقة نشطة بطريقة تهدف إلى الحفاظ على نزاهة المسابقة.",
        ],
      },
      "no-financial-or-betting-advice": {
        title: "لا مشورة مالية أو متعلقة بالمراهنات",
        blocks: [
          "تقدم المعلومات المعروضة عبر Goalstery لغرض تشغيل الخدمة والاستمتاع بها. لا يقدم Goalstery مشورة مراهنات أو استثمار أو مالية أو ضريبية أو قانونية. يجب ألا يعتبر المستخدمون توقعات Goalstery أو الترتيبات أو الإحصاءات أو أي محتوى آخر توصيات للدخول في معاملات مالية أو مراهنات.",
        ],
      },
      "intellectual-property": {
        title: "الملكية الفكرية",
        blocks: [
          "إن برامج Goalstery وواجهته وعلامته ومحتواه الأصلي وتصميمه ومواده المملوكة الأخرى محمية بحقوق الملكية الفكرية المعمول بها. تبقى علامات الأطراف الثالثة وأسماء مسابقات كرة القدم وأسماء الفرق والبيانات وغيرها من مواد الأطراف الثالثة ملكا لأصحابها المعنيين.",
          "يجوز لك استخدام Goalstery فقط للاستخدام الشخصي المقصود ما لم يسمح Goalstery صراحة بخلاف ذلك.",
        ],
      },
      disclaimer: {
        title: "إخلاء المسؤولية",
        blocks: [
          "يقدم Goalstery على أساس التوفر. إلى الحد الذي يسمح به القانون المعمول به، لا يضمن Goalstery أن الخدمة ستكون دائما دون انقطاع أو دقيقة بالكامل أو آمنة أو خالية من العيوب. لا يستبعد أي شيء في هذه الشروط حقوقا أو حمايات لا يجوز استبعادها قانونا.",
        ],
      },
      "limitation-of-liability": {
        title: "تحديد المسؤولية",
        blocks: [
          "إلى الحد الذي يسمح به القانون المعمول به، لن يكون Goalstery مسؤولا عن الخسائر غير المباشرة أو العرضية أو الخاصة أو التبعية الناشئة عن استخدام الخدمة أو عدم القدرة على استخدامها. ينطبق أي تحديد فقط إلى الحد المسموح به بموجب القانون المنطبق على المستخدم أو المطالبة المعينة. لا يحد أي شيء من المسؤولية عندما يكون هذا التحديد محظورا بموجب القانون المعمول به.",
        ],
      },
      "changes-to-these-terms": {
        title: "التغييرات على هذه الشروط",
        blocks: [
          "قد يحدث Goalstery هذه الشروط عندما تتغير الخدمة أو المسابقات أو التقنية أو نموذج العمل أو المتطلبات المعمول بها. ستتاح النسخة الحالية وتاريخ آخر تحديث عبر Goalstery. قد يتم إبلاغ التغييرات الجوهرية عبر الخدمة عند الاقتضاء.",
          "ينبغي ألا تغير التغييرات عادة نتائج المسابقات المكتملة بأثر رجعي إلا عندما يكون ذلك ضروريا لتصحيح أخطاء أو معالجة إساءة استخدام أو الامتثال لمتطلبات معمول بها أو الحفاظ على نزاهة المنافسة.",
        ],
      },
      language: {
        title: "اللغة",
        blocks: [
          "النسخة الإنجليزية من هذه الشروط هي النسخة المعتمدة. قد تقدم الترجمات لراحة المستخدم. إذا كان هناك تعارض أو عدم اتساق بين النسخة الإنجليزية والترجمة، فستكون النسخة الإنجليزية هي الحاكمة إلى الحد الذي يسمح به القانون المعمول به.",
        ],
      },
      contact: {
        title: "التواصل",
        blocks: [
          "يمكن إرسال الأسئلة المتعلقة بهذه الشروط أو المسابقات أو مطالبات الجوائز أو حذف الحساب أو الخدمة عبر حساب دعم Goalstery الرسمي على Telegram. يجب على المستخدمين الاعتماد على حساب الدعم المحدد داخل Goalstery لتجنب انتحال الهوية أو حسابات الدعم الاحتيالية.",
        ],
      },
    },
  },
};

export const publicDocsByLocale: Record<
  SupportedLocale,
  IPublicDocsLocaleContent
> = {
  en: {
    help: enHelp,
    privacy: privacyPolicy,
    terms: termsOfUse,
    termsSummary: enTermsSummary,
  },
  ru: {
    help: localizeHelp("ru"),
    privacy: localizeLegalDocument(privacyPolicy, privacyTextByLocale.ru),
    terms: localizeLegalDocument(termsOfUse, termsTextByLocale.ru),
    termsSummary: termsSummaryByLocale.ru,
  },
  de: {
    help: localizeHelp("de"),
    privacy: localizeLegalDocument(privacyPolicy, privacyTextByLocale.de),
    terms: localizeLegalDocument(termsOfUse, termsTextByLocale.de),
    termsSummary: termsSummaryByLocale.de,
  },
  es: {
    help: localizeHelp("es"),
    privacy: localizeLegalDocument(privacyPolicy, privacyTextByLocale.es),
    terms: localizeLegalDocument(termsOfUse, termsTextByLocale.es),
    termsSummary: termsSummaryByLocale.es,
  },
  ar: {
    help: localizeHelp("ar"),
    privacy: localizeLegalDocument(privacyPolicy, privacyTextByLocale.ar),
    terms: localizeLegalDocument(termsOfUse, termsTextByLocale.ar),
    termsSummary: termsSummaryByLocale.ar,
  },
};
