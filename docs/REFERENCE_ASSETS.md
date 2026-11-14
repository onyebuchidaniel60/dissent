# Dissent — Reference Assets Register

**Status at Phase 0 completion:** Two operator-supplied UI references received and inspected. Source/ownership is confirmed by the operator as operator-owned and authorized for this implementation. They are directional design inputs, not permission to copy third-party names, logos, copy, or distinctive trade dress.

| Asset ID | Exact filename/path | Dimensions | Size | Source/ownership | Intended use | Visual traits | Status |
|---|---|---|---|---|---|---|---|
| UI-REF-01 | `design/dissent-reference1.webp` | 2048 × 1536 | 117,256 bytes | Operator-supplied; operator-owned/authorized | Primary app shell, landing composition, authenticated dashboard, navigation, audit overview cards, results summary | Near-black field; deep crimson radial glow; oversized wide display type; red primary accent; thin outlined cards; pill badges; compact utility nav; asymmetric dashboard split with right-hand inspector rail | RECEIVED — inspected |
| UI-REF-02 | `design/dissent-reference2.webp` | 2018 × 12858 | 544,894 bytes | Operator-supplied; operator-owned/authorized | Full visual system: typography, palette, 12-column grid, landing sections, feature grid, audit/results panels, roadmap-style timeline, certificate/proof section, footer, responsive stacking | 1520px design grid with 12 columns, 200px side margin, 30px gutter; `#FE201F` primary red; `#371515` secondary maroon; `#FFFFFF` white; `#898181` paragraph gray; near-black canvas; wide uppercase display headings; monospaced/technical labels; red-glow interactive states; rounded rectangular panels; horizontal rule dividers; arrow/timeline motifs | RECEIVED — inspected |

## Implementation mapping

- **`/` landing:** Use the reference hero hierarchy, oversized two-line headline, pill intro label, restrained technical paragraph, prominent primary action, and a product-preview panel that opens into the dashboard composition. Replace all ShibaNex branding, copy, mascot, token, and financial claims with Dissent product content.
- **`/app` overview:** Use the reference dashboard composition: compact top bar with product mark and search/utility area, greeting heading, primary action, left-hand issue/status cards, central data panel with chart treatment, right-hand identity/health inspector rail, and a six-card capability/feature grid below.
- **`/app/audits/new`:** Use the same panel language for the thesis/conditions form: sectioned dark cards, red focus rings, technical labels, inline validation, sticky summary rail with hashes and commitment state.
- **`/app/audits/[id]` and results:** Use the dashboard's split layout for timeline/progress on the left and a persistent evidence/status rail on the right; use the reference's coverage-table and status-badge language without color-only encoding.
- **Certificate and public verify:** Use the proof/roadmap section's large numeric/technical treatment, red highlight nodes, and concise metadata rows.
- **Operator console:** Reuse the dashboard cards and inspector rail with denser tables, red status accents, and explicit degraded/forbidden states.
- **Mobile:** Collapse the two-column dashboard into stacked cards, preserve the display hierarchy at smaller sizes, make tables horizontally scrollable or transform them into accessible compact rows, and use an accessible menu control.

## Typography and color interpretation

- **Display:** Use a free, self-hosted geometric/technical typeface with wide uppercase forms (for example Orbitron or a licensed equivalent) for hero and section headings. Do not copy the reference's proprietary font files.
- **Body/UI:** Use a neutral, highly legible sans (for example Inter or Manrope) for paragraphs, forms, tables, and metadata. Use a monospaced face for hashes, account IDs, and policy versions.
- **Palette:** Primary `#FE201F`, secondary `#371515`, white `#FFFFFF`, paragraph `#898181`, and a near-black canvas. Derived surfaces may use dark neutral tints; any new tint must preserve contrast and be documented in `docs/DESIGN_NOTES.md`.
- **Depth:** Radial red glow behind key hero/proof moments; thin low-contrast borders; subtle inner highlights; no heavy drop shadows.
- **Motion:** Restrained hover/focus transitions and progress reveals; honor `prefers-reduced-motion`.

## Rules

- Record exact mounted/repository paths after intake; do not claim an asset exists until opened and inspected.
- Confirm the operator has rights to use the reference image. Use it as directional input, not as permission to copy proprietary logos, text, assets or distinctive trade dress.
- Extract composition, hierarchy, density, spacing, typography, color, component treatment, navigation, interaction patterns and responsive behavior.
- Implement the real product UI directly from the references after the E2E functionality gate. No separate mockup/prototype or approval phase.
- Record design interpretation and intentional deviations in `docs/DESIGN_NOTES.md`.
- Reference hashes: UI-REF-01 `8d47b994e732a02a6f3069cf8355946bada97ea07387b5a07d5f0cc81edb2320`; UI-REF-02 `8630cc1891f86c01419deefb172c5de6430d95ef8cef80fcadf610a441338e70`.
