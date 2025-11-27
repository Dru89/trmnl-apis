/**
 * Determines if it's a recycling week based on the reference date.
 *
 * Reference: The week containing Tuesday, Nov 19, 2024 was NOT a recycling week.
 * Recycling occurs every other week on Tuesday.
 *
 * Logic:
 * - If today is Monday or Tuesday, check if THIS week's Tuesday is a pickup
 * - If today is Wed-Sunday, check if NEXT week's Tuesday is a pickup
 */
export function isRecyclingWeek(): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Reference: Nov 19, 2024 (Tuesday) was NOT a recycling week
  const referenceDate = new Date('2024-11-19');
  const referenceWasRecycling = false;

  // Get the upcoming Tuesday we care about
  let targetTuesday: Date;

  if (dayOfWeek === 1 || dayOfWeek === 2) {
    // Monday or Tuesday - check this week's Tuesday
    const daysUntilTuesday = 2 - dayOfWeek;
    targetTuesday = new Date(now);
    targetTuesday.setDate(now.getDate() + daysUntilTuesday);
  } else {
    // Wed-Sunday - check next week's Tuesday
    const daysUntilNextTuesday = dayOfWeek === 0 ? 2 : (9 - dayOfWeek);
    targetTuesday = new Date(now);
    targetTuesday.setDate(now.getDate() + daysUntilNextTuesday);
  }

  // Calculate weeks between reference and target
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksDifference = Math.floor(
    (targetTuesday.getTime() - referenceDate.getTime()) / msPerWeek
  );

  // If the reference was NOT recycling and an even number of weeks have passed,
  // target is also NOT recycling (same as reference)
  // If odd number of weeks, target IS recycling (opposite of reference)
  const isRecycling = referenceWasRecycling
    ? weeksDifference % 2 === 0
    : weeksDifference % 2 !== 0;

  return isRecycling;
}
