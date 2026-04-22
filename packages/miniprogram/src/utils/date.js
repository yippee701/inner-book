export function parseTimestamp(value) {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') {
    return value > 1e12 ? value : value * 1000;
  }
  if (typeof value === 'string') {
    const numericValue = Number(value);
    if (!Number.isNaN(numericValue) && value.trim() !== '') {
      return numericValue > 1e12 ? numericValue : numericValue * 1000;
    }
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value?.getTime === 'function') {
    try {
      return value.getTime();
    } catch {
      return 0;
    }
  }
  if (typeof value?.toDate === 'function') {
    try {
      return value.toDate().getTime();
    } catch {
      return 0;
    }
  }
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  if (typeof value?._seconds === 'number') return value._seconds * 1000;
  return 0;
}

export function formatDateTime(value, locale = 'zh-CN') {
  const timestamp = parseTimestamp(value);
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString(locale, { hour12: false });
}
