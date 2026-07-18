export function formatPKR(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return "Rs 0";
  const hasFraction = Math.abs(n % 1) > 0.001;
  return `Rs ${n.toLocaleString("en-PK", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  })}`;
}
