import { parseDateValue } from '../utils/dateFormat';

function toCurrencyNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveBookingAmount(...values) {
  for (const value of values) {
    const amount = toCurrencyNumber(value);
    if (amount > 0) {
      return amount;
    }
  }
  return 0;
}

export function calculateStayNights(checkIn, checkOut) {
  const start = parseDateValue(checkIn);
  const end = parseDateValue(checkOut);

  if (!start || !end || end <= start) {
    return 0;
  }

  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diffDays = Math.round((endDate - startDate) / 86400000);

  return diffDays > 0 ? diffDays : 1;
}

export function calculateBookingSubtotal(booking) {
  if (!booking) return 0;
  return resolveBookingAmount(
    booking?.totalPrice,
    booking?.subtotalAmount,
    booking?.baseAmount,
    booking?.finalAmount,
  );
}

export function calculateBookingDiscountAmount(booking) {
  if (!booking) return 0;
  return resolveBookingAmount(
    booking?.discountAmount,
    booking?.couponDiscountAmount,
    booking?.discountValue,
  );
}

export function calculateBookingDisplayTotal(booking) {
  if (!booking) return 0;
  return resolveBookingAmount(
    booking?.finalAmount,
    booking?.payableAmount,
    booking?.totalAfterDiscount,
    booking?.totalPrice,
  );
}
