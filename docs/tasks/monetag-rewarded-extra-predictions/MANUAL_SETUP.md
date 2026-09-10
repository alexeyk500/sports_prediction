# Monetag Manual Setup

Manual steps for each environment:

1. Add or prepare the Telegram Mini App in Monetag.
2. Create a dedicated Rewarded Interstitial main SDK zone for development and a separate main SDK zone for production.
3. Set `MONETAG_REWARDED_INTERSTITIAL_ZONE_ID` to the environment's main SDK zone ID.
4. Open the app inside Telegram with the development zone.
5. Test the full SDK Promise + Goalstery confirm flow:
   - free quota exhausted;
   - selecting an outcome in a MatchCard creates a reward session;
   - rewarded interstitial preload succeeds;
   - CTA becomes ready;
   - rewarded interstitial show succeeds;
   - SDK Promise resolves;
   - Goalstery authenticated confirm succeeds;
   - exactly one `AdReward` becomes `VERIFIED`;
   - exactly one rewarded prediction consumes it;
   - the same reward cannot be reused.

No Monetag postback URL is required for this MVP flow.

Goalstery trusts the successful client-side Monetag SDK flow followed by
authenticated server confirmation. This is weaker than independent
server-to-server proof and is an intentional MVP trade-off.

Do not commit real production zone IDs or Monetag account credentials.
