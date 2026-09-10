"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
import Image from "next/image";
import ArrowLeftIcon from "@/assets/icons/ArrowLeftIcon";
import { supportDestination } from "@/content/public-docs/support-destination";
import { ApiClient } from "@/lib/api/client";
import { messageForApiError } from "@/lib/api/error-presentation";
import type { PrizePayoutCardDto, PrizePayoutsResponse } from "@/lib/api/types";
import { formatKickoffTime } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/use-translation";
import { isValidTrc20Address } from "@/lib/prizes/tron-address";
import { getTelegramInitData } from "@/lib/telegram/client";
import styles from "./PrizesPayoutsScreen.module.css";

interface IPrizesPayoutsScreenProps {
  onBack: () => void;
}

const iconBase = "/assets/prizes-payouts";

const PrizesPayoutsScreen: React.FC<IPrizesPayoutsScreenProps> = ({
  onBack,
}) => {
  const { t, locale } = useTranslation();
  const apiClient = useMemo(() => new ApiClient({ getTelegramInitData }), []);
  const [data, setData] = useState<PrizePayoutsResponse | null>(null);
  const [selectedPrize, setSelectedPrize] = useState<PrizePayoutCardDto | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (showLoading = true): Promise<void> => {
      if (showLoading) {
        setIsLoading(true);
        setError(null);
      }

      try {
        setData(await apiClient.getPrizePayouts());
      } catch (loadError) {
        setError(messageForApiError(loadError, locale));
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, locale],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load(false);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [load]);

  function updatePrize(nextPrize: PrizePayoutCardDto): void {
    setData((current) => {
      if (!current) {
        return current;
      }

      return {
        summary: current.summary,
        items: current.items.map((item) =>
          item.entitlementId === nextPrize.entitlementId ? nextPrize : item,
        ),
      };
    });
    setSelectedPrize(nextPrize);
  }

  return (
    <main className={styles.screen}>
      <div className={styles.scrollArea}>
        <header className={styles.header}>
          <button
            type="button"
            className={styles.backButton}
            onClick={onBack}
            aria-label={t("prizesPayouts.back")}
          >
            <ArrowLeftIcon className={styles.backIcon} />
          </button>
          <div>
            <h1>{t("prizesPayouts.title")}</h1>
            <p>{t("prizesPayouts.subtitle")}</p>
          </div>
        </header>

        <section className={styles.infoCard}>
          <Image
            src={`${iconBase}/usdt.svg`}
            alt=""
            className={styles.brandIcon}
            width={54}
            height={54}
          />
          <div>
            <strong>{t("prizesPayouts.info.title")}</strong>
            <p>{t("prizesPayouts.info.body")}</p>
          </div>
        </section>

        {isLoading ? (
          <div className={styles.stateCard}>{t("prizesPayouts.loading")}</div>
        ) : error ? (
          <div className={styles.stateCard}>
            <p>{error}</p>
            <button type="button" onClick={() => void load()}>
              {t("prizesPayouts.retry")}
            </button>
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <section className={styles.summaryCard}>
              <h2>{t("prizesPayouts.yourPrizes")}</h2>
              <div className={styles.summaryGrid}>
                <SummaryValue
                  label={t("prizesPayouts.summary.totalWon")}
                  amount={data.summary.totalWon}
                />
                <SummaryValue
                  label={t("prizesPayouts.summary.pending")}
                  amount={data.summary.pending}
                  tone="pending"
                />
                <SummaryValue
                  label={t("prizesPayouts.summary.paid")}
                  amount={data.summary.paid}
                  tone="paid"
                />
              </div>
            </section>
            <section className={styles.list}>
              {data.items.map((prize) => (
                <PrizeCard
                  key={prize.entitlementId}
                  prize={prize}
                  onOpen={() => setSelectedPrize(prize)}
                />
              ))}
            </section>
          </>
        ) : (
          <div className={styles.stateCard}>
            <strong>{t("prizesPayouts.empty.title")}</strong>
            <p>{t("prizesPayouts.empty.body")}</p>
          </div>
        )}
      </div>

      {selectedPrize ? (
        <ClaimPrizeSheet
          prize={selectedPrize}
          apiClient={apiClient}
          onClose={() => setSelectedPrize(null)}
          onSubmitted={updatePrize}
        />
      ) : null}
    </main>
  );
};

interface ISummaryValueProps {
  label: string;
  amount: string;
  tone?: "pending" | "paid";
}

const SummaryValue: React.FC<ISummaryValueProps> = ({
  label,
  amount,
  tone,
}) => (
  <div className={styles.summaryValue}>
    <span>{label}</span>
    <strong className={tone ? styles[tone] : undefined}>
      <bdi>{amount}</bdi> <small>USDT</small>
    </strong>
  </div>
);

interface IPrizeCardProps {
  prize: PrizePayoutCardDto;
  onOpen: () => void;
}

const PrizeCard: React.FC<IPrizeCardProps> = ({ prize, onOpen }) => {
  const { t, locale } = useTranslation();
  const statusClass = statusTone(prize.status);
  const actionLabel = cardActionLabel(prize, t);

  return (
    <article className={`${styles.prizeCard} ${styles[statusClass]}`}>
      <button type="button" className={styles.cardButton} onClick={onOpen}>
        <span className={styles.trophyBox}>
          <MaskIcon name="trophy" className={styles.trophyIcon} />
        </span>
        <span className={styles.cardContent}>
          <strong>
            {t("prizesPayouts.cupName", { number: prize.cupNumber })}
          </strong>
          <span>
            {t("prizesPayouts.place", { place: prize.finalPlacement })}
          </span>
          <b>
            <bdi>{prize.amount}</bdi> USDT
          </b>
          {prize.status === "ACTION_REQUIRED" ? (
            <span>{t("prizesPayouts.actionRequired.short")}</span>
          ) : prize.status === "PAID" && prize.paidAt ? (
            <span>
              {t("prizesPayouts.paidOn", {
                date: formatKickoffTime(locale, prize.paidAt),
              })}
            </span>
          ) : prize.status === "UNDER_REVIEW" && prize.claimedAt ? (
            <span>
              {t("prizesPayouts.submittedOn", {
                date: formatKickoffTime(locale, prize.claimedAt),
              })}
            </span>
          ) : prize.maskedWalletAddress ? (
            <span>
              <bdi>{prize.maskedWalletAddress}</bdi>
            </span>
          ) : null}
        </span>
        <span className={styles.cardActions}>
          <span className={styles.statusPill}>
            {statusLabel(prize.status, t)}
          </span>
          {actionLabel ? (
            <span className={styles.cardActionLabel}>{actionLabel}</span>
          ) : null}
          <MaskIcon name="chevron-right" className={styles.chevronIcon} />
        </span>
      </button>
    </article>
  );
};

interface IClaimPrizeSheetProps {
  prize: PrizePayoutCardDto;
  apiClient: ApiClient;
  onClose: () => void;
  onSubmitted: (prize: PrizePayoutCardDto) => void;
}

const ClaimPrizeSheet: React.FC<IClaimPrizeSheetProps> = ({
  prize,
  apiClient,
  onClose,
  onSubmitted,
}) => {
  const { t, locale } = useTranslation();
  const [walletAddress, setWalletAddress] = useState(prize.walletAddress ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const canEdit =
    prize.status === "READY_TO_CLAIM" || prize.status === "ACTION_REQUIRED";
  const isValid =
    walletAddress.trim() === "" || isValidTrc20Address(walletAddress);

  async function submit(): Promise<void> {
    setMessage(null);

    if (!isValidTrc20Address(walletAddress)) {
      setMessage(t("prizesPayouts.claim.invalidAddress"));
      return;
    }

    setIsSubmitting(true);

    try {
      const nextPrize = await apiClient.submitPrizeClaim({
        entitlementId: prize.entitlementId,
        walletAddress,
      });

      onSubmitted(nextPrize);
    } catch (submitError) {
      setMessage(messageForApiError(submitError, locale));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyValue(value: string): Promise<void> {
    await navigator.clipboard.writeText(value);
    setCopyMessage(t("prizesPayouts.copied"));
  }

  return (
    <div className={styles.sheetBackdrop} role="presentation">
      <section
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-prize-title"
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={t("prizesPayouts.claim.close")}
        >
          <MaskIcon name="close" className={styles.closeIcon} />
        </button>
        <h2 id="claim-prize-title">
          {canEdit
            ? t("prizesPayouts.claim.title")
            : t("prizesPayouts.details.title")}
        </h2>
        <p>{t("prizesPayouts.claim.subtitle")}</p>

        <div className={styles.claimSummary}>
          <span className={styles.trophyBox}>
            <MaskIcon name="trophy" className={styles.trophyIcon} />
          </span>
          <div>
            <strong>
              {t("prizesPayouts.cupName", { number: prize.cupNumber })}
            </strong>
            <span>
              {t("prizesPayouts.place", { place: prize.finalPlacement })}
            </span>
            <b>
              <bdi>{prize.amount}</bdi> USDT
            </b>
          </div>
          <div className={styles.assetRow}>
            <Image
              src={`${iconBase}/usdt.svg`}
              alt=""
              className={styles.smallBrandIcon}
              width={34}
              height={34}
            />
            <span>USDT</span>
            <Image
              src={`${iconBase}/tron.svg`}
              alt=""
              className={styles.smallBrandIcon}
              width={34}
              height={34}
            />
            <span>TRON (TRC-20)</span>
          </div>
        </div>

        {prize.status === "ACTION_REQUIRED" && prize.actionRequiredMessage ? (
          <div className={styles.warning}>
            <MaskIcon name="info" className={styles.noticeIcon} />
            <span>{prize.actionRequiredMessage}</span>
          </div>
        ) : null}

        {prize.status === "REJECTED" && prize.rejectionReason ? (
          <div className={styles.errorNotice}>{prize.rejectionReason}</div>
        ) : null}

        <label className={styles.field}>
          <span>{t("prizesPayouts.claim.addressLabel")}</span>
          <span className={styles.inputWrap}>
            <input
              value={walletAddress}
              onChange={(event) => setWalletAddress(event.target.value)}
              placeholder="T..."
              disabled={!canEdit || isSubmitting}
              dir="ltr"
            />
            {prize.walletAddress && !canEdit ? (
              <button
                type="button"
                onClick={() => void copyValue(prize.walletAddress ?? "")}
                aria-label={t("prizesPayouts.copy")}
              >
                <MaskIcon name="copy" className={styles.copyIcon} />
              </button>
            ) : null}
          </span>
        </label>
        {!isValid ? (
          <p className={styles.fieldError}>
            {t("prizesPayouts.claim.invalidAddress")}
          </p>
        ) : null}

        <div className={styles.notice}>
          <MaskIcon name="info" className={styles.noticeIcon} />
          <span>{t("prizesPayouts.claim.safety")}</span>
        </div>

        {prize.status === "PAID" && prize.paidAt ? (
          <p className={styles.detailLine}>
            {t("prizesPayouts.paidOn", {
              date: formatKickoffTime(locale, prize.paidAt),
            })}
          </p>
        ) : null}
        {prize.transactionUrl ? (
          <div className={styles.hashLine}>
            <span>{t("prizesPayouts.hashLabel")}</span>
            <bdi>{prize.transactionHash}</bdi>
            <button
              type="button"
              onClick={() => void copyValue(prize.transactionHash ?? "")}
              aria-label={t("prizesPayouts.copy")}
            >
              <MaskIcon name="copy" className={styles.copyIcon} />
            </button>
          </div>
        ) : null}
        {prize.transactionUrl ? (
          <a
            className={styles.secondaryLink}
            href={prize.transactionUrl}
            target="_blank"
            rel="noreferrer"
          >
            {t("prizesPayouts.viewTransaction")}
            <MaskIcon name="external-link" className={styles.linkIcon} />
          </a>
        ) : null}
        {prize.status === "REJECTED" && supportDestination.telegramUrl ? (
          <a
            className={styles.secondaryLink}
            href={supportDestination.telegramUrl}
            target="_blank"
            rel="noreferrer"
          >
            <MaskIcon name="help" className={styles.linkIcon} />
            {t("prizesPayouts.contactSupport")}
          </a>
        ) : null}

        {message ? <p className={styles.fieldError}>{message}</p> : null}
        {copyMessage ? (
          <p className={styles.copyMessage}>{copyMessage}</p>
        ) : null}
        {canEdit ? (
          <button
            type="button"
            className={styles.submitButton}
            disabled={isSubmitting}
            onClick={submit}
          >
            {isSubmitting
              ? t("prizesPayouts.claim.submitting")
              : prize.status === "ACTION_REQUIRED"
                ? t("prizesPayouts.claim.update")
                : t("prizesPayouts.claim.submit")}
          </button>
        ) : null}
      </section>
    </div>
  );
};

interface IMaskIconProps {
  name: string;
  className?: string;
}

const MaskIcon: React.FC<IMaskIconProps> = ({ name, className }) => (
  <span
    className={className}
    aria-hidden="true"
    style={{
      WebkitMask: `url("${iconBase}/${name}.svg") center / contain no-repeat`,
      mask: `url("${iconBase}/${name}.svg") center / contain no-repeat`,
    }}
  />
);

function statusTone(status: PrizePayoutCardDto["status"]): string {
  switch (status) {
    case "READY_TO_CLAIM":
      return "ready";
    case "ACTION_REQUIRED":
      return "action";
    case "PAID":
      return "paidCard";
    case "REJECTED":
      return "rejected";
    case "UNDER_REVIEW":
      return "review";
  }
}

function statusLabel(
  status: PrizePayoutCardDto["status"],
  t: ReturnType<typeof useTranslation>["t"],
): string {
  switch (status) {
    case "READY_TO_CLAIM":
      return t("prizesPayouts.status.READY_TO_CLAIM");
    case "UNDER_REVIEW":
      return t("prizesPayouts.status.UNDER_REVIEW");
    case "ACTION_REQUIRED":
      return t("prizesPayouts.status.ACTION_REQUIRED");
    case "PAID":
      return t("prizesPayouts.status.PAID");
    case "REJECTED":
      return t("prizesPayouts.status.REJECTED");
  }
}

function cardActionLabel(
  prize: PrizePayoutCardDto,
  t: ReturnType<typeof useTranslation>["t"],
): string | null {
  switch (prize.status) {
    case "READY_TO_CLAIM":
      return t("prizesPayouts.claim.submit");
    case "ACTION_REQUIRED":
      return t("prizesPayouts.claim.update");
    case "PAID":
      return prize.transactionUrl ? t("prizesPayouts.viewTransaction") : null;
    case "UNDER_REVIEW":
    case "REJECTED":
      return null;
  }
}

export default PrizesPayoutsScreen;
