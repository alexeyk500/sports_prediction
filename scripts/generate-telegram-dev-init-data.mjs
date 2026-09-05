#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { signTelegramInitData } from "../src/lib/telegram/init-data-signing.ts";

const shouldWrite = process.argv.includes("--write");
const devTelegramUser = {
  id: 900000001,
  first_name: "Dev",
  last_name: "User",
  username: "dev_user",
  language_code: "en",
};

try {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to generate Telegram development initData with NODE_ENV=production.");
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is required to generate Telegram development initData.");
    process.exit(1);
  }

  const now = new Date();
  const authDate = Math.floor(now.getTime() / 1000);
  const initData = signTelegramInitData(
    {
      auth_date: String(authDate),
      query_id: `dev-${authDate}`,
      user: JSON.stringify(devTelegramUser),
    },
    process.env.TELEGRAM_BOT_TOKEN,
  );

  console.log("Telegram development initData generated.");
  console.log("");
  console.log(`Dev Telegram user: ${devTelegramUser.id} (@${devTelegramUser.username})`);
  console.log(`Generated at: ${now.toISOString()}`);
  console.log("");

  if (shouldWrite) {
    writeEnvLocalValue("NEXT_PUBLIC_TELEGRAM_DEV_INIT_DATA", initData);
    console.log("Updated .env.local:");
    console.log("NEXT_PUBLIC_TELEGRAM_DEV_INIT_DATA");
    console.log("");
    console.log("Restart npm run dev if it is already running.");
  } else {
    console.log("Add this to .env.local:");
    console.log("");
    console.log(`NEXT_PUBLIC_TELEGRAM_DEV_INIT_DATA=${initData}`);
    console.log("");
    console.log("Restart npm run dev if it is already running.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Failed to generate Telegram development initData.");
  process.exit(1);
}

function writeEnvLocalValue(key, value) {
  const path = ".env.local";
  const lines = existsSync(path) ? readFileSync(path, "utf8").split(/\r?\n/) : [];
  let updated = false;
  const nextLines = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      updated = true;
      return `${key}=${value}`;
    }

    return line;
  });

  if (!updated) {
    if (nextLines.length > 0 && nextLines[nextLines.length - 1] !== "") {
      nextLines.push("");
    }

    nextLines.push(`${key}=${value}`);
  }

  writeFileSync(path, nextLines.join("\n").replace(/\n{3,}/g, "\n\n"), "utf8");
}
