export type AttackerProfile = {
  attackerId: string;
  name: string;
  method: string;
  focus: string;
  questions: string[];
  sectionBHints: string[];
};

export const ATTACKER_PROFILES: AttackerProfile[] = [
  {
    attackerId: "A01",
    name: "Liquidity / Execution",
    method: "LIQUIDITY_EXECUTION",
    focus:
      "Test executable liquidity, market impact and whether the proposed size can clear without violating the thesis's execution assumptions.",
    questions: [
      "What is the executable depth at the proposed size?",
      "Does the headline quote hide slippage or fragmented routes?",
      "Can the position be exited under stress, not only entered?",
      "Is the execution venue behavior consistent with the thesis?",
    ],
    sectionBHints: [
      "liquidity concentration",
      "exit-path asymmetry",
      "venue-specific execution limits",
      "market impact under stress",
    ],
  },
  {
    attackerId: "A02",
    name: "Asset Safety",
    method: "ASSET_SAFETY",
    focus:
      "Review contract permissions, token behavior and asset-specific failure modes that the thesis treats as background risk.",
    questions: [
      "Are the contracts upgradeable, paused or permissioned?",
      "Does the token have transfer hooks, blacklists or unusual decimals?",
      "Is the selected venue or asset exposed to a known exploit class?",
      "Does the thesis assume a safety property that is not evidenced?",
    ],
    sectionBHints: [
      "contract permission risk",
      "token behavior",
      "counterparty or bridge exposure",
      "asset-specific failure modes",
    ],
  },
  {
    attackerId: "A03",
    name: "Logic / Coherence",
    method: "LOGIC_COHERENCE",
    focus:
      "Check whether the conclusion follows from the evidence, whether terms are used consistently and whether the thesis overclaims.",
    questions: [
      "Does each claim follow from the observation it cites?",
      "Are time horizon, units and thresholds internally consistent?",
      "Is a condition a real falsification test or a restatement of the thesis?",
      "What would make the thesis false, and is that observable?",
    ],
    sectionBHints: [
      "unstated assumptions",
      "scope creep",
      "contradictory causal claims",
      "unfalsifiable success language",
    ],
  },
  {
    attackerId: "A04",
    name: "Correlation / Portfolio",
    method: "CORRELATION_PORTFOLIO",
    focus:
      "Look for hidden exposures, shared dependencies and correlated drawdowns across the proposed position and the wider book.",
    questions: [
      "What common factor could move the position and the rest of the book together?",
      "Does the thesis count the same exposure twice?",
      "Is diversification assumed without evidence?",
      "What happens to the position in a correlated stress event?",
    ],
    sectionBHints: [
      "correlated protocol exposure",
      "shared collateral or oracle dependency",
      "concentration under stress",
      "portfolio-level drawdown",
    ],
  },
  {
    attackerId: "A05",
    name: "Thesis Inversion",
    method: "THESIS_INVERSION",
    focus:
      "Build the strongest case against the thesis, then specify what observable evidence would make the inversion correct.",
    questions: [
      "What is the best argument that this trade loses money?",
      "Which assumption is doing the most work, and how fragile is it?",
      "What would a well-informed opponent say?",
      "What evidence would change your mind?",
    ],
    sectionBHints: [
      "opposing base case",
      "hidden downside convexity",
      "regime change",
      "the strongest disconfirming observation",
    ],
  },
  {
    attackerId: "A06",
    name: "Data Provenance",
    method: "DATA_PROVENANCE",
    focus:
      "Compare the source, timestamp and derivation of the numbers the thesis relies on. A different source name is not independence by itself.",
    questions: [
      "Are the observations from independent upstream sources?",
      "Do timestamps and block identities align with the decision?",
      "Is a derived metric calculated correctly and from the stated inputs?",
      "Does any source disagree with another beyond tolerance?",
    ],
    sectionBHints: [
      "source correlation",
      "stale or mismatched timestamps",
      "derived-metric error",
      "unresolved cross-source disagreement",
    ],
  },
  {
    attackerId: "A07",
    name: "Timing / MEV",
    method: "TIMING_MEV",
    focus:
      "Examine the execution window, transaction path and adversarial ordering risk around the proposed action.",
    questions: [
      "Can the action be front-run, sandwiched or delayed?",
      "Does the thesis depend on a short-lived state that may disappear?",
      "Is the evaluation window long enough to observe the claimed effect?",
      "What happens if execution lands in a different block or regime?",
    ],
    sectionBHints: [
      "ordering risk",
      "short-lived liquidity",
      "latency and failed execution",
      "time-window mismatch",
    ],
  },
  {
    attackerId: "A08",
    name: "Base Rate",
    method: "BASE_RATE",
    focus:
      "Test the thesis against historical base rates, survivorship effects and the reference class the agent implicitly chose.",
    questions: [
      "What is the reference class for this trade, and why is it appropriate?",
      "Is the thesis selecting a favorable historical window?",
      "What is the base rate of the claimed outcome?",
      "How many comparable attempts failed silently?",
    ],
    sectionBHints: [
      "reference-class bias",
      "survivorship",
      "favorable-window selection",
      "base-rate neglect",
    ],
  },
];

export function profileFor(attackerId: string): AttackerProfile {
  const profile = ATTACKER_PROFILES.find((candidate) => candidate.attackerId === attackerId);
  if (!profile) throw new Error(`Unknown attacker profile: ${attackerId}`);
  return profile;
}
