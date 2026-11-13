"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { WalletCards, X } from "lucide-react";

export function WalletConnectButton({
  className = "button button--primary",
  label = "Connect wallet",
}: {
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <WalletCards size={15} aria-hidden="true" />
        {label}
      </button>

      {open ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-dialog-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="eyebrow">
                  <span className="eyebrow-dot" />
                  Phase 2 checkpoint
                </span>
                <h2 id="wallet-dialog-title" className="mt-3">
                  Wallet session not wired yet
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                className="icon-button"
                onClick={() => setOpen(false)}
                aria-label="Close wallet dialog"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <p>
              This preview does not fake a wallet connection. The NEAR wallet-selector flow,
              signed-nonce challenge and server-side session cookie land in Phase 2. The
              operator allowlist is already configured for the testnet demo account.
            </p>
            <div className="notice notice--info">
              <span>
                Client agents will continue to use scoped API keys. No email/password sign-in is
                part of this build.
              </span>
            </div>

            <div className="modal-actions">
              <Link href="/docs#wallet-auth" className="button button--ghost">
                Read auth design
              </Link>
              <button
                type="button"
                className="button button--primary"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
