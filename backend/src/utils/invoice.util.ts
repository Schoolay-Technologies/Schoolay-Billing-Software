export function roundCurrency(
  value: number
): number {
  return (
    Math.round(
      (value + Number.EPSILON) * 100
    ) / 100
  );
}

export function getFinancialYear(
  date = new Date()
): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }

  return `${year - 1}-${String(year).slice(-2)}`;
}

export function calculateRoundOff(
  total: number
): {
  roundedTotal: number;
  roundOff: number;
} {
  const roundedTotal = Math.round(total);

  return {
    roundedTotal,
    roundOff: roundCurrency(
      roundedTotal - total
    )
  };
}