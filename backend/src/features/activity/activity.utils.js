function toUtcDateParts(date) {
  const value = date instanceof Date ? date : new Date(date);

  return {
    year: value.getUTCFullYear(),
    month: value.getUTCMonth(),
    day: value.getUTCDate()
  };
}

export function isSameDay(date1, date2) {
  if (!date1 || !date2) {
    return false;
  }

  const left = toUtcDateParts(date1);
  const right = toUtcDateParts(date2);

  return left.year === right.year && left.month === right.month && left.day === right.day;
}

export function isYesterday(date, referenceDate = new Date()) {
  if (!date) {
    return false;
  }

  const value = date instanceof Date ? date : new Date(date);
  const today = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const currentUtcDay = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const previousUtcDay = currentUtcDay - 24 * 60 * 60 * 1000;

  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()) === previousUtcDay;
}

function getLatestCheckInEntry(checkInHistory = []) {
  if (!Array.isArray(checkInHistory) || checkInHistory.length === 0) {
    return null;
  }

  return checkInHistory[checkInHistory.length - 1] ?? null;
}

export function calculateNextStreakCount({ streakCount = 0, checkInHistory = [] }, status, checkedAt = new Date()) {
  const normalizedStatus = String(status ?? "").trim().toLowerCase();

  if (normalizedStatus === "not_done") {
    return 0;
  }

  const latestEntry = getLatestCheckInEntry(checkInHistory);
  if (!latestEntry || !latestEntry.date) {
    return 1;
  }

  if (latestEntry.status !== "done") {
    return 1;
  }

  if (isYesterday(latestEntry.date, checkedAt) && !isSameDay(latestEntry.date, checkedAt)) {
    return Number(streakCount || 0) + 1;
  }

  return 1;
}
