import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/ui";
import { NewAuditForm } from "./audit-form";

export const metadata = {
  title: "New audit",
};

export default function NewAuditPage() {
  return (
    <>
      <PageHeader
        eyebrow="New audit · draft"
        title="Define the"
        accent="failure."
        description="State the trade, then commit the conditions that would prove the thesis wrong. The form creates a session-scoped draft; commitment and funding are separate wallet actions."
        actions={
          <Link href="/app/audits" className="button button--ghost">
            <ArrowLeft size={14} aria-hidden="true" />
            Back to audits
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="tag tag--ok">Session-scoped draft</span>
        <span className="tag tag--muted">Local validation</span>
      </div>
      <NewAuditForm />
    </>
  );
}
