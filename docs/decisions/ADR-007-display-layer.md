# ADR-007: A legible display unit over CGT, with no peg

**Status:** Accepted, 13 September 2026, by the project owner. The conversion source and the exact
meaning of the unit are unaddressed (U-2, U-3 in `docs/economics/OPEN_QUESTIONS.md`).

## Context

Even with one hundred trillion units, per-use prices and small earnings can be awkward to read as raw
CGT, and a currency that moves against other currencies forces creators to re-price. The launcher
today shows raw CGT with a two-decimal floor (`tools/qor-launcher/src-tauri/src/cgt.rs:120-134`) and
nothing else.

## Decision

Users are never required to read raw CGT amounts to understand value. The launcher and the web surface
display a legible unit, working name "credits", formatted like ordinary money: "you earned 4.20". The
chain settles in CGT underneath. Raw CGT is visible only in advanced or developer views.

Creators may denominate prices in a stable display unit; the protocol converts to CGT at settlement,
so catalogues do not need re-pricing when the market moves.

The display layer is a legibility affordance and not a peg. Documentation and interface copy never
imply that CGT is redeemable for, pegged to, or equivalent to any national currency.

## Consequences

The launcher's amount formatting and every balance and price display gain a credits presentation with
raw CGT behind an advanced view. The existing `cgt.rs` parse-and-format code, which is careful about
integer arithmetic and excess precision, is the right foundation for the raw layer.

Conversion at settlement needs a reference rate that does not exist, and the choice of source is an
open design problem with trust and language consequences. Until it is decided, stable-unit pricing
cannot be built, and nothing in the interface should suggest it exists.

Copy that displays credits is bound by ADR-008 and must not attach a currency symbol or a national
currency name to the figure.
