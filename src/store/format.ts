// Small date and money helpers shared by every page.

const eur2 = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const eur0 = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** €1,188.00 */
export const formatEur = (value: number) => eur2.format(value);
/** €99 or €99.50 */
export const formatEurShort = (value: number) => eur0.format(value);

const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

/** Nov 21 */
export const formatShortDate = (iso: string) =>
  parse(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** Nov 3, 2026 */
export const formatLongDate = (iso: string) =>
  parse(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

export const daysBetween = (fromIso: string, toIso: string) =>
  Math.round((parse(toIso).getTime() - parse(fromIso).getTime()) / 86_400_000);

export const addMonths = (iso: string, months: number) => {
  const date = parse(iso);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
};

/** "1 seat" / "2 seats" */
export const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;
