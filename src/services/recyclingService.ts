export interface RecyclingInfo {
  isRecyclingWeek: boolean;
  message: string;
}

/**
 * Gets the current date/time in the specified timezone and extracts components
 */
function getDateInTimezone(date: Date, timezone: string) {
  // Format the date in the target timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const getValue = (type: string) =>
    parts.find((p) => p.type === type)?.value || "0";

  const year = parseInt(getValue("year"));
  const month = parseInt(getValue("month")) - 1; // JS months are 0-indexed
  const day = parseInt(getValue("day"));
  const hour = parseInt(getValue("hour"));

  // Create a date object representing midnight on this day in UTC
  // (we'll use this for week calculations)
  const localMidnight = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

  return {
    year,
    month,
    day,
    hour,
    dayOfWeek: localMidnight.getUTCDay(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    midnightUTC: localMidnight,
  };
}

export interface RecyclingConfig {
  /** The day of the week recycling happens (0 = Sunday, 1 = Monday, ..., 6 = Saturday) */
  recyclingDayOfWeek?: number;
  /** The hour cutoff (0-23) after which we look at next week instead of this week */
  cutoffHour?: number;
  /** Reference date that was a recycling week (format: YYYY-MM-DD) */
  referenceDate?: string;
  /** Whether the reference date was a recycling week */
  referenceWasRecycling?: boolean;
}

/**
 * Determines if it's a recycling week based on the reference date.
 *
 * Reference dates:
 * - November 18, 2025 (Tuesday) WAS a recycling week
 * - November 25, 2025 (Tuesday) was NOT a recycling week
 *
 * Recycling occurs every other week on a specified day.
 *
 * Logic:
 * - After cutoff hour on recycling day, we start looking at next week
 * - Before cutoff hour on recycling day (or other days), we look at the upcoming recycling day
 *
 * @param now - The current date/time (defaults to now)
 * @param timezone - The timezone to use for calculations (e.g., 'America/Los_Angeles')
 * @param config - Configuration for recycling schedule
 */
export function getRecyclingInfo(
  now: Date = new Date(),
  timezone: string = "America/Los_Angeles",
  config: RecyclingConfig = {}
): RecyclingInfo {
  const current = getDateInTimezone(now, timezone);

  // Configuration with defaults
  const recyclingDayOfWeek = config.recyclingDayOfWeek ?? 2; // Default: Tuesday
  const cutoffHour = config.cutoffHour ?? 12; // Default: 12pm
  const referenceDateStr = config.referenceDate ?? "2025-11-18"; // Default: Nov 18, 2025
  const referenceWasRecycling = config.referenceWasRecycling ?? true;

  // Parse reference date (assumes format YYYY-MM-DD)
  const [refYear, refMonth, refDay] = referenceDateStr.split("-").map(Number);
  const referenceDate = new Date(Date.UTC(refYear, refMonth - 1, refDay, 0, 0, 0, 0));

  // Determine which recycling day we care about
  let targetDayUTC: Date;
  let isThisWeek: boolean;

  const isRecyclingDay = current.dayOfWeek === recyclingDayOfWeek;
  const isAfterCutoff = current.hour >= cutoffHour;

  if (isRecyclingDay && isAfterCutoff) {
    // After cutoff on recycling day - look at next week's recycling day
    targetDayUTC = new Date(current.midnightUTC);
    targetDayUTC.setUTCDate(current.midnightUTC.getUTCDate() + 7);
    isThisWeek = false;
  } else {
    // Any other time - look at the upcoming recycling day (this week or next)
    const daysUntilRecyclingDay = (recyclingDayOfWeek - current.dayOfWeek + 7) % 7;

    if (daysUntilRecyclingDay === 0) {
      // It's recycling day before cutoff
      targetDayUTC = new Date(current.midnightUTC);
      isThisWeek = true;
    } else {
      // Other days of the week
      targetDayUTC = new Date(current.midnightUTC);
      targetDayUTC.setUTCDate(
        current.midnightUTC.getUTCDate() + daysUntilRecyclingDay
      );
      // It's "this week" if recycling day is in the next 0-2 days
      isThisWeek = daysUntilRecyclingDay <= 2;
    }
  }

  // Calculate weeks between reference and target recycling day
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksDifference = Math.round(
    (targetDayUTC.getTime() - referenceDate.getTime()) / msPerWeek
  );

  // Determine if target day is a recycling week
  // If reference was recycling and even weeks passed, target is also recycling
  // If odd weeks passed, it alternates
  const isRecycling = referenceWasRecycling
    ? weeksDifference % 2 === 0
    : weeksDifference % 2 !== 0;

  // Generate helpful message
  const message = isRecycling
    ? isThisWeek
      ? "This week is recycling pickup"
      : "Next week is recycling pickup"
    : isThisWeek
    ? "This week is trash only"
    : "Next week is trash only";

  return {
    isRecyclingWeek: isRecycling,
    message,
  };
}
