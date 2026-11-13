export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? "brand-mark"}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="38" height="38" rx="12" fill="#FE201F" />
      <path
        d="M11.5 28.5L28.5 11.5"
        stroke="#08070A"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <path d="M11.5 11.5H21" stroke="#08070A" strokeWidth="4.2" strokeLinecap="round" />
      <circle cx="28.5" cy="28.5" r="3.2" fill="#08070A" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="brand-word" aria-label="Dissent">
      DIS<span>SENT</span>
    </span>
  );
}
