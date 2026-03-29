/**
 * Format a number as Indian Rupees with Indian numbering (lakhs/crores).
 * e.g. 123456 → "₹1,23,456"
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "₹0";
  const num = Math.abs(Math.round(amount));
  const sign = amount < 0 ? "-" : "";

  // Indian numbering: last 3 digits, then groups of 2
  const str = num.toString();
  if (str.length <= 3) return `${sign}₹${str}`;

  const last3 = str.slice(-3);
  const rest = str.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${sign}₹${grouped},${last3}`;
}

/**
 * Format a number as crores/lakhs shorthand.
 * ≥1 Cr  → "₹1.23 Cr"
 * ≥1 L   → "₹45.6 L"
 * else   → formatINR
 */
export function formatCrore(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "₹0";
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs >= 10_000_000) {
    return `${sign}₹${(abs / 10_000_000).toFixed(2)} Cr`;
  }
  if (abs >= 100_000) {
    return `${sign}₹${(abs / 100_000).toFixed(1)} L`;
  }
  return formatINR(amount);
}

/**
 * Format a decimal or percentage value.
 * e.g. 12.4 → "12.4%"
 */
export function formatPercent(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return "0%";
  return `${value.toFixed(1)}%`;
}

/**
 * Describe years-until-fire relative to current age.
 * e.g. formatAge(48, 30) → "in 18 years (age 48)"
 */
export function formatAge(fireAge: number, currentAge: number): string {
  const years = fireAge - currentAge;
  if (years <= 0) return `at age ${fireAge} (now!)`;
  return `in ${years} year${years === 1 ? "" : "s"} (age ${fireAge})`;
}
