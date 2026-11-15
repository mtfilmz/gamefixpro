export function costPaymentAmount(repair: string, component: string, diagnostic: string, manual: string | null = null): string {
  if (manual !== null) return manual;
  const cents = (value: string) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number * 100) : 0;
  };
  const total = Math.max(0, cents(repair) + cents(component) - cents(diagnostic));
  return total > 0 ? (total / 100).toFixed(2) : "";
}