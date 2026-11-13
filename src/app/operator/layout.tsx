import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-width app-main">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="tag tag--red">Operator-only surface</span>
          <span className="tag tag--muted">Synthetic data</span>
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
          <Link href="/operator" className="hover:text-ink">
            Overview
          </Link>
          <Link href="/operator/providers" className="hover:text-ink">
            Providers
          </Link>
          <Link href="/operator/audits/demo-audit-001" className="hover:text-ink">
            Audit operations
          </Link>
        </nav>
      </div>
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-line bg-white/[0.02] p-3 text-[11px] leading-relaxed text-muted">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <span>
          The server-side wallet-allowlist gate is implemented in Phase 2. Until then this preview
          route is visibly labelled, contains no client data and performs no privileged action.
        </span>
      </div>
      {children}
    </div>
  );
}
