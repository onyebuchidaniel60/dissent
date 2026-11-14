import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Results are part of the audit record. Keep this route as a stable redirect
 * for old links instead of maintaining a second, fixture-only surface.
 */
export default async function AuditResultsRedirect({
  params,
}: {
  params: Promise<{ auditId: string }>;
}) {
  const { auditId } = await params;
  redirect(`/app/audits/${auditId}`);
}
