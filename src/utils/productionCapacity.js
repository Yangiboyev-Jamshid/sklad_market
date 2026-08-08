export function calcCapacityUtilization(annualCapacity, actualAnnualOutput) {
  const capacity = Number(annualCapacity);
  const actual = Number(actualAnnualOutput);
  if (!capacity || capacity <= 0 || !Number.isFinite(actual)) return null;
  return Math.round((actual / capacity) * 1000) / 10;
}
