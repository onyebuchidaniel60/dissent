"use client";

import { Buffer } from "buffer";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, LogOut, WalletCards, X } from "lucide-react";

import { DEFAULT_WALLET_NETWORK } from "@/lib/config";
import type { WalletSelector } from "@near-wallet-selector/core";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";

const NEAR_WALLET_NETWORK = (process.env.NEXT_PUBLIC_NEAR_NETWORK ?? DEFAULT_WALLET_NETWORK) as "mainnet";

type Session = {
  accountId: string;
  isAdmin: boolean;
};

function normalizePublicKey(publicKey: string): string {
  const trimmed = publicKey.trim();
  return /^(ed25519|secp256k1|ml-dsa-65):/i.test(trimmed) ? trimmed : `ed25519:${trimmed}`;
}

function normalizeSignature(signature: unknown): string {
  if (typeof signature === "string") return signature.trim();
  if (signature instanceof Uint8Array) return Buffer.from(signature).toString("base64");
  if (Array.isArray(signature)) return Buffer.from(signature).toString("base64");
  return String(signature ?? "").trim();
}

function shortAccount(accountId: string) {
  const local = accountId.split(".")[0] || accountId;
  if (local.length <= 16) return local;
  return `${local.slice(0, 8)}…${local.slice(-4)}`;
}

export function WalletConnectButton({
  className = "button button--primary",
  label = "Connect wallet",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const selectorRef = useRef<WalletSelector | null>(null);
  const modalRef = useRef<WalletSelectorModal | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        setSession(
          data.authenticated
            ? { accountId: data.accountId, isAdmin: Boolean(data.isAdmin) }
            : null,
        );
      })
      .catch(() => {
        if (active) setSession(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const authenticate = useCallback(
    async (selector: WalletSelector, accountId: string) => {
      setBusy(true);
      setError(null);
      try {
        const nonceResponse = await fetch("/api/v1/auth/nonce", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ accountId }),
        });
        const challenge = await nonceResponse.json();
        if (!nonceResponse.ok) {
          throw new Error(challenge?.error?.message ?? "Could not create a sign-in challenge.");
        }

        const wallet = await selector.wallet();
        const signed = await wallet.signMessage({
          message: challenge.message,
          recipient: challenge.recipient,
          nonce: Buffer.from(challenge.nonce, "base64"),
          callbackUrl: challenge.callbackUrl,
        });

        if (!signed) throw new Error("This wallet does not support message signing.");
        if (signed.accountId !== accountId) {
          throw new Error("The wallet account changed during sign-in. Reconnect and try again.");
        }

        const publicKey = normalizePublicKey(signed.publicKey);
        const signature = normalizeSignature(signed.signature);
        if (!signature) throw new Error("The wallet returned an empty signature.");

        const verifyResponse = await fetch("/api/v1/auth/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            accountId: signed.accountId,
            publicKey,
            signature,
            nonce: challenge.nonce,
            recipient: challenge.recipient,
          }),
        });
        const verified = await verifyResponse.json();
        if (!verifyResponse.ok) {
          throw new Error(verified?.error?.message ?? "Wallet verification failed.");
        }

        setSession({ accountId: verified.accountId, isAdmin: Boolean(verified.isAdmin) });
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Wallet sign-in failed.");
      } finally {
        setBusy(false);
      }
    },
    [router],
  );

  const ensureSelector = useCallback(async () => {
    if (selectorRef.current) return selectorRef.current;

    const { setupWalletSelector } = await import("@near-wallet-selector/core");
    const { setupModal } = await import("@near-wallet-selector/modal-ui");
    const { setupMyNearWallet } = await import("@near-wallet-selector/my-near-wallet");
    const { setupNightly } = await import("@near-wallet-selector/nightly");

    const selector = await setupWalletSelector({
      network: NEAR_WALLET_NETWORK,
      modules: [setupMyNearWallet(), setupNightly()],
    });

    const modal = setupModal(selector, {
      description: "Connect a NEAR wallet to sign the Dissent session challenge.",
    });

    selector.on("signedIn", (event) => {
      const account = event.accounts[0];
      if (account) void authenticate(selector, account.accountId);
    });

    selector.on("signedOut", () => {
      setSession(null);
      router.refresh();
    });

    selectorRef.current = selector;
    modalRef.current = modal;
    setReady(true);
    return selector;
  }, [authenticate, router]);

  const handleOpen = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const selector = await ensureSelector();
      const accounts = selector.store.getState().accounts;
      if (accounts.length > 0) {
        await authenticate(selector, accounts[0].accountId);
      } else {
        modalRef.current?.show();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not initialize the wallet selector.");
    } finally {
      setBusy(false);
    }
  }, [authenticate, ensureSelector]);

  const handleLogout = useCallback(async () => {
    setBusy(true);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      setSession(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }, [router]);

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <span className="tag tag--ok" title={shortAccount(session.accountId)}>
          {session.isAdmin ? "Operator · " : ""}
          {shortAccount(session.accountId)}
        </span>
        <button
          type="button"
          className="icon-button"
          onClick={handleLogout}
          disabled={busy}
          aria-label="Sign out of wallet session"
          title="Sign out"
        >
          <LogOut size={15} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={handleOpen}
        disabled={busy}
        aria-haspopup="dialog"
        aria-busy={busy}
      >
        <WalletCards size={15} aria-hidden="true" />
        {busy ? (ready ? "Signing in…" : "Preparing wallet…") : label}
      </button>

      {error ? (
        <div className="wallet-toast" role="alert">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
          <span>{error}</span>
          <button
            type="button"
            className="icon-button !h-7 !w-7"
            onClick={() => setError(null)}
            aria-label="Dismiss wallet error"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </>
  );
}
