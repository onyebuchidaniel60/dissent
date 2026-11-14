import { ShieldOff } from "lucide-react";

export function TeeWaiverNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`notice ${compact ? "notice--info" : "notice--warn"}`}>
      <ShieldOff size={16} aria-hidden="true" />
      <div>
        <strong className="text-ink">TEE attestation is unavailable in this deployment.</strong>{" "}
        No TEE badge is displayed, and no audit may claim confidential inference. Model family and
        vendor diversity remain enforced.
      </div>
    </div>
  );
}
