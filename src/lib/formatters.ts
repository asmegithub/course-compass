export const formatDuration = (minutes: number): string => {
  if (!Number.isFinite(minutes)) {
    return '0m';
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const formatPrice = (price: number, currency: string = 'ETB'): string => {
  const safePrice = Number.isFinite(price) ? price : 0;
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(safePrice);
};
