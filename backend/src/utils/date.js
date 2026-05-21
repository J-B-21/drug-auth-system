// Utility helpers for date formatting used by verification responses.
// `toDateOnly` normalizes different date input forms to `YYYY-MM-DD`.
// `isExpiredDate` compares an expiry against a provided 'now' (useful for tests).
const pad = (value) => String(value).padStart(2, '0');

const toDateOnly = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  if (value instanceof Date) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }

  return String(value).slice(0, 10);
};

const isExpiredDate = (expiryDate, now = new Date()) => {
  const expiry = toDateOnly(expiryDate);

  if (!expiry) {
    return false;
  }

  return expiry < toDateOnly(now);
};

module.exports = {
  isExpiredDate,
  toDateOnly,
};
