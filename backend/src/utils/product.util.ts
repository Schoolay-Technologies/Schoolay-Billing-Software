export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateGstAmount(
  unitPrice: number,
  gstPercentage: number
): number {
  return roundCurrency(
    (unitPrice * gstPercentage) / 100
  );
}

export function calculateSellingPrice(
  unitPrice: number,
  gstPercentage: number
): number {
  const gstAmount = calculateGstAmount(
    unitPrice,
    gstPercentage
  );

  return roundCurrency(unitPrice + gstAmount);
}

export function cleanCodePart(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
}