import type { IPublicDocument } from "./public-doc-types";

export const privacyPolicy: IPublicDocument = {
  slug: "privacy",
  eyebrow: "SUPPORT & LEGAL",
  title: "Privacy Policy",
  subtitle: "How Goalstery handles your data.",
  version: "Version 1.0",
  lastUpdatedLabel: "Last updated Sep 9, 2026",
  contentsLabel: "Contents",
  authoritativeNotice: null,
  highlightsAriaLabel: "Privacy highlights",
  highlights: [
    {
      tone: "privacy",
      title: "Your Telegram privacy",
      text: "Goalstery does not request access to your Telegram messages, contacts or phone number.",
    },
    {
      tone: "security",
      title: "Crypto safety",
      text: "We will never ask for your seed phrase, private key or wallet password.",
    },
  ],
  intro: [
    'This Privacy Policy explains how Goalstery ("Goalstery", "we", "us", or "our") handles information when you use the Goalstery Telegram Mini App.',
    "By using Goalstery, you acknowledge the practices described in this Privacy Policy.",
  ],
  sections: [
    {
      id: "information-we-receive",
      title: "Information We Receive",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery operates as a Telegram Mini App. When you use Goalstery, we may receive account information made available through the Telegram Mini App interface that is necessary to identify you and provide the Service.",
        },
        {
          kind: "list",
          items: [
            "your Telegram user ID",
            "username",
            "first and last name or display name",
            "profile photo or avatar information",
            "language or other account-related information made available through Telegram",
          ],
        },
        {
          kind: "paragraph",
          text: "Goalstery does not require a separate username or password. Telegram is an independent service and processes information under its own terms and privacy practices.",
        },
        {
          kind: "callout",
          tone: "privacy",
          text: "Goalstery does not request access to your Telegram messages, contacts, or phone number.",
        },
      ],
    },
    {
      id: "goalstery-activity-data",
      title: "Goalstery Activity Data",
      blocks: [
        {
          kind: "paragraph",
          text: "We process information generated through your use of Goalstery, including predictions, prediction outcomes, Cups and other scoring information, leaderboard positions, participation in Cups and competitions, match-related activity, profile preferences, settings, timestamps, and other information necessary to operate the Service.",
        },
        {
          kind: "paragraph",
          text: "This information is used to provide Goalstery's gameplay, scoring, competition, leaderboard, account, and related functionality.",
        },
      ],
    },
    {
      id: "technical-data",
      title: "Technical Data",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery does not intentionally maintain a separate product analytics profile based on your IP address, browser, device, or similar technical identifiers.",
        },
        {
          kind: "paragraph",
          text: "Limited technical information may necessarily be processed temporarily by servers, network infrastructure, hosting systems, Cloudflare, Telegram, or other infrastructure required to deliver and secure the Service for routing, security, abuse prevention, diagnostics, and reliable operation.",
        },
      ],
    },
    {
      id: "analytics-and-tracking",
      title: "Analytics and Tracking",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery does not currently operate a dedicated behavioral analytics or user-tracking system. If this changes materially, this Privacy Policy will be updated as appropriate.",
        },
      ],
    },
    {
      id: "advertising",
      title: "Advertising",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery may display advertising. Goalstery does not currently identify a specific advertising provider in this Privacy Policy.",
        },
        {
          kind: "paragraph",
          text: "If third-party advertising services are introduced, those services may process certain technical, advertising, or interaction information according to their own privacy policies and applicable law. Before introducing an advertising provider whose processing materially affects the practices described here, Goalstery may update this Privacy Policy and provide additional information where appropriate.",
        },
      ],
    },
    {
      id: "how-we-use-information",
      title: "How We Use Information",
      blocks: [
        {
          kind: "list",
          items: [
            "provide and operate the Service",
            "authenticate and identify users through Telegram",
            "process predictions and match results",
            "calculate Cups, rankings, and competition results",
            "operate leaderboards and Cups",
            "maintain user preferences",
            "prevent fraud, cheating, abuse, manipulation, and unauthorized access",
            "investigate technical problems and maintain security",
            "respond to support requests",
            "comply with applicable legal obligations where required",
          ],
        },
        {
          kind: "paragraph",
          text: "We do not sell your personal information.",
        },
      ],
    },
    {
      id: "infrastructure-and-service-providers",
      title: "Infrastructure and Service Providers",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery is operated using its own server infrastructure, including a privately managed VPS, and uses Cloudflare for infrastructure-related services that may include network delivery, security, traffic routing, and protection of the Service.",
        },
        {
          kind: "paragraph",
          text: "Goalstery relies on Telegram as the platform through which the Mini App is accessed. Football and match information may be obtained from third-party sports-data providers, including football-data.org, which are used for sports information and are not intended to receive Goalstery user profiles merely because you submit a prediction.",
        },
        {
          kind: "paragraph",
          text: "Additional infrastructure or service providers may be introduced when necessary to operate Goalstery. This Privacy Policy will be updated where a change materially affects the processing described here.",
        },
      ],
    },
    {
      id: "prize-information",
      title: "Prize Information",
      blocks: [
        {
          kind: "paragraph",
          text: "Some Goalstery competitions may offer real-world prizes, including cryptocurrency prizes such as USDT or GRAM. Participation does not normally require you to provide a cryptocurrency wallet address.",
        },
        {
          kind: "paragraph",
          supportLink: true,
          text: "If you are eligible to receive a cryptocurrency prize, you may be asked to contact Goalstery Support and voluntarily provide a wallet address required to deliver the prize. Wallet information will be used for verifying and processing the applicable prize payment and related support or compliance matters.",
        },
        {
          kind: "callout",
          tone: "security",
          text: "Goalstery will never ask for your seed phrase, private key, wallet password, or similar secret credentials.",
        },
      ],
    },
    {
      id: "data-retention",
      title: "Data Retention",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery retains information for as long as reasonably necessary to operate the Service, maintain competition and leaderboard integrity, prevent abuse, resolve disputes, comply with applicable obligations, and protect the Service. Retention periods may differ depending on the type of information and reason it is retained.",
        },
      ],
    },
    {
      id: "account-and-data-deletion",
      title: "Account and Data Deletion",
      blocks: [
        {
          kind: "paragraph",
          supportLink: true,
          text: "You may request deletion of your Goalstery account and associated personal information by contacting Goalstery Support through the official Telegram support account.",
        },
        {
          kind: "paragraph",
          text: "When a valid deletion request is processed, Goalstery will delete or anonymize personal information associated with the account, subject to information that must reasonably be retained for legal, security, fraud-prevention, dispute-resolution, or similar legitimate purposes.",
        },
        {
          kind: "paragraph",
          text: "Where historical competition, prediction, or leaderboard information needs to be preserved to maintain completed records, Goalstery may retain that information in anonymized form so that it is no longer associated with your Telegram identity.",
        },
      ],
    },
    {
      id: "age-requirement",
      title: "Age Requirement",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery is intended only for users who are at least 18 years old. If you are under 18, you must not use Goalstery.",
        },
      ],
    },
    {
      id: "international-use",
      title: "International Use",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery is intended to be accessible internationally. Because Goalstery operates globally, information may be processed in countries other than the country in which you are located. Where applicable law imposes specific requirements, Goalstery will address those requirements as applicable to the Service.",
        },
      ],
    },
    {
      id: "security",
      title: "Security",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery uses reasonable technical and organizational measures intended to protect information and maintain the security of the Service. However, no internet-connected system can guarantee absolute security.",
        },
        {
          kind: "paragraph",
          text: "You are responsible for maintaining the security of your Telegram account and any cryptocurrency wallet information you choose to provide for prize delivery.",
        },
      ],
    },
    {
      id: "your-rights",
      title: "Your Rights",
      blocks: [
        {
          kind: "paragraph",
          supportLink: true,
          text: "Depending on where you live, applicable law may provide rights concerning your personal information, which may include rights to request access, correction, deletion, restriction, or other actions. Requests may be submitted through the official Goalstery Telegram support account, and Goalstery may need to verify the account before acting.",
        },
      ],
    },
    {
      id: "changes-to-this-privacy-policy",
      title: "Changes to This Privacy Policy",
      blocks: [
        {
          kind: "paragraph",
          text: "Goalstery may update this Privacy Policy when the Service, its technology, its providers, its advertising practices, or applicable requirements change. The current version and Last Updated date will be made available through Goalstery. Material changes may be communicated through the Service where appropriate.",
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
          text: "For privacy questions, account deletion requests, or other privacy-related requests, contact Goalstery through its official Telegram support account. The specific official support account displayed by Goalstery should be used to avoid impersonation or fraudulent support accounts.",
        },
      ],
    },
  ],
};
