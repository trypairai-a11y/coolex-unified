export function formatBtuh(btuh: number): string {
  if (btuh >= 1000000) return `${(btuh / 1000000).toFixed(2)} MBtu/h`;
  if (btuh >= 1000) return `${(btuh / 1000).toFixed(0)} MBtu/h`;
  return `${btuh.toLocaleString()} Btu/h`;
}

export function btuhToTons(btuh: number): number {
  return Math.round((btuh / 12000) * 100) / 100;
}

export function tonsToKW(tons: number): number {
  return Math.round(tons * 3.517 * 10) / 10;
}

export function formatCapacity(btuh: number): string {
  const tons = btuhToTons(btuh);
  return `${tons} Tons (${(btuh / 1000).toFixed(0)}k Btu/h)`;
}
