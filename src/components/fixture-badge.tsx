import { FlaskConical, ShieldOff } from "lucide-react";

export function FixtureBadge() {
  return (
    <span className="tag tag--fixture">
      <FlaskConical size={10} aria-hidden="true" />
      Demo fixture
    </span>
  );
}

export function TeeWaiverNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`notice ${compact ? "notice--info" : "notice--warn"}`}>
      <ShieldOff size={16} aria-hidden="true" />
      <div>
        <strong className="text-ink">TEE attestation is waived under the zero-spend constraint.</strong>{" "}
        The OpenRouter <span className="mono">near-ai</span> route is not an attested NEAR AI Cloud
        gateway. No TEE badge is displayed, and no audit may claim confidential inference. Model
        family and vendor diversity remain enforced.
      </div>
    </div>
  );
}
