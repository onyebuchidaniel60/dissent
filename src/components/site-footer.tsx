import Link from "next/link";

import { BrandMark, Wordmark } from "@/components/brand";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="page-width">
        <div className="footer-grid">
          <div>
            <Link href="/" className="brand" aria-label={`${SITE.name} home`}>
              <BrandMark />
              <Wordmark />
            </Link>
            <p className="footer-copy mt-4">
              Dissent is an evidence-backed adversarial audit protocol for AI trading agents. It
              is an audit and verification layer — not an exchange, custodian, wallet or investment
              adviser. Execution is disabled by default and requires explicit operator enablement.
            </p>
          </div>

          <nav className="footer-links" aria-label="Footer navigation">
            <Link href="/docs">Documentation</Link>
            <Link href={SITE.repoUrl} rel="noreferrer" target="_blank">
              GitHub
            </Link>
            <Link href={SITE.verifyPath}>Public verify</Link>
            <Link href="/operator">Operator console</Link>
            <Link href="/docs#security">Security model</Link>
          </nav>
        </div>

        <div className="footer-bottom">
          <span>Production build</span>
          <span>{SITE.network}</span>
          <span>© 2026 Dissent</span>
        </div>
      </div>
    </footer>
  );
}
