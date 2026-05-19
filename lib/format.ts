export function formatCurrency(value: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2
  }).format(value);
}

export function percentage(current: number, target: number) {
  if (target <= 0) return 0;
  return Math.round((current / target) * 100);
}
