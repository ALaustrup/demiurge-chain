/**
 * The mark an asset carries until it has a preview (QFX layer two).
 *
 * Sixty-four cells, one per hex digit of the fingerprint, mirrored left to
 * right: deterministic, so the same asset always draws the same mark, derived
 * from the root the chain holds rather than from anything a view invents, and
 * symmetric, because a symmetric mark is easier to tell from another at a glance
 * than noise is.
 *
 * It lives on its own so the card, the close-up and the listing form draw the
 * same mark from the same code. A second implementation would be a second
 * identity for the same asset.
 *
 * It is decoration: the name and the reference beside it say everything it says,
 * so it is hidden from assistive technology rather than described twice.
 */

interface Props {
  /** The content reference's root, hex, as the chain holds it. */
  root: string;
  /** The larger size, for a close-up. */
  large?: boolean;
  className?: string;
}

function cells(root: string): { on: boolean; strong: boolean }[] {
  const marks: { on: boolean; strong: boolean }[] = [];
  for (let row = 0; row < 8; row++) {
    const half: { on: boolean; strong: boolean }[] = [];
    for (let column = 0; column < 4; column++) {
      const digit = parseInt(root[row * 4 + column] ?? '0', 16);
      half.push({ on: digit >= 6, strong: digit >= 12 });
    }
    marks.push(...half, ...[...half].reverse());
  }
  return marks;
}

export function Sigil({ root, large = false, className = '' }: Props) {
  return (
    <div
      className={`qfx-sigil ${large ? 'qfx-sigil-large' : ''} ${className}`}
      aria-hidden="true"
      data-sigil
    >
      {cells(root).map((cell, i) => (
        <span
          key={i}
          className={`qfx-sigil-cell ${cell.on ? 'is-on' : ''} ${cell.strong ? 'is-strong' : ''}`}
        />
      ))}
    </div>
  );
}
