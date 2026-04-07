function createDateFromArray(dateValue) {
  const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue;
  return new Date(year, (month || 1) - 1, day || 1, hour, minute, second);
}

export function parseDateValue(dateValue) {
  if (!dateValue) return null;

  const parsed = Array.isArray(dateValue)
    ? createDateFromArray(dateValue)
    : new Date(dateValue);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(dateValue, fallback = 'Chưa cập nhật', locale = 'vi-VN') {
  const parsed = parseDateValue(dateValue);
  if (!parsed) return fallback;

  return parsed.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateValue, fallback = 'Chưa cập nhật', locale = 'vi-VN') {
  const parsed = parseDateValue(dateValue);
  if (!parsed) return fallback;

  return parsed.toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDateValue(dateValue, locale = 'vi-VN') {
  const parsed = parseDateValue(dateValue);
  return parsed ? parsed.toLocaleDateString(locale) : '';
}

export function getRemainingSeconds(dateValue, referenceTime = Date.now()) {
  const parsed = parseDateValue(dateValue);
  if (!parsed) return null;
  return Math.max(0, Math.ceil((parsed.getTime() - referenceTime) / 1000));
}

export function formatCountdown(totalSeconds, fallback = 'Chưa cập nhật') {
  if (totalSeconds == null) return fallback;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
