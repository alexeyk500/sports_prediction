import type { TranslationShape } from "../i18n";

export const de = {
  common: {
    brand: "Goalstery",
    userFallback: "Nutzer {id}",
    trophyCount: "{count} Trophäen",
  },
  navigation: {
    predict: "Tipps",
    cup: "Cup",
    history: "Historie",
    profile: "Profil",
    ariaLabel: "Hauptnavigation",
    placeholder: "Dieser Bereich ist in dieser Phase noch nicht umgesetzt.",
  },
  predict: {
    title: "Tipps",
    subtitle: "Gib deine Tipps für heute ab",
    weeklyCup: "Wochen-Cup",
    loading: "Heutige Spiele werden geladen...",
    authRequired: "Authentifizierung erforderlich.",
    tabs: {
      available: "Verfügbar",
      myPicks: "Meine Tipps",
      ariaLabel: "Tippansichten",
    },
    quota: {
      free: "Gratis-Tipps: {used} / {limit}",
      rewarded: "Belohnte Tipps: {used} / {limit}",
      total: "Gesamt: {used} / {limit}",
      title: "Heutige Tipps",
      totalShort: "{used} / {limit}",
      freeCompact: "Gratis ({used} / {limit})",
      rewardedCompact: "Belohnt ({used} / {limit})",
    },
    today: {
      label: "Heute",
      labelWithDate: "Heute · {date}",
      matchCount: "{count} Spiele",
    },
    empty: {
      available: "Heute sind keine Spiele verfügbar.",
      myPicks: "Noch keine Tipps.",
    },
    outcomes: {
      HOME: "Heim",
      DRAW: "Remis",
      AWAY: "Auswärts",
    },
    status: {
      selected: "Gewählt: {outcome}",
      lockedAfterKickoff: "Nach Anpfiff gesperrt",
      saving: "Speichern...",
      editable: "Änderbar",
      locked: "Gesperrt",
      fixtureFallback: "Spiel",
    },
    fixtureStatus: {
      DRAFT: "Entwurf",
      OPEN: "Offen",
      LOCKED: "Gesperrt",
      LIVE: "Live",
      FINISHED: "Beendet",
      SETTLED: "Gewertet",
    },
    slot: {
      FREE: "Gratis",
      REWARDED: "Belohnt",
    },
    reward: {
      title: "Werbung ansehen, um den Tipp freizuschalten",
      body: "Belohnte Werbung ist in dieser Entwicklungsphase noch nicht verbunden.",
      cta: "Sieh Werbung an, um einen weiteren Tipp freizuschalten",
      plusOne: "+1",
    },
    aria: {
      selectOutcome:
        "{outcome}, {trophyValue}, für {homeTeam} gegen {awayTeam} wählen",
    },
  },
  cup: {
    subtitle: "Kämpfe. Steige auf. Gewinne gemeinsam.",
    loading: "Cup wird geladen...",
    weeklyCup: "Wochen-Cup",
    countdown: "{days}T {hours}Std {minutes}Min",
    ends: "Endet {date}",
    prizePool: "Preispool",
    participants: "Teilnehmer",
    participantCopy: "Gib Tipps ab und klettere in der Rangliste!",
    unavailable: "—",
    yourPosition: "Deine Position",
    positionRank: "Rang #{rank}",
    positionSummary:
      "{points} Punkte · {predictions} Tipps · {correct} richtig · {wrong} falsch",
    positionUnavailableTitle: "Deine Cup-Position ist noch nicht bereit",
    positionUnavailableBody:
      "Gib Tipps ab, um automatisch einzusteigen. Dein Rang erscheint, sobald die Cup-Tabelle verfügbar ist.",
    makePrediction: "Tipp abgeben",
    you: "Du",
    leaderboard: "Leaderboard",
    leaderboardModes: {
      top: "Top 50",
      "around-me": "Um mich",
      all: "Alle Spieler",
      ariaLabel: "Leaderboard-Ansichten",
    },
    leaderboardStates: {
      loading: "Leaderboard wird geladen...",
      retry: "Erneut versuchen",
      loadMore: "Mehr laden",
      loadingMore: "Weitere Spieler werden geladen...",
      end: "Ende des Leaderboards",
      aroundTitle: "Um dich herum",
      aroundSubtitle: "Spieler von #{start} bis #{end}",
      viewFull: "Gesamtes Leaderboard ansehen",
    },
    pastCups: "Vergangene Cups",
    tabs: {
      current: "Aktueller Cup",
      history: "Historie",
      ariaLabel: "Cup-Ansichten",
    },
    columns: {
      rank: "#",
      player: "Spieler",
      correctWrong: "Richtig / Falsch",
      points: "Punkte",
    },
    empty: {
      noCurrentCup: "Kein aktiver Cup verfügbar.",
      leaderboardTitle: "Die Tabelle ist noch nicht bereit",
      leaderboardBody:
        "Spielerzeilen erscheinen, sobald die aktuelle Cup-Tabelle verfügbar ist.",
      historyTitle: "Noch keine vergangenen Cups",
      historyBody:
        "Abgeschlossene Cup-Zusammenfassungen erscheinen hier, sobald finale Ergebnisse verfügbar sind.",
    },
  },
  history: {
    title: "Historie",
    subtitle: "Deine Tipps in diesem Cup",
    loading: "Historie wird geladen...",
    position: "Deine Position",
    rank: "#{rank}",
    correctWrong: "{correct} richtig · {wrong} falsch",
    matchCount: "{count} Spiele",
    timeline: "Tipp-Historie",
    day: {
      today: "Heute · {date}",
      yesterday: "Gestern · {date}",
    },
    status: {
      CORRECT: "Richtig",
      INCORRECT: "Falsch",
      PENDING: "Offen",
    },
    card: {
      yourPick: "Dein Tipp: {pick}",
      marketFullTime: "Regulaere Spielzeit",
    },
    empty: {
      title: "Noch keine Tipps in diesem Cup",
      body: "Deine aktuellen Cup-Tipps erscheinen hier direkt nach der Abgabe.",
    },
  },
  profile: {
    title: "Profil",
    stagePlaceholder:
      "Karriere und Preisverlauf sind in dieser Phase noch nicht umgesetzt.",
    settingsTitle: "Einstellungen",
    languageLabel: "Sprache",
    appearanceLabel: "Darstellung",
    saveError: "Einstellungen konnten nicht gespeichert werden.",
  },
  errors: {
    generic: "Etwas ist schiefgelaufen.",
    missingTelegramInitData:
      "Öffne die App in Telegram oder konfiguriere development initData.",
    network: "Netzwerkanfrage fehlgeschlagen.",
    invalidApiResponse: "Serverantwort konnte nicht gelesen werden.",
    PREDICTION_LOCKED: "Dieses Spiel hat begonnen.",
    DAILY_PREDICTION_LIMIT_REACHED: "Taegliches Tipp-Limit erreicht.",
    FREE_PREDICTION_LIMIT_REACHED: "Gratis-Tipps sind aufgebraucht.",
    REWARDED_AD_REQUIRED: "Sieh Werbung an, um den Tipp freizuschalten.",
    FIXTURE_NOT_IN_DAILY_POOL: "Dieses Spiel ist heute nicht verfügbar.",
    FIXTURE_NOT_OPEN: "Dieses Spiel ist nicht für Tipps geöffnet.",
    FIXTURE_NOT_FOUND: "Dieses Spiel wurde nicht gefunden.",
    FIXTURE_LOCKED: "Dieses Spiel ist gesperrt.",
    FIXTURE_SCORING_SNAPSHOT_MISSING:
      "Die Tippquoten für dieses Spiel sind noch nicht bereit.",
    COMPETITION_NOT_SUPPORTED: "Dieser Wettbewerb wird nicht unterstützt.",
    COMPETITION_INACTIVE: "Dieser Wettbewerb ist nicht aktiv.",
    PREDICTION_ALREADY_EXISTS: "Du hast für dieses Spiel bereits getippt.",
    PREDICTION_NOT_FOUND: "Dieser Tipp wurde nicht gefunden.",
    INVALID_AD_REWARD: "Diese Werbe-Belohnung kann nicht verwendet werden.",
    AD_REWARD_ALREADY_CONSUMED:
      "Diese Werbe-Belohnung wurde bereits verwendet.",
    IDEMPOTENCY_CONFLICT:
      "Diese Anfrage wurde bereits für einen anderen Tipp verwendet.",
  },
  settings: {
    locales: {
      en: "English",
      ru: "Русский",
      de: "Deutsch",
      es: "Español",
      ar: "العربية",
    },
    appearance: {
      system: "System",
      light: "Hell",
      dark: "Dunkel",
    },
  },
} as const satisfies TranslationShape;
