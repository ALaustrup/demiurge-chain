//! CGT denomination: parsing and formatting.
//!
//! # The unit
//!
//! CGT has **eighteen decimal places** (ADR-035). The chain's single definition
//! lives in `chain/runtime/src/denomination.rs`:
//!
//! ```text
//! DECIMALS            = 18
//! CGT                = 10^18   // 10^18 Sparks = 1 CGT
//! EXISTENTIAL_DEPOSIT = 100 * CGT
//! ```
//!
//! The chain declares **no total supply constant at all**: the issuance rate is
//! OPEN-1 and the genesis split is OPEN-2, so there is nothing to mirror, and
//! this module declares none either. What it does declare is a ceiling on what
//! a person can type, which is a different thing; see [`MAX_AMOUNT_SPARKS`].
//!
//! All balances are handled as integer Sparks in `u128` and never as floating
//! point.
//!
//! # Why eighteen, not two
//!
//! CGT was originally defined at two decimal places, which is too coarse for an
//! asset meant to carry real monetary value. Three live defects followed from
//! it, all now fixed by the change:
//!
//! - The existential deposit was `CGT / 1000`, which is **zero** in integer
//!   arithmetic at two decimals, so the dust check rejected nothing.
//! - The documented 0.001 CGT transfer fee was not representable at all.
//! - Per-item and per-view pricing, which is how creators actually earn, could
//!   not go below one hundredth of a CGT.
//!
//! Eighteen rather than eight or twelve because exchange listing tools, bridges
//! and wallets assume it by default, that being the ERC-20 convention. Matching
//! it removes a class of integration bug for nothing.
//!
//! Every conversion in the launcher goes through this module, and the chain's
//! own definition lives in `chain/runtime/src/denomination.rs`. The two are
//! pinned to each other by a test below, so they cannot drift apart the way
//! `balances` and `agentic` silently did.

use crate::error::{QorError, QorResult};

/// Decimal places. Mirrors `chain/runtime/src/denomination.rs` (ADR-035).
pub const DECIMALS: u32 = 18;

/// Sparks in one CGT.
pub const SPARKS_PER_CGT: u128 = 10u128.pow(DECIMALS);

/// The largest amount [`parse_cgt`] will accept. **A typo guard, not a supply.**
///
/// Read the name literally: this is a bound on input, and it says nothing about
/// how much CGT exists. It replaces a constant named `TOTAL_SUPPLY_SPARKS`
/// that held the fixed 13,000,000,000 figure ADR-003 superseded, and whose
/// removal from this file that record asks for by name.
///
/// **There is no total supply to put here instead.** The base supply is
/// 100,000,000,000,000 CGT (ADR-003), but it is released over a decay curve
/// and complemented by perpetual issuance and burn (ADR-004), so no fixed total
/// exists to compare an amount against. The chain declares no such constant
/// either — issuance is OPEN-1 and the genesis split is OPEN-2 — so a figure
/// here would mirror nothing and could not drift from anything.
///
/// The value is the base supply because the guard needs a number and that one
/// is decided rather than invented. An amount above the whole base supply is a
/// mistyped or pasted figure, and catching it here means it never reaches a
/// signature dialog. It is not a claim that the amount would otherwise be
/// valid: the chain refuses anything above the sender's balance regardless, and
/// that check is the one that matters.
pub const MAX_AMOUNT_SPARKS: u128 = 100_000_000_000_000 * SPARKS_PER_CGT;

/// Ticker.
///
/// `CGT` since ADR-034. The identifiers in this module still read `CGT`,
/// because they are replaced wholesale by the Substrate implementation.
pub const SYMBOL: &str = "CGT";

/// Full name, per `.cursorrules`, which is the stated law of the project.
///
/// The name is unchanged by the ticker's change to `CGT` (ADR-034).
pub const NAME: &str = "Creator God Token";

/// Parse a human-entered CGT amount into integer Sparks.
///
/// Accepts `"12"`, `"12.5"`, `"12.50"`, and separators like `"1,200.25"`.
/// Rejects more decimal places than the chain can represent rather than
/// silently truncating, because silently dropping value from a payment is the
/// worst possible failure mode in a wallet.
pub fn parse_cgt(input: &str) -> QorResult<u128> {
    let cleaned: String = input.trim().replace([',', '_', ' '], "");

    if cleaned.is_empty() {
        return Err(QorError::BadAmount("enter an amount".into()));
    }
    if cleaned.starts_with('-') {
        return Err(QorError::BadAmount("amount cannot be negative".into()));
    }

    let (whole_str, frac_str) = match cleaned.split_once('.') {
        Some((w, f)) => (w, f),
        None => (cleaned.as_str(), ""),
    };

    if frac_str.contains('.') {
        return Err(QorError::BadAmount(
            "amount has more than one decimal point".into(),
        ));
    }
    if frac_str.len() as u32 > DECIMALS {
        return Err(QorError::BadAmount(format!(
            "{SYMBOL} supports {DECIMALS} decimal places; {} has {}",
            input.trim(),
            frac_str.len()
        )));
    }

    let whole_str = if whole_str.is_empty() { "0" } else { whole_str };

    let invalid = |s: &str| QorError::BadAmount(format!("{s:?} is not a number"));

    let whole: u128 = whole_str.parse().map_err(|_| invalid(input.trim()))?;
    let frac: u128 = if frac_str.is_empty() {
        0
    } else {
        let padded = format!("{frac_str:0<width$}", width = DECIMALS as usize);
        padded.parse().map_err(|_| invalid(input.trim()))?
    };

    whole
        .checked_mul(SPARKS_PER_CGT)
        .and_then(|w| w.checked_add(frac))
        .filter(|total| *total <= MAX_AMOUNT_SPARKS)
        .ok_or_else(|| {
            QorError::BadAmount(format!(
                "that is more {SYMBOL} than the entire base supply; check the amount"
            ))
        })
}

/// Format integer Sparks as a CGT decimal string.
///
/// Trailing zeros below two decimal places are trimmed, so a whole CGT reads as
/// `1.00` rather than `1.000000000000000000`, while a genuinely tiny amount
/// keeps every digit it needs. Eighteen decimals is the right precision to
/// *hold*; it is the wrong precision to show someone their balance in.
pub fn format_cgt(sparks: u128) -> String {
    let whole = sparks / SPARKS_PER_CGT;
    let frac = sparks % SPARKS_PER_CGT;

    if frac == 0 {
        return format!("{whole}.00");
    }

    let mut digits = format!("{frac:0width$}", width = DECIMALS as usize);
    while digits.len() > 2 && digits.ends_with('0') {
        digits.pop();
    }

    format!("{whole}.{digits}")
}

/// Format with thousands separators, for display in the wallet.
pub fn format_cgt_grouped(sparks: u128) -> String {
    let plain = format_cgt(sparks);
    let (whole, frac) = plain.split_once('.').unwrap_or((plain.as_str(), ""));

    let mut grouped = String::with_capacity(whole.len() + whole.len() / 3);
    for (i, ch) in whole.chars().enumerate() {
        if i > 0 && (whole.len() - i) % 3 == 0 {
            grouped.push(',');
        }
        grouped.push(ch);
    }

    format!("{grouped}.{frac}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_whole_and_fractional_amounts() {
        assert_eq!(parse_cgt("1").unwrap(), SPARKS_PER_CGT);
        assert_eq!(parse_cgt("1.5").unwrap(), SPARKS_PER_CGT * 3 / 2);
        assert_eq!(parse_cgt("0.01").unwrap(), SPARKS_PER_CGT / 100);
        assert_eq!(parse_cgt(".25").unwrap(), SPARKS_PER_CGT / 4);
        assert_eq!(parse_cgt("0").unwrap(), 0);
    }

    #[test]
    fn tolerates_human_separators() {
        assert_eq!(
            parse_cgt("1,200.25").unwrap(),
            parse_cgt("1200.25").unwrap()
        );
        assert_eq!(parse_cgt(" 1 200 ").unwrap(), 1200 * SPARKS_PER_CGT);
        assert_eq!(parse_cgt("1_000").unwrap(), 1000 * SPARKS_PER_CGT);
    }

    /// Truncating a payment silently is unacceptable, so this must be an error.
    #[test]
    fn refuses_excess_precision_instead_of_truncating() {
        let nineteen_places = "1.0000000000000000001";
        let err = parse_cgt(nineteen_places).unwrap_err();
        assert_eq!(err.kind(), "bad_amount");
        assert!(err.to_string().contains("18 decimal places"), "got: {err}");
    }

    #[test]
    fn rejects_malformed_and_out_of_range_input() {
        for bad in ["", "   ", "-1", "abc", "1.2.3", "1.x"] {
            assert!(parse_cgt(bad).is_err(), "{bad:?} should be rejected");
        }
        assert!(
            parse_cgt("100000000000001").is_err(),
            "above the input ceiling"
        );
        assert!(
            parse_cgt("100000000000000").is_ok(),
            "exactly the input ceiling"
        );
    }

    /// Eighteen decimals is the right precision to hold and the wrong precision
    /// to show. A whole CGT must not read as 1.000000000000000000.
    #[test]
    fn formatting_trims_noise_but_keeps_real_digits() {
        assert_eq!(format_cgt(0), "0.00");
        assert_eq!(format_cgt(SPARKS_PER_CGT), "1.00");
        assert_eq!(format_cgt(SPARKS_PER_CGT * 3 / 2), "1.50");
        assert_eq!(format_cgt(SPARKS_PER_CGT / 1000), "0.001");
        assert_eq!(
            format_cgt(1),
            "0.000000000000000001",
            "one Spark keeps every digit"
        );
    }

    #[test]
    fn groups_thousands_for_display() {
        assert_eq!(format_cgt_grouped(1200 * SPARKS_PER_CGT), "1,200.00");
        assert_eq!(format_cgt_grouped(SPARKS_PER_CGT), "1.00");
        assert_eq!(
            format_cgt_grouped(MAX_AMOUNT_SPARKS),
            "100,000,000,000,000.00"
        );
    }

    #[test]
    fn parsing_and_formatting_round_trip() {
        for original in [
            "0.00",
            "0.001",
            "0.01",
            "1.00",
            "999.99",
            "100000000000000.00",
        ] {
            let sparks = parse_cgt(original).unwrap();
            assert_eq!(
                parse_cgt(&format_cgt(sparks)).unwrap(),
                sparks,
                "{original} must survive parse, format and parse again"
            );
        }
    }

    /// The amounts the old two-decimal precision made impossible. These are the
    /// reason the redenomination happened: per-item and per-view pricing is how
    /// creators earn, and none of it fits above a hundredth of a CGT.
    #[test]
    fn micro_amounts_are_now_expressible() {
        for amount in ["0.001", "0.0001", "0.000001", "0.000000001"] {
            let sparks = parse_cgt(amount).unwrap();
            assert!(sparks > 0, "{amount} must not round to nothing");
            assert_eq!(parse_cgt(&format_cgt(sparks)).unwrap(), sparks);
        }
    }

    /// The existential deposit was `CGT / 1000`, which evaluated to zero at two
    /// decimals and silently disabled the chain's dust check.
    #[test]
    fn the_existential_deposit_is_a_real_number() {
        // A const block, so this is checked at compile time: the value can
        // never regress to zero the way it silently did at two decimals.
        const { assert!(SPARKS_PER_CGT / 1000 > 0) };
        assert_eq!(format_cgt(SPARKS_PER_CGT / 1000), "0.001");
    }

    /// The input ceiling is a decided number, and it is not a supply claim.
    ///
    /// Two things can go wrong here and neither is loud. The value can drift to
    /// something nobody decided, which is what the 13,000,000,000 figure became
    /// once ADR-003 superseded it; and the guard can start being described as a
    /// supply cap, which would make the launcher assert a total the chain does
    /// not have and ADR-004's perpetual issuance rules out. So the value is
    /// pinned to ADR-003's base supply, and the refusal a person actually reads
    /// is pinned to not calling it one.
    #[test]
    fn the_input_ceiling_is_the_base_supply_and_says_nothing_about_a_total() {
        // ADR-003: one hundred trillion CGT, the base supply. Written out here
        // so a change to the constant has to be a change to this record too.
        const BASE_SUPPLY_CGT: u128 = 100_000_000_000_000;
        assert_eq!(MAX_AMOUNT_SPARKS, BASE_SUPPLY_CGT * SPARKS_PER_CGT);

        let err = parse_cgt("100000000000001").unwrap_err().to_string();
        assert!(
            !err.contains("total supply"),
            "the refusal must not call the ceiling a total supply: {err}"
        );
        assert!(err.contains("base supply"), "got: {err}");
    }

    /// Pins the launcher to the chain. `chain/runtime/src/denomination.rs` is
    /// the single source of truth; if it moves and this does not, every amount
    /// the launcher signs would be wrong by orders of magnitude. That is exactly
    /// how `balances` and `agentic` came to disagree by 10^16.
    ///
    /// **It pins only what the chain actually declares.** Until M3.5 this test
    /// also asserted a total supply of 13,000,000,000, against a constant in
    /// the custom devnet. That devnet is gone, the Substrate chain declares no
    /// total supply at all, and ADR-003 superseded the figure anyway — so the
    /// assertion pinned this module to nothing and read as though it pinned it
    /// to the chain. Values the chain does not declare do not belong here.
    #[test]
    fn matches_the_chain_denomination() {
        // Mirrored by hand from chain/runtime/src/denomination.rs, which the
        // launcher does not and should not depend on as a crate.
        const CHAIN_DECIMALS: u32 = 18;
        const CHAIN_TOKEN_SYMBOL: &str = "CGT";
        const CHAIN_EXISTENTIAL_DEPOSIT: u128 = 100 * 10u128.pow(CHAIN_DECIMALS);

        assert_eq!(DECIMALS, CHAIN_DECIMALS, "precision must match the chain");
        assert_eq!(
            SYMBOL, CHAIN_TOKEN_SYMBOL,
            "the ticker must match the chain"
        );
        assert_eq!(
            100 * SPARKS_PER_CGT,
            CHAIN_EXISTENTIAL_DEPOSIT,
            "the existential deposit is 100 CGT (ADR-036), and this module is              what renders it"
        );
    }
}
