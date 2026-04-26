export function formatAmount(amount: number, unit: string): string {
  if (amount === 0) return unit; // "약간", "적당량"

  // Whole numbers
  if (amount === Math.floor(amount)) {
    return `${amount}${unit}`;
  }

  // Common fractions
  const fractions: Record<string, string> = {
    "0.25": "1/4",
    "0.33": "1/3",
    "0.5": "1/2",
    "0.67": "2/3",
    "0.75": "3/4",
  };

  const whole = Math.floor(amount);
  const decimal = Math.round((amount - whole) * 100) / 100;
  const decStr = decimal.toFixed(2).replace(/0$/, "").replace(/0$/, "");

  // Check fraction match
  for (const [key, frac] of Object.entries(fractions)) {
    if (Math.abs(decimal - parseFloat(key)) < 0.05) {
      if (whole === 0) return `${frac}${unit}`;
      return `${whole}+${frac}${unit}`;
    }
  }

  // Fallback to decimal
  const rounded = Math.round(amount * 10) / 10;
  return `${rounded}${unit}`;
}
