import Link from "next/link";
import { ArrowRight, KeyRound, LockKeyhole, ShieldCheck, WalletCards } from "lucide-react";

import { FixtureBadge } from "@/components/fixture-badge";
import { PageHeader, Panel } from "@/components/ui";
import { WalletConnectButton } from "@/components/wallet-connect-button";

export default function ApiKeysPage() {
  return (
    <>
      <PageHeader
        eyebrow="Workspace settings · preview"
        title="Scoped keys."
        accent="No shared secrets."
        description="Programmatic clients authenticate with opaque, scoped API keys. Human operators authenticate with a NEAR wallet session; there is no email/password path anywhere."
        actions={<WalletConnectButton className="button button--primary" label="Connect wallet" />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FixtureBadge />
        <span className="tag tag--warn">Wallet gate · Phase 2</span>
        <span className="tag tag--muted">No key is displayed here</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Panel
          title="API credentials"
          subtitle="Issuance, rotation and revocation arrive with the identity service in Phase 2."
        >
          <div className="empty-state">
            <span className="empty-icon">
              <KeyRound size={20} aria-hidden="true" />
            </span>
            <h2 className="empty-title">No credential is active in this preview.</h2>
            <p className="empty-copy">
              The demo key is provisioned once by the operator CLI, printed once, and stored only as
              a hash. This page will never display an existing secret again.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <WalletConnectButton className="button button--primary" label="Wallet session" />
              <Link href="/docs#api-keys" className="button button--ghost">
                Key lifecycle
              </Link>
            </div>
          </div>

          <div className="border-t border-line p-4">
            <div className="notice notice--info">
              <ShieldCheck size={15} aria-hidden="true" />
              <span>
                The browser preview has no wallet extension connected and cannot create a key. It
                does not simulate a successful issuance.
              </span>
            </div>
          </div>
        </Panel>

        <div className="rail-stack">
          <Panel title="Demo client" subtitle="Deterministic E2E path.">
            <div className="rail-row">
              <span>Workspace</span>
              <strong>demo-client</strong>
            </div>
            <div className="rail-row">
              <span>Testnet account</span>
              <strong>demo-client.testnet</strong>
            </div>
            <div className="rail-row">
              <span>Signing mode</span>
              <strong>agent-supplied tx</strong>
            </div>
            <div className="rail-row">
              <span>Key storage</span>
              <strong>hash only</strong>
            </div>
          </Panel>

          <Panel title="Scopes" subtitle="Minimum authority per key.">
            <div className="flex flex-wrap gap-2">
              <span className="tag tag--muted">audit:create</span>
              <span className="tag tag--muted">audit:read:own</span>
              <span className="tag tag--muted">certificate:read:own</span>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <LockKeyhole size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-[11px] leading-relaxed text-muted">
                Keys cannot list clients, read another workspace, submit settlement instructions or
                sign a wallet transaction. Authorization is enforced server-side, not by hiding
                controls.
              </p>
            </div>
          </Panel>

          <Panel title="Human session" subtitle="No email or password.">
            <div className="flex items-start gap-3">
              <WalletCards size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-[11px] leading-relaxed text-muted">
                Connect → sign a server-issued nonce → verify the access key through NEAR RPC → set
                an HttpOnly SameSite=Lax session cookie. Nonces are single-use and expire in five
                minutes.
              </p>
            </div>
            <Link href="/docs#wallet-auth" className="button button--ghost button--small mt-4">
              Read the flow
              <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </Panel>
        </div>
      </div>
    </>
  );
}
