import type { IPublicDocument } from "./public-doc-types";

export const termsOfUse: IPublicDocument = {
  slug: "terms",
  eyebrow: "SUPPORT & LEGAL",
  title: "Terms of Use",
  subtitle: "The rules for using Goalstery.",
  version: "Version 1.0",
  lastUpdatedLabel: "Last updated Sep 9, 2026",
  contentsLabel: "Contents",
  authoritativeNotice: null,
  intro: [
    'These Terms of Use ("Terms") govern your use of the Goalstery Telegram Mini App and related services ("Goalstery" or the "Service").',
    "By using Goalstery, you agree to these Terms. If you do not agree to these Terms, do not use Goalstery.",
  ],
  sections: [
    {
      id: "eligibility",
      title: "Eligibility",
      blocks: [
        {
          kind: "paragraph",
          text: "You must be at least 18 years old to use Goalstery. You are responsible for ensuring that your use of Goalstery is permitted under the laws and regulations applicable to you.",
        },
        {
          kind: "paragraph",
          text: "Goalstery is intended to be available internationally, but particular features, competitions, or prizes may not be available in every country or region.",
        },
      ],
    },
    {
      id: "telegram-account",
      title: "Telegram Account",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery uses Telegram to authenticate and identify users. A Telegram account corresponds to a Goalstery account for purposes of participation in the Service.",
        },
        {
          kind: "paragraph",
          text: "You are responsible for maintaining control and security of your Telegram account and must not use multiple Telegram accounts to obtain an unfair advantage, manipulate competitions, circumvent restrictions, or otherwise abuse Goalstery.",
        },
      ],
    },
    {
      id: "sports-predictions",
      title: "Sports Predictions",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery allows users to make predictions concerning football matches and participate in prediction-based competitions. Predictions must be submitted within the time and conditions specified by Goalstery.",
        },
        {
          kind: "paragraph",
          text: "Once a prediction is locked or the applicable deadline has passed, it may no longer be changed unless Goalstery expressly provides otherwise. Different prediction types may have different scoring rules based on their nature or difficulty.",
        },
      ],
    },
    {
      id: "cups-and-in-app-scores",
      title: "Cups and In-App Scores",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery may use Cups, points, rankings, or similar metrics to measure gameplay performance. Cups are solely an in-app scoring mechanism.",
        },
        {
          kind: "list",
          items: [
            "Cups are not money or cryptocurrency",
            "Cups have no cash value",
            "Cups cannot be purchased, sold, withdrawn, or transferred between users",
            "Cups cannot be exchanged for money, cryptocurrency, goods, or services",
            "Cups do not constitute a financial account, balance, deposit, investment, or stored-value instrument",
          ],
        },
        {
          kind: "paragraph",
          text: "Accumulating Cups does not by itself create a right to receive money or cryptocurrency.",
        },
      ],
    },
    {
      id: "free-participation",
      title: "Free Participation",
      blocks: [
        {
          kind: "paragraph",
          text: "Participation in Goalstery competitions, including competitions that may offer prizes, does not require an entry fee.",
        },
        {
          kind: "paragraph",
          text: "Goalstery does not require users to wager money, cryptocurrency, Telegram Stars, Cups, or other items of value in order to enter a Cup. No purchase is necessary to participate in a Prize Cup unless future rules expressly establish a different legally permitted product model and the applicable terms are updated before such participation.",
        },
      ],
    },
    {
      id: "prize-cups",
      title: "Prize Cups",
      blocks: [
        {
          kind: "paragraph",
          text: "Certain Cups may offer separately announced real-world prizes, including cryptocurrency prizes such as USDT or GRAM. A prize is separate from the Cups used as Goalstery's in-app scoring mechanism.",
        },
        {
          kind: "paragraph",
          text: "The applicable Prize Cup may have specific rules concerning eligibility, dates, scoring, ranking, prize amount or type, winner determination, claiming procedure, geographical restrictions, and other competition-specific conditions.",
        },
        {
          kind: "paragraph",
          text: "Where competition-specific rules conflict with these general Terms regarding the operation of that competition, the specific rules may control to the extent stated in those rules, subject to applicable law.",
        },
      ],
    },
    {
      id: "geographic-and-legal-restrictions-on-prize-cups",
      title: "Geographic and Legal Restrictions on Prize Cups",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery may restrict, exclude, suspend, or refuse participation in a particular Prize Cup for users in certain countries, territories, or regions where offering the competition or prize may be prohibited, restricted, impractical, or subject to requirements Goalstery cannot reasonably satisfy.",
        },
        {
          kind: "paragraph",
          text: "Availability of the general Goalstery Service does not guarantee eligibility for every Prize Cup. Goalstery may also decline or be unable to deliver a prize where doing so would violate applicable law or a binding legal restriction.",
        },
        {
          kind: "paragraph",
          text: "Where reasonably possible, applicable geographic or eligibility restrictions should be communicated as part of the relevant Prize Cup rules. Users are responsible for ensuring that participation in a Prize Cup and receipt of a prize are lawful in their location.",
        },
      ],
    },
    {
      id: "prize-claims-and-cryptocurrency-payments",
      title: "Prize Claims and Cryptocurrency Payments",
      blocks: [
        {
          kind: "paragraph",
          supportLink: true,
          text: "Where a winner is entitled to a cryptocurrency prize, the winner may be required to contact the official Goalstery Support account and provide a valid cryptocurrency wallet address compatible with the announced prize.",
        },
        {
          kind: "paragraph",
          text: "Prize payments may be processed manually. The winner is responsible for providing an accurate and compatible wallet address. Blockchain transactions may be irreversible, and Goalstery may not be able to recover a prize sent to an incorrect address supplied by the winner.",
        },
        {
          kind: "callout",
          tone: "security",
          text: "Goalstery will never require a winner's private key, seed phrase, wallet password, or equivalent secret credentials in order to send a prize.",
        },
        {
          kind: "paragraph",
          text: "Goalstery may require reasonable verification before delivering a prize, including verification that the claimant controls the relevant Goalstery account and satisfies the applicable Prize Cup eligibility requirements.",
        },
      ],
    },
    {
      id: "taxes-and-other-obligations",
      title: "Taxes and Other Obligations",
      blocks: [
        {
          kind: "paragraph",
          text: "A prize may have tax, reporting, regulatory, or other consequences depending on the winner's location and circumstances. Unless applicable law requires otherwise, the recipient is responsible for determining and satisfying obligations arising from receipt of a prize. Goalstery does not provide tax, investment, financial, or legal advice.",
        },
      ],
    },
    {
      id: "match-data-and-results",
      title: "Match Data and Results",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery may use third-party sources, including football-data.org and other appropriate sources, for fixtures, match status, scores, and other football information. Third-party sports data can contain delays, errors, corrections, or inconsistencies.",
        },
        {
          kind: "paragraph",
          text: "Goalstery does not guarantee that third-party match information will always be complete, instantaneous, or error-free. For scoring, settlement, competitions, and leaderboards, Goalstery makes the final determination of the match result and settlement information used by the Service.",
        },
      ],
    },
    {
      id: "corrections-and-recalculation",
      title: "Corrections and Recalculation",
      blocks: [
        {
          kind: "paragraph",
          text: "If match information, settlement information, scoring, or competition results are incorrect because of a data error, technical problem, calculation error, corrected official result, or similar issue, Goalstery may correct the affected information.",
        },
        {
          kind: "paragraph",
          text: "Such correction may result in recalculation of prediction outcomes, Cups, rankings, leaderboard positions, competition results, and winner determination. Changes to scoring rules should ordinarily apply prospectively, but this does not prevent Goalstery from correcting historical results where necessary to fix an error or preserve competition integrity.",
        },
      ],
    },
    {
      id: "postponed-cancelled-or-unresolved-matches",
      title: "Postponed, Cancelled, or Unresolved Matches",
      blocks: [
        {
          kind: "paragraph",
          text: "Where a match is postponed, cancelled, abandoned, suspended, or otherwise does not have a result that Goalstery considers suitable for settlement, affected predictions may remain pending until Goalstery determines that sufficient information exists to settle them or determines another appropriate resolution under the applicable competition rules.",
        },
      ],
    },
    {
      id: "fair-play",
      title: "Fair Play",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery is intended to provide fair competition between users. You must not use bots or automated systems to interact with Goalstery or submit predictions, exploit bugs or unintended behavior, manipulate rankings, Cups, competition results, or leaderboards, use multiple accounts to obtain an unfair advantage, impersonate another user, interfere with APIs, servers, infrastructure, or security, circumvent restrictions, falsify eligibility information, or engage in fraud or other abusive conduct.",
        },
        {
          kind: "paragraph",
          text: "Using statistics, mathematical models, artificial intelligence, research, or other analytical tools to help decide what prediction to make is not by itself prohibited, provided that interaction with Goalstery remains compliant with these Terms and is not automated or abusive.",
        },
      ],
    },
    {
      id: "enforcement",
      title: "Enforcement",
      blocks: [
        {
          kind: "paragraph",
          text: "If Goalstery reasonably determines that a user has violated these Terms, abused the Service, manipulated a competition, or threatened the security or integrity of Goalstery, Goalstery may take appropriate action.",
        },
        {
          kind: "paragraph",
          text: "This may include invalidating affected predictions, correcting Cups or rankings, removing the user from a competition, cancelling eligibility for a prize obtained through a violation, permanently blocking the Goalstery account, and taking reasonable technical measures to prevent continued abuse.",
        },
      ],
    },
    {
      id: "advertising",
      title: "Advertising",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery may contain advertising or links to third-party products, services, or websites. The presence of advertising does not constitute an endorsement by Goalstery unless expressly stated otherwise. Third-party services are governed by their own terms and privacy practices.",
        },
      ],
    },
    {
      id: "service-availability",
      title: "Service Availability",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery may evolve over time. Features, prediction types, scoring systems, competitions, data providers, and other aspects of the Service may be added, modified, suspended, or discontinued.",
        },
        {
          kind: "paragraph",
          text: "Goalstery does not guarantee uninterrupted or error-free availability of the Service or continuous availability of any particular match, competition, feature, or Prize Cup. Where reasonably possible, changes that materially affect an active competition should be handled in a manner intended to preserve competition integrity.",
        },
      ],
    },
    {
      id: "no-financial-or-betting-advice",
      title: "No Financial or Betting Advice",
      blocks: [
        {
          kind: "paragraph",
          text: "Information presented through Goalstery is provided for the operation and enjoyment of the Service. Goalstery does not provide betting, investment, financial, tax, or legal advice. Users should not treat Goalstery predictions, rankings, statistics, or other content as recommendations to enter into financial transactions or wagers.",
        },
      ],
    },
    {
      id: "intellectual-property",
      title: "Intellectual Property",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery's software, interface, branding, original content, design, and other proprietary materials are protected by applicable intellectual property rights. Third-party trademarks, football competition names, team names, data, and other third-party materials remain the property of their respective owners.",
        },
        {
          kind: "paragraph",
          text: "You may use Goalstery only for its intended personal use unless Goalstery expressly permits otherwise.",
        },
      ],
    },
    {
      id: "disclaimer",
      title: "Disclaimer",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery is provided on an as available basis. To the extent permitted by applicable law, Goalstery does not guarantee that the Service will always be uninterrupted, completely accurate, secure, or free from defects. Nothing in these Terms excludes rights or protections that cannot lawfully be excluded.",
        },
      ],
    },
    {
      id: "limitation-of-liability",
      title: "Limitation of Liability",
      blocks: [
        {
          kind: "paragraph",
          text: "To the extent permitted by applicable law, Goalstery will not be responsible for indirect, incidental, special, or consequential losses arising from use of or inability to use the Service. Any limitation applies only to the extent permitted under the law applicable to the particular user or claim. Nothing limits liability where such limitation is prohibited by applicable law.",
        },
      ],
    },
    {
      id: "changes-to-these-terms",
      title: "Changes to These Terms",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery may update these Terms when the Service, competitions, technology, business model, or applicable requirements change. The current version and Last Updated date will be made available through Goalstery. Material changes may be communicated through the Service where appropriate.",
        },
        {
          kind: "paragraph",
          text: "Changes should not ordinarily retroactively alter completed competition results except where necessary to correct errors, address abuse, comply with applicable requirements, or preserve competition integrity.",
        },
      ],
    },
    {
      id: "language",
      title: "Language",
      blocks: [
        {
          kind: "paragraph",
          text: "The English version of these Terms is the authoritative version. Translations may be provided for convenience. If there is a conflict or inconsistency between the English version and a translation, the English version will control to the extent permitted by applicable law.",
        },
      ],
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [
        {
          kind: "paragraph",
          supportLink: true,
          text: "Questions concerning these Terms, competitions, prize claims, account deletion, or the Service may be submitted through the official Goalstery Telegram support account. Users should rely on the support account identified within Goalstery to avoid impersonation or fraudulent support accounts.",
        },
      ],
    },
  ],
};
