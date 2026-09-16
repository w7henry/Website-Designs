# Origin Financial

A private wealth workspace built on the Origin Financial design system — a
near-black editorial canvas where a whisper-weight serif carries the money and
everything else recedes.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production bundle
```

## The design system is the source of truth

`DESIGN.md`, `theme.css`, `tokens.json` and `variables.css` are the canonical
artefacts and are left untouched. `src/styles/app.css` transcribes their tokens
into a Tailwind v4 `@theme` block, with two corrections needed for the
stylesheet to parse — an unescaped apostrophe in `'Suisse Int'l'`, and the
5-digit hex `#2e2e2` for Graphite.

Spacing is px-based on the system's 4px unit (`--spacing: 1px`), so every
numeric utility resolves to the documented scale: `p-32` is 32px.

**Fonts.** Lyon Display and Suisse Int'l are licensed, so the project
self-hosts the substitutes DESIGN.md nominates. Newsreader stands in for Lyon
Display rather than Playfair or DM Serif: it is the only free high-contrast
serif with a true 300 weight *and* italics, which the system's defining
tension ("never bold the display") and its mixed roman/italic headlines both
require. Inter stands in for Suisse Int'l; Roboto Mono is used directly.

**Colour discipline.** Elevation is a colour step, never a shadow. The six
chromatic tokens appear only on full-bleed category tiles and chart marks.
Financial direction is carried by an explicit sign, an arrow glyph and
contrast — never by hue alone — so no figure depends on colour to be read.

## One ledger, everything derived

`src/data/` holds a single deterministic ledger of 1,293 transactions across
15 months. Nothing else is stored:

- **Historic balances** are derived by unwinding the ledger backwards from
  today's figures, so an account page can never disagree with its own
  transactions.
- **The portfolio path** is walked backwards from its closing value with each
  contribution removed, so it lands exactly and a transfer in never reads as
  a gain.
- **Budgets, analytics, cash flow, goal projections, insights and
  notifications** are all computed from the same ledger at read time.

Everything reconciles to the cent:

| | |
|---|---|
| Accounts sum to net worth | `$124,842.36` |
| Holdings sum to the portfolio | `$86,420.18` |
| Return against cost basis | `+$12,483.22` / `+16.88%` |
| Month to date | `$8,420.00` in, `$4,327.95` out, `48.6%` kept |
| Goals never claim more than the account behind them holds | ✓ |

Figures are month-to-date and labelled as such: the same window of the prior
month is used for every comparison, and only variable categories are
extrapolated when projecting a month end — fixed commitments are already
charged in full.

## Structure

```
src/
  data/        ledger, accounts, holdings, budgets, goals + derivation layer
  lib/         formatting, seeded RNG, hooks
  state/       user edits (notes, categories, limits, prefs), persisted locally
  components/  ui primitives · hand-built SVG charts · finance · layout · command
  pages/       landing · overview · accounts · transactions · analytics ·
               investments · budgets · goals · insights · settings · 404
```

No chart library, icon library, animation library or state library. Charts are
hand-built SVG with monotone interpolation, which cannot overshoot and so never
invents a peak the data does not contain.

## What works

Command menu (⌘K), notification centre, transaction drawer with recategorise,
notes, splitting and recurring detection, CSV export, budget and goal editors,
privacy masking, skeleton loading, empty and error states. Filters, ranges,
tabs and toggles all recompute from the ledger — nothing is decorative.

Verified at 1440 / 1280 / 1024 / 768 / 430 / 390 / 375 with no horizontal
overflow, no console errors, AA contrast throughout, and a bottom navigation
plus sheet on mobile rather than a shrunken desktop layout.

The dataset is a fixed demo snapshot anchored to 16 September 2026. Figures are
synthetic, internally consistent, and not financial advice.
