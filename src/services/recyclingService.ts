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

/**
 * Determines if it's a recycling week based on the reference date.
 *
 * Reference dates:
 * - November 19, 2024 (Tuesday) WAS a recycling week
 * - November 26, 2024 (Tuesday) was NOT a recycling week
 *
 * Recycling occurs every other week on Tuesday mornings.
 *
 * Logic:
 * - After 12pm on Tuesday, we start looking at next week
 * - Before 12pm on Tuesday (or Mon-Sun), we look at the upcoming Tuesday
 *
 * @param now - The current date/time (defaults to now)
 * @param timezone - The timezone to use for calculations (e.g., 'America/Los_Angeles')
 */
export function getRecyclingInfo(
  now: Date = new Date(),
  timezone: string = "America/Los_Angeles"
): RecyclingInfo {
  const current = getDateInTimezone(now, timezone);

  // Reference: Nov 18, 2025 (Tuesday) WAS a recycling week
  const referenceDate = new Date(Date.UTC(2025, 10, 18, 0, 0, 0, 0)); // Nov = month 10
  const referenceWasRecycling = true;

  // Determine which Tuesday we care about
  let targetTuesdayUTC: Date;
  let isThisWeek: boolean;

  const isTuesday = current.dayOfWeek === 2;
  const isAfterNoon = current.hour >= 12;

  if (isTuesday && isAfterNoon) {
    // Tuesday after noon - look at next week's Tuesday
    targetTuesdayUTC = new Date(current.midnightUTC);
    targetTuesdayUTC.setUTCDate(current.midnightUTC.getUTCDate() + 7);
    isThisWeek = false;
  } else {
    // Any other time - look at the upcoming Tuesday (this week or next)
    const daysUntilTuesday = (2 - current.dayOfWeek + 7) % 7;

    if (daysUntilTuesday === 0) {
      // It's Tuesday before noon
      targetTuesdayUTC = new Date(current.midnightUTC);
      isThisWeek = true;
    } else {
      // Sunday, Monday, or Wednesday-Saturday
      targetTuesdayUTC = new Date(current.midnightUTC);
      targetTuesdayUTC.setUTCDate(
        current.midnightUTC.getUTCDate() + daysUntilTuesday
      );
      // It's "this week" if Tuesday is in the next 0-2 days
      isThisWeek = daysUntilTuesday <= 2;
    }
  }

  // Calculate weeks between reference and target Tuesday
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksDifference = Math.round(
    (targetTuesdayUTC.getTime() - referenceDate.getTime()) / msPerWeek
  );

  // Determine if target Tuesday is a recycling week
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
