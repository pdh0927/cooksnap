export function formatAmount(amount: number, unit: string): string {
  if (amount === 0) return unit || "적당량"; // "약간", "적당량" — fallback if unit is also empty

  // Whole numbers
  if (amount === Math.floor(amount)) {
    return `${amount}${unit}`;
  }

  // Common fractions — use numeric tuples [numerator, denominator, displayStr]
  // to avoid floating-point string matching issues
  const fractions: Array<[number, string]> = [
    [1 / 4, "1/4"],
    [1 / 3, "1/3"],
    [1 / 2, "1/2"],
    [2 / 3, "2/3"],
    [3 / 4, "3/4"],
  ];

  const whole = Math.floor(amount);
  const decimal = amount - whole;

  // Check fraction match — tolerance handles floating-point imprecision
  for (const [fVal, fStr] of fractions) {
    if (Math.abs(decimal - fVal) < 0.02) {
      if (whole === 0) return `${fStr}${unit}`;
      return `${whole}+${fStr}${unit}`;
    }
  }

  // Fallback to decimal
  const rounded = Math.round(amount * 10) / 10;
  return `${rounded}${unit}`;
}
