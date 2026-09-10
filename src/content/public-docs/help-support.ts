import type { IHelpCategory, IHelpQuestion } from "./public-doc-types";

export const popularHelpQuestions: IHelpQuestion[] = [
  {
    id: "how-predictions-work",
    question: "How do predictions work?",
    answer: [
      "Goalstery lets you make predictions about football matches. Available prediction types may vary by match and can have different difficulty levels and Cups rewards.",
      "Select an available match, choose your prediction, and submit it before the deadline. Goalstery records submitted predictions and later evaluates them using the settled match result.",
    ],
  },
  {
    id: "prediction-lock",
    question: "When does a prediction lock?",
    answer: [
      "Every prediction has a deadline. Once the applicable deadline has passed or the prediction has otherwise been locked by Goalstery, you can no longer change that prediction.",
    ],
  },
  {
    id: "cups-calculated",
    question: "How are Cups calculated?",
    answer: [
      "Correct predictions award Cups according to the scoring rules applicable to that prediction. Prediction types may have different scoring values depending on their nature or difficulty, and the applicable reward should be shown before submission.",
    ],
  },
  {
    id: "postponed-match",
    question: "What happens if a match is postponed?",
    answer: [
      "If a match is postponed, cancelled, abandoned, suspended, or otherwise does not have a result suitable for settlement, affected predictions may remain pending until Goalstery determines that sufficient information exists to settle them or another resolution is appropriate.",
    ],
  },
  {
    id: "real-prizes",
    question: "Can I win real prizes?",
    answer: [
      "Some Goalstery Cups may offer separately announced real-world prizes, including cryptocurrency prizes such as USDT or GRAM. Not every Cup has a real-world prize, and availability of Goalstery does not guarantee eligibility for every Prize Cup.",
    ],
  },
  {
    id: "contact-support",
    question: "How do I contact support?",
    supportLink: true,
    answer: [
      "Contact the Goalstery support team through the official Telegram support account shown inside Goalstery. Use only the support account identified inside Goalstery to avoid impersonation or fraudulent support accounts.",
    ],
  },
];

export const helpCategories: IHelpCategory[] = [
  {
    id: "predictions",
    title: "Predictions",
    description: "How predictions work, deadlines and scoring",
    icon: "predictions",
    questions: [
      popularHelpQuestions[0],
      popularHelpQuestions[1],
      {
        id: "after-match",
        question: "What happens after the match?",
        answer: [
          "After Goalstery has sufficient match-result information, your prediction is evaluated. Depending on the prediction type and result, it may be marked as correct, wrong, or remain pending while the match is unresolved.",
          "Correct predictions award Cups according to the scoring rules applicable to that prediction.",
        ],
      },
      popularHelpQuestions[3],
      {
        id: "settled-change",
        question: "Can a settled prediction change later?",
        answer: [
          "In unusual cases, yes. Match-data providers or official competitions may correct previously reported information, and technical or settlement errors can also occur.",
          "When necessary to maintain accurate results and competition integrity, Goalstery may correct a settlement and recalculate affected predictions, Cups, rankings, or competition results.",
        ],
      },
    ],
  },
  {
    id: "cups",
    title: "Cups",
    description: "Scoring, competitions and Prize Cups",
    icon: "cups",
    questions: [
      {
        id: "what-are-cups",
        question: "What are Cups?",
        answer: [
          "Cups are Goalstery's in-app scoring points. You earn Cups through gameplay, including by making correct predictions.",
          "Your Cups can be used to measure your performance and determine rankings in Goalstery.",
        ],
      },
      popularHelpQuestions[2],
      {
        id: "cups-money-value",
        question: "Do Cups have monetary value?",
        answer: [
          "No. Cups cannot be purchased, sold, withdrawn, transferred to another user, exchanged for money or cryptocurrency, or exchanged for goods or services.",
          "Cups are an in-app scoring mechanism only and are not cryptocurrency, tokens, money, stored value, or a financial balance.",
        ],
      },
      popularHelpQuestions[4],
      {
        id: "free-prize-cups",
        question: "Do I have to pay to enter a Prize Cup?",
        answer: [
          "No. Participation in Goalstery Prize Cups is free. Goalstery does not require an entry fee in money, cryptocurrency, Telegram Stars, Cups, or another item of value to participate.",
        ],
      },
      {
        id: "claim-crypto-prize",
        question: "How do I claim a cryptocurrency prize?",
        supportLink: true,
        answer: [
          "If you win an eligible cryptocurrency prize, you may be asked to contact the official Goalstery Telegram support account and provide a compatible public cryptocurrency wallet address so the prize can be sent manually.",
          "Always check the wallet address and network carefully before providing it. Blockchain transactions may be irreversible.",
        ],
      },
      {
        id: "wallet-secrets",
        question: "Will Goalstery ever ask for my seed phrase or private key?",
        answer: [
          "No. Goalstery will never need your seed phrase, private key, wallet password, or similar secret credentials to send you a prize.",
          "To receive a cryptocurrency payment, Goalstery only needs the appropriate public wallet address and any information reasonably required to verify the prize claim.",
        ],
      },
    ],
  },
  {
    id: "leaderboard",
    title: "Leaderboard",
    description: "Rankings, results and calculations",
    icon: "leaderboard",
    questions: [
      {
        id: "leaderboard-work",
        question: "How does the leaderboard work?",
        answer: [
          "Goalstery leaderboards rank participating players according to the applicable competition rules and their Goalstery results.",
          "Depending on the screen or competition, Goalstery may show top-ranked players, players around your current position, or a larger list of participants.",
        ],
      },
      {
        id: "leaderboard-change",
        question: "Why can my leaderboard position change?",
        answer: [
          "Your position can change when your predictions are settled, other players' predictions are settled, pending matches receive results, a settlement or scoring error is corrected, or competition data is recalculated.",
        ],
      },
      {
        id: "result-corrected",
        question: "What happens if a result is corrected?",
        answer: [
          "Goalstery may recalculate affected Cups and rankings. If a correction affects a competition result, leaderboard positions and winner determination may also change.",
        ],
      },
    ],
  },
  {
    id: "account",
    title: "Account",
    description: "Profile, settings and account management",
    icon: "account",
    questions: [
      {
        id: "account-created",
        question: "How is my Goalstery account created?",
        answer: [
          "Goalstery operates as a Telegram Mini App. Your Telegram account is used to authenticate and identify you, so you do not need to create a separate Goalstery password.",
        ],
      },
      {
        id: "telegram-info",
        question: "What Telegram information does Goalstery receive?",
        answer: [
          "Goalstery may receive information made available through the Telegram Mini App interface that is necessary to identify you and provide the Service, such as your Telegram user ID, username, display name, profile photo, language, and similar profile information.",
          "Goalstery does not request access to your Telegram messages, contacts, or phone number as part of normal use.",
        ],
      },
      {
        id: "multiple-accounts",
        question: "Can I use multiple accounts?",
        answer: [
          "A Telegram account corresponds to a Goalstery account. Using multiple accounts to gain an unfair advantage, manipulate competitions or rankings, circumvent restrictions, or otherwise abuse Goalstery is prohibited.",
        ],
      },
      {
        id: "delete-account",
        question: "How do I delete my Goalstery account?",
        supportLink: true,
        answer: [
          "Contact the official Goalstery Telegram support account and request account deletion. Goalstery will process the request and delete or anonymize associated personal information as appropriate.",
          "Some historical competition information may be retained in anonymized form when necessary to preserve the integrity of completed competitions and leaderboards.",
        ],
      },
    ],
  },
];

export const additionalHelpSections: IHelpCategory[] = [
  {
    id: "fair-play",
    title: "Fair Play",
    description: "Allowed analysis and prohibited abuse",
    icon: "leaderboard",
    questions: [
      {
        id: "statistics-ai",
        question: "Can I use statistics or AI to help make predictions?",
        answer: [
          "Yes. You may use football statistics, research, mathematical models, artificial intelligence, or other analytical tools to help decide which prediction you want to make.",
        ],
      },
      {
        id: "not-allowed",
        question: "What is not allowed?",
        answer: [
          "Goalstery does not permit unfair or abusive interaction with the Service. You must not use bots to automatically interact with Goalstery or submit predictions, exploit bugs, manipulate Cups, rankings, competition results, or leaderboards, use multiple accounts for unfair advantage, circumvent protections, interfere with APIs or infrastructure, falsify eligibility information, or engage in fraud or similar abuse.",
        ],
      },
      {
        id: "rule-break",
        question: "What can happen if I break the rules?",
        answer: [
          "Depending on the violation, Goalstery may correct affected results, invalidate predictions, adjust Cups or rankings, remove eligibility for a competition or prize, or permanently block the account.",
        ],
      },
    ],
  },
  {
    id: "match-data",
    title: "Match Data",
    description: "Sports data, corrections and settlement",
    icon: "predictions",
    questions: [
      {
        id: "football-data",
        question: "Where does Goalstery get football data?",
        answer: [
          "Goalstery may obtain fixtures, scores, match status, and other football information from third-party sports-data sources, including football-data.org. Third-party sports data can sometimes be delayed, incomplete, or corrected after publication.",
        ],
      },
      {
        id: "scoring-result",
        question: "Which result does Goalstery use for scoring?",
        answer: [
          "Goalstery makes the final determination of the match information used for its own prediction settlement and competitions. When necessary, Goalstery may consider official competition information, sports-data providers, and other reliable sources.",
        ],
      },
    ],
  },
  {
    id: "privacy-security",
    title: "Privacy & Security",
    description: "Tracking, ads and account safety",
    icon: "account",
    questions: [
      {
        id: "tracking",
        question: "Does Goalstery track me?",
        answer: [
          "Goalstery does not currently operate a dedicated behavioral analytics or user-tracking system. Some technical information may necessarily be processed by Telegram, Cloudflare, Goalstery's server infrastructure, or other infrastructure required to deliver and secure the Service.",
        ],
      },
      {
        id: "advertising",
        question: "Does Goalstery show advertising?",
        answer: [
          "Goalstery may display advertising. If third-party advertising services are introduced, those services may have their own privacy practices, and the Goalstery Privacy Policy will be updated where appropriate if practices materially change.",
        ],
      },
      {
        id: "protect-account",
        question: "How can I protect my account?",
        answer: [
          "Keep your Telegram account secure and do not give other people access to it. For cryptocurrency prizes, never share seed phrases, private keys, wallet passwords, or authentication secrets. Goalstery does not require these secrets to deliver a prize.",
        ],
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    description: "Pending predictions, rankings and access",
    icon: "cups",
    questions: [
      {
        id: "prediction-pending",
        question: "My prediction is still pending",
        supportLink: true,
        answer: [
          "A prediction can remain pending while Goalstery waits for sufficient match-result information, particularly when a match is postponed, suspended, abandoned, cancelled, or otherwise unresolved. If you believe a completed match has remained pending incorrectly, contact Goalstery Support.",
        ],
      },
      {
        id: "cups-ranking-changed",
        question: "My Cups or ranking changed",
        answer: [
          "Cups and rankings can change as predictions are settled and other players receive their results. They may also change if Goalstery corrects inaccurate match data, settlement information, scoring, or competition results.",
        ],
      },
      {
        id: "settled-incorrectly",
        question: "I think my prediction was settled incorrectly",
        supportLink: true,
        answer: [
          "Contact Goalstery Support and provide enough information to identify the match and prediction. Goalstery can review the settlement and correct it where appropriate.",
        ],
      },
      {
        id: "cannot-access-prize-cup",
        question: "I cannot access a Prize Cup",
        supportLink: true,
        answer: [
          "A particular Prize Cup may have eligibility or geographic restrictions. Access to Goalstery itself does not guarantee access to every Prize Cup. If you believe you should be eligible, contact Goalstery Support.",
        ],
      },
    ],
  },
];
