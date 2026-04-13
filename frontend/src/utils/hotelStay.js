const HOTEL_CHECK_IN_HOUR = 14;

function padDatePart(value) {
  return String(value).padStart(2, '0');
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getRequestedStayNights(checkInDate, checkOutDate) {
  if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
    return 1;
  }

  const start = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
  const end = new Date(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate());
  const diffDays = Math.round((end - start) / 86400000);
  return diffDays > 0 ? diffDays : 1;
}

export function parseDateInputValue(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateInputValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

export function getNextHotelCheckInDate(referenceTime = new Date()) {
  const nextCheckIn = new Date(referenceTime);
  nextCheckIn.setHours(HOTEL_CHECK_IN_HOUR, 0, 0, 0);

  if (referenceTime.getTime() >= nextCheckIn.getTime()) {
    nextCheckIn.setDate(nextCheckIn.getDate() + 1);
  }

  return nextCheckIn;
}

export function getDefaultHotelStay(referenceTime = new Date(), minNights = 1) {
  const checkInDate = getNextHotelCheckInDate(referenceTime);
  const checkOutDate = addDays(checkInDate, Math.max(1, minNights));

  return {
    checkIn: formatDateInputValue(checkInDate),
    checkOut: formatDateInputValue(checkOutDate),
  };
}

export function normalizeHotelStayDates({ checkIn, checkOut }, referenceTime = new Date()) {
  const fallbackStay = getDefaultHotelStay(referenceTime);
  const parsedCheckIn = parseDateInputValue(checkIn);
  const parsedCheckOut = parseDateInputValue(checkOut);
  const requestedNights = getRequestedStayNights(parsedCheckIn, parsedCheckOut);
  const earliestCheckInDate = parseDateInputValue(fallbackStay.checkIn) || getNextHotelCheckInDate(referenceTime);

  let resolvedCheckIn = parsedCheckIn || earliestCheckInDate;
  if (resolvedCheckIn.getTime() < earliestCheckInDate.getTime()) {
    resolvedCheckIn = earliestCheckInDate;
  }

  const checkInChanged = !parsedCheckIn || resolvedCheckIn.getTime() !== parsedCheckIn.getTime();
  let resolvedCheckOut = parsedCheckOut;

  if (!resolvedCheckOut || checkInChanged || resolvedCheckOut.getTime() <= resolvedCheckIn.getTime()) {
    resolvedCheckOut = addDays(resolvedCheckIn, requestedNights);
  }

  return {
    checkIn: formatDateInputValue(resolvedCheckIn),
    checkOut: formatDateInputValue(resolvedCheckOut),
  };
}

export function getEarliestHotelCheckInDateValue(referenceTime = new Date()) {
  return getDefaultHotelStay(referenceTime).checkIn;
}

export function addDaysToDateInputValue(dateValue, days = 1) {
  const parsed = parseDateInputValue(dateValue);
  if (!parsed) {
    return getDefaultHotelStay(new Date(), Math.max(1, days)).checkOut;
  }

  return formatDateInputValue(addDays(parsed, Math.max(1, days)));
}
