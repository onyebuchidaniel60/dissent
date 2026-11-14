"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2, CircleAlert, WalletCards } from "lucide-react";

import { Panel } from "@/components/ui";
import {
  functionCallAction,
  getConnectedWallet,
  transactionHashFromOutcome,
} from "@/lib/near-wallet";

type QuoteResponse = {
  venue: "ONECLICK" | "TIDEPOOL";
  client_account_id: string;
  quote: {
    deposit_address: string;
    deposit_memo: string;
    amount_in: string;
    amount_in_formatted: string;
    amount_out: string;
    amount_out_formatted: string;
    min_amount_out: string;
    deadline: string;
    time_when_inactive: string;
  };
  pay: { symbol: string; amount_yocto: string };
  receive: { symbol: string; amount_formatted: string };
  transfer: {
    token_id: string;
    storage_deposit_yocto: string;
    memo: string;
  };
  copy: string;
};

type VenueStatus = {
  status: string;
  updatedAt: string;
  swapDetails?: {
    nearTxHashes?: string[];
    amountOutFormatted?: string;
  };
};

function explorerTxUrl(txHash: string): string {
  const base =
    (process.env.NEXT_PUBLIC_NEAR_NETWORK ?? "testnet") === "mainnet"
      ? "https://explorer.near.org"
      : "https://explorer.testnet.near.org";
  return `${base}/transactions/${txHash}`;
}

export function ClientExecutionPanel({
  auditId,
  publicAuditId,
  thesis,
}: {
  auditId: string;
  publicAuditId: string;
  thesis: { action: string; amount: string; unit: string };
}) {
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [phase, setPhase] = useState<"idle" | "quoting" | "signing" | "submitted">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [venueStatus, setVenueStatus] = useState<VenueStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!txHash || !quote) return;
    let active = true;

    const poll = async () => {
      try {
        const response = await fetch(
          `/api/v1/ui/audits/${auditId}/execution/status?deposit_address=${encodeURIComponent(
            quote.quote.deposit_address,
          )}`,
          { cache: "no-store" },
        );
        const body = await response.json();
        if (active && response.ok && body.status) setVenueStatus(body.status as VenueStatus);
      } catch {
        // The venue status endpoint can recover on the next poll.
      }
    };

    void poll();
    const timer = window.setInterval(poll, 4_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [auditId, quote, txHash]);

  async function execute() {
    setPhase("quoting");
    setError(null);
    setVenueStatus(null);
    try {
      const response = await fetch(`/api/v1/ui/audits/${auditId}/execution/quote`, {
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Could not obtain a client execution quote.");
      }
      const nextQuote = body as QuoteResponse;
      setQuote(nextQuote);

      const { wallet, accountId } = await getConnectedWallet();
      if (accountId !== nextQuote.client_account_id) {
        throw new Error(
          `Connect ${nextQuote.client_account_id} to execute this audit. The connected wallet is ${accountId}.`,
        );
      }

      setPhase("signing");
      const outcome = await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: nextQuote.transfer.token_id,
        actions: [
          functionCallAction({
            methodName: "storage_deposit",
            args: {
              account_id: nextQuote.quote.deposit_address,
              registration_only: true,
            },
            gas: "30000000000000",
            deposit: nextQuote.transfer.storage_deposit_yocto,
          }),
          functionCallAction({
            methodName: "ft_transfer",
            args: {
              receiver_id: nextQuote.quote.deposit_address,
              amount: nextQuote.pay.amount_yocto,
              memo: nextQuote.transfer.memo,
            },
            gas: "30000000000000",
            deposit: "1",
          }),
        ],
      });

      const hash = transactionHashFromOutcome(outcome);
      if (!hash) throw new Error("The wallet did not return a transaction hash.");
      setTxHash(hash);
      setPhase("submitted");
    } catch (cause) {
      setPhase("idle");
      setError(cause instanceof Error ? cause.message : "Client execution failed.");
    }
  }

  return (
    <Panel
      title="Execute with your own wallet"
      subtitle="Dissent audits the thesis. You execute the trade with your own funds via 1Click."
      className="panel--glow"
    >
      <div className="stack-md">
        <div className="notice notice--info">
          <WalletCards size={15} aria-hidden="true" />
          <span>
            {quote?.venue === "TIDEPOOL"
              ? "This Testnet preview uses Tidepool staging for the deposit. 1Click is the Mainnet execution path."
              : "The deposit is signed by your wallet and sent directly to the 1Click quote address. Dissent never holds your funds."}
          </span>
        </div>

        <div className="rail-row">
          <span>Thesis</span>
          <strong>
            {thesis.action} {thesis.amount} {thesis.unit}
          </strong>
        </div>
        <div className="rail-row">
          <span>Audit</span>
          <strong className="mono text-[10px]">{publicAuditId}</strong>
        </div>

        {!quote && !txHash ? (
          <button
            type="button"
            className="button button--primary"
            onClick={execute}
            disabled={phase !== "idle"}
            data-testid="execute-trade"
          >
            <ArrowUpRight size={15} aria-hidden="true" />
            {phase === "quoting"
              ? "Requesting quote…"
              : phase === "signing"
                ? "Waiting for wallet…"
                : "Execute Trade"}
          </button>
        ) : null}

        {quote ? (
          <div className="stack-sm">
            <div className="rail-row">
              <span>Pay</span>
              <strong>
                {quote.quote.amount_in_formatted} {quote.pay.symbol}
              </strong>
            </div>
            <div className="rail-row">
              <span>Receive (min)</span>
              <strong>
                {quote.quote.amount_out_formatted} {quote.receive.symbol}
              </strong>
            </div>
            <div className="rail-row">
              <span>Venue</span>
              <strong>{quote.venue === "ONECLICK" ? "1Click" : "Tidepool staging"}</strong>
            </div>
            <div className="hash-box">
              <span className="hash-label">Deposit address</span>
              <span className="hash-value break-all">{quote.quote.deposit_address}</span>
            </div>
            <p className="text-[10px] text-muted-2">
              Quote expires {new Date(quote.quote.deadline).toLocaleString()}.
            </p>
          </div>
        ) : null}

        {txHash ? (
          <div className="notice notice--info" data-testid="execution-tx">
            <CheckCircle2 size={15} aria-hidden="true" />
            <span>
              Deposit submitted. Tx:{" "}
              <a
                href={explorerTxUrl(txHash)}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                {txHash.slice(0, 14)}…
              </a>
              {venueStatus ? (
                <>
                  {" "}
                  · Venue status: <span className="mono">{venueStatus.status}</span>
                </>
              ) : (
                " · Waiting for venue detection…"
              )}
            </span>
          </div>
        ) : null}

        {error ? (
          <div className="notice notice--warn" role="alert">
            <CircleAlert size={15} aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
