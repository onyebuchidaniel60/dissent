import type { CSSProperties } from "react";

const ATTACKERS = ["A01", "A02", "A03", "A04", "A05", "A06", "A07", "A08"];

/**
 * Decorative mobile-flow animation for the hero. It is intentionally not a
 * real control: the CTA is a div, the phone is aria-hidden, and the sequence
 * is pure CSS so it cannot intercept input or depend on client JavaScript.
 */
export function HeroPhone() {
  return (
    <div className="hero-phone" aria-hidden="true" data-testid="hero-phone">
      <div className="hero-phone-glow" />
      <div className="hero-phone-device">
        <div className="hero-phone-notch" />
        <div className="hero-phone-screen">
          <div className="hero-phone-status">
            <span>9:41</span>
            <span className="hero-phone-signal">•••</span>
          </div>

          <div className="hero-phone-appbar">
            <span className="hero-phone-logo">D</span>
            <span className="hero-phone-brand">DISSENT</span>
            <span className="hero-phone-pill">AUDIT</span>
          </div>

          <div className="hero-phone-body">
            <p className="hero-phone-kicker">New thesis</p>
            <p className="hero-phone-title">wNEAR / USDC</p>
            <p className="hero-phone-copy">Sell 0.01 wNEAR · 1Click</p>

            <div className="hero-phone-cta">
              <span className="hero-phone-cta-label hero-phone-cta-label--idle">Submit thesis</span>
              <span className="hero-phone-cta-label hero-phone-cta-label--done">Submitted</span>
              <span className="hero-phone-cta-ripple" />
            </div>

            <div className="hero-phone-attacker-head">
              <span>Attackers</span>
              <span className="hero-phone-live">
                <i />
                live
              </span>
            </div>

            <div className="hero-phone-attackers">
              {ATTACKERS.map((attacker, index) => (
                <span
                  key={attacker}
                  className="hero-phone-dot"
                  style={{ "--i": index } as CSSProperties}
                >
                  <i />
                  {attacker}
                </span>
              ))}
            </div>

            <div className="hero-phone-result">
              <span className="hero-phone-pending">Certificate pending</span>
              <div className="hero-phone-verdict">
                <span className="hero-phone-verdict-badge">TRADE</span>
                <span className="hero-phone-verdict-copy">Certificate anchored</span>
              </div>
            </div>

            <div className="hero-phone-footer">
              <span>Policy v1.0</span>
              <span>8 attackers</span>
            </div>
          </div>
        </div>
        <div className="hero-phone-button hero-phone-button--volume" />
        <div className="hero-phone-button hero-phone-button--power" />
      </div>
    </div>
  );
}
