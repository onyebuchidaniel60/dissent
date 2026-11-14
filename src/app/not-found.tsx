import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="page-width app-main">
      <div className="panel panel--glow mx-auto max-w-2xl">
        <div className="empty-state">
          <span className="empty-icon">
            <Compass size={20} aria-hidden="true" />
          </span>
          <p className="small-caps text-primary">404 · route not found</p>
          <h1 className="empty-title">This audit trail does not exist.</h1>
          <p className="empty-copy">
            The page may have moved, or the identifier may not belong to this deployment. No audit
            data was changed.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/app" className="button button--primary">
              Return to console
            </Link>
            <Link href="/" className="button button--ghost">
              <ArrowLeft size={14} aria-hidden="true" />
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
