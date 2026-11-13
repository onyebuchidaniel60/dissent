# Design Notes — Dissent

## Reference intake

Two operator-supplied, operator-owned references were received and inspected:

- `design/dissent-reference1.webp` — 2048×1536. Primary landing and authenticated dashboard composition.
- `design/dissent-reference2.webp` — 2018×12858. Full visual system: typography, palette, 12-column grid, landing sections, feature grid, proof/roadmap section, footer and mobile stacking.

See `REFERENCE_ASSETS.md` for hashes and intended screen mapping. The references use ShibaNex branding and content; **none of that branding, copy, mascot, token claims or trade dress is copied**. The structural and visual language is adapted to Dissent.

## Design interpretation

- **Canvas:** near-black `#08070A` with a deep crimson field and a restrained red radial glow. A faint 84px technical grid echoes the reference's ruled background without competing with content.
- **Primary accent:** `#FE201F`; secondary maroon `#371515`; paragraph gray `#898181`; white `#FFFFFF`. Derived surfaces are dark neutral tints chosen for contrast.
- **Display type:** Orbitron (Google Fonts, OFL) for wide uppercase headings, approximating the reference's geometric display treatment without using its proprietary font files.
- **Body/UI type:** Manrope for legibility; JetBrains Mono for hashes, account IDs, policy versions and technical labels.
- **Composition:** oversized hero, thin-bordered panels, 12-column-derived max width (1520px), asymmetric dashboard with a persistent right-hand inspector rail, six-card capability grid, horizontal rule dividers, red focus rings and pill status labels.
- **Density:** the reference is dense but hierarchical. Dissent keeps the dashboard dense and the result/coverage surfaces legible; no decorative chart is used to imply a real metric.
- **Motion:** restrained hover/focus transitions, a pulsing active timeline dot, and reduced-motion support. No looping background animation.
- **Status encoding:** every status has text and an icon, not color alone. The coverage matrix uses compact text labels and scrolls horizontally on narrow screens.

## Route mapping

- `/` → reference hero + product preview panel.
- `/app` → reference dashboard split and attacker/feature grid.
- `/app/audits/new` → panel language applied to a structured form and sticky hash/commitment rail.
- `/app/audits/[id]` and `/results` → timeline, inspector rail, coverage table and dissent panels.
- `/app/certificates/[id]` and `/verify/[id]` → technical proof panels and hash blocks.
- `/operator` and `/operator/providers` → denser operational cards with the same red/black language.
- `/docs` → documentation layout with sticky section navigation.

## Intentional deviations

1. **No ShibaNex identity.** Product name, copy, mark, mascot and token language are replaced with Dissent. The mark is an original geometric red tile with a slash, not the reference mascot.
2. **No fake charts.** The reference dashboard contains decorative data visualizations. Dissent's preview uses a labelled fixture rather than fabricated live metrics.
3. **No TEE badge.** The frozen TEE gate is waived under the budget constraint. A global waiver notice is shown; attacker cards do not display a TEE badge.
4. **Simplified display font.** Orbitron is a free approximation of the reference's proprietary display type; the exact font files are not copied.
5. **Mobile tables.** Data tables transform into labelled rows at ≤640px; the coverage matrix remains horizontally scrollable with a sticky first column.
6. **Preview states.** Unimplemented flows are labelled checkpoint states, not rendered as dead buttons. The wallet dialog explains the Phase 2 boundary; the audit form performs only local validation and hash preview.

## Stageshow skill

At the start of Phase 1 UI work, `npx skills add benjitaylor/skills --skill stageshow` was run successfully. The skill was inspected at `.agents/skills/stageshow/SKILL.md`. It is a kit for faux marketing UI, not a real application framework, so its relevant craft rules were applied selectively:

- quiet hierarchy and one clear focal object;
- real strings only where they carry meaning;
- consistent insets and aligned baselines;
- no stock AI sparkles or made-up logos;
- reduced-motion support and deliberate framing.

The kit itself was not copied into the product because Dissent is a real app, not a faux product illustration. No skill instruction was followed where it conflicted with accessibility, product truthfulness or the security spec.

## Verification

Phase 1 screenshots at 1440×900 and 390×844 are captured in Phase 6/7. Phase 1 acceptance is route navigation, no horizontal page scroll, health checks and preview deployment. Final visual comparison against both references remains a Phase 7 gate.
