import Link from "next/link";
import { ShieldCheck, ShieldOff } from "lucide-react";

import { WalletConnectButton } from "@/components/wallet-connect-button";
import { getWalletSession } from "@/lib/auth";
import { getAdminAllowlist, maskAccount } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const session = await getWalletSession();
  const isAdmin = Boolean(
    session && getAdminAllowlist().includes(session.accountId),
  );

  if (!isAdmin) {
    return (
      <div className="page-width app-main">
        <div className="panel panel--glow mx-auto max-w-2xl">
          <div className="panel-body">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              Operator boundary
            </span>
            <h1 className="page-title mt-3">
              {session ? "Wallet not" : "Operator access"}
              <span className="accent">{session ? " allowlisted." : " is gated."}</span>
            </h1>
            <p className="page-subtitle">
              {session
                ? `The connected account ${maskAccount(session.accountId)} is not on the server-side operator allowlist. No operator data or privileged action is returned.`
                : "Connect a NEAR wallet. The server verifies a signed nonce and checks the account against the operator allowlist before rendering any operational data."}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <WalletConnectButton className="button button--primary" />
              <Link href="/app" className="button button--ghost">
                Return to client console
              </Link>
            </div>
            <div className="notice notice--info mt-6">
              <ShieldOff size={16} aria-hidden="true" />
              <span>
                The route is not hidden by CSS. It returns this gate from the server and does not
                render the operator children until the allowlist check passes.
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-2">
              <ShieldCheck size={13} aria-hidden="true" />
              Admin authorization is derived from the verified session and
              <span className="mono">ADMIN_WALLET_ADDRESSES</span>.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-width app-main">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="tag tag--red">Operator-only surface</span>
          <span className="tag tag--ok">allowlisted · {maskAccount(session!.accountId)}</span>
        </div>
        <nav className="flex w-full min-w-0 flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted sm:w-auto">
          <Link href="/operator" className="hover:text-ink">
            Overview
          </Link>
          <Link href="/operator/providers" className="hover:text-ink">
            Providers
          </Link>
          <Link href="/operator/proprietary" className="hover:text-ink">
            Proprietary
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
