import { describe, it, expect } from "vitest";
import { getRecyclingInfo } from "./recyclingService";

const timezone = "America/Los_Angeles";
const pad = (v: number) => String(v).padStart(2, "0");
const date = (y: number, m: number, d: number, h = 8) =>
  new Date(`${y}-${pad(m)}-${pad(d)}T${pad(h)}:00:00-08:00`);

describe("recyclingService", () => {
  describe("getRecyclingInfo", () => {
    // Reference: Nov 19, 2024 (Tuesday) WAS a recycling week
    // Nov 26, 2024 (Tuesday) was NOT a recycling week

    describe("Sunday logic", () => {
      it("should return this week recycling on Sunday when this Tuesday is recycling", () => {
        // Sunday, Nov 30, 2025 (2 days before Dec 2 recycling Tuesday)
        const testDate = date(2025, 11, 30);
        const result = getRecyclingInfo(testDate, timezone);

        expect(result.isRecyclingWeek).toBe(true);
        expect(result.message).toBe("This week is recycling pickup");
      });

      it("should return this week trash only on Sunday when this Tuesday is not recycling", () => {
        // Sunday, Nov 23, 2025 (2 days before Nov 25 non-recycling Tuesday)
        const testDate = date(2025, 11, 23);
        const result = getRecyclingInfo(testDate, timezone);

        expect(result.isRecyclingWeek).toBe(false);
        expect(result.message).toBe("This week is trash only");
      });
    });

    describe("Monday logic", () => {
      it("should return this week recycling on Monday when this Tuesday is recycling", () => {
        // Monday, Dec 1, 2025 (1 day before Dec 2 recycling Tuesday)
        const testDate = date(2025, 12, 1);
        const result = getRecyclingInfo(testDate, timezone);

        expect(result.isRecyclingWeek).toBe(true);
        expect(result.message).toBe("This week is recycling pickup");
      });

      it("should return this week trash only on Monday when this Tuesday is not recycling", () => {
        // Monday, Nov 24, 2025 (1 day before Nov 25 non-recycling Tuesday)
        const testDate = date(2025, 11, 24);
        const result = getRecyclingInfo(testDate, timezone);

        expect(result.isRecyclingWeek).toBe(false);
        expect(result.message).toBe("This week is trash only");
      });
    });

    describe("Tuesday before cutoff logic", () => {
      it("should return this week recycling on Tuesday morning when today is recycling", () => {
        // Tuesday, Dec 2, 2025 8:00 AM Pacific (recycling week)
        const testDate = date(2025, 12, 2, 8);
        const result = getRecyclingInfo(testDate, timezone);

        expect(result.isRecyclingWeek).toBe(true);
        expect(result.message).toBe("This week is recycling pickup");
      });

      it("should return this week trash only on Tuesday morning when today is not recycling", () => {
        // Tuesday, Nov 25, 2025 9:00 AM Pacific (non-recycling week)
        const testDate = date(2025, 11, 25, 9);
        const result = getRecyclingInfo(testDate, timezone);

        expect(result.isRecyclingWeek).toBe(false);
        expect(result.message).toBe("This week is trash only");
      });
    });

    describe("Tuesday after noon logic", () => {
      it("should return next week trash only on Tuesday afternoon of a recycling week", () => {
        // Tuesday, Dec 2, 2025 1:00 PM Pacific (recycling week)
        const testDate = date(2025, 12, 2, 13);
        const result = getRecyclingInfo(testDate, timezone);

        expect(result.isRecyclingWeek).toBe(false);
        expect(result.message).toBe("Next week is trash only");
      });

      it("should return next week recycling on Tuesday afternoon of a non-recycling week", () => {
        // Tuesday, Nov 25, 2025 2:00 PM Pacific (TODAY is NOT recycling, but after noon we look at NEXT week which is Dec 3 = recycling)// Tuesday, Nov 25, 2025 9:00 AM Pacific (non-recycling week)
        const testDate = date(2025, 11, 25, 14);
        const result = getRecyclingInfo(testDate, timezone);

        expect(result.isRecyclingWeek).toBe(true);
        expect(result.message).toBe("Next week is recycling pickup");
      });
    });

    describe("Wednesday logic", () => {
      it("should return next week trash only on Wednesday when next Tuesday is not recycling", () => {
        // Wednesday, Dec 3, 2025 (next Tuesday is Dec 9 = NOT recycling)
        const testDate = date(2025, 12, 3);
        const result = getRecyclingInfo(testDate, timezone);

        expect(result.isRecyclingWeek).toBe(false);
        expect(result.message).toBe("Next week is trash only");
      });

      it("should return next week recycling on Wednesday when next Tuesday is recycling", () => {
        // Wednesday, Nov 26, 2025 (next Tuesday is Dec 2 = recycling)
        const testDate = date(2025, 11, 26);
        const result = getRecyclingInfo(testDate, timezone);

        expect(result.isRecyclingWeek).toBe(true);
        expect(result.message).toBe("Next week is recycling pickup");
      });
    });

    describe("Saturday logic", () => {
      it("should return next week trash only on Saturday when next Tuesday is not recycling", () => {
        // Saturday, Dec 6, 2025 (next Tuesday is Dec 9 = NOT recycling)
        const testDate = date(2025, 12, 6);
        const result = getRecyclingInfo(testDate, timezone);

        expect(result.isRecyclingWeek).toBe(false);
        expect(result.message).toBe("Next week is trash only");
      });

      it("should return next week recycling on Saturday when next Tuesday is recycling", () => {
        // Saturday, Nov 29, 2025 (next Tuesday is Dec 2 = recycling)
        const testDate = date(2025, 11, 29);
        const result = getRecyclingInfo(testDate, timezone);

        expect(result.isRecyclingWeek).toBe(true);
        expect(result.message).toBe("Next week is recycling pickup");
      });
    });

    describe("Alternating weeks pattern", () => {
      it("should alternate correctly over multiple weeks", () => {
        const dates = [
          {
            date: "2025-11-18T10:00:00-08:00",
            expected: true,
            week: "November 18 (recycling ref week)",
          },
          {
            date: "2025-11-25T10:00:00-08:00",
            expected: false,
            week: "November 25",
          },
          {
            date: "2025-12-02T10:00:00-08:00",
            expected: true,
            week: "December 2",
          },
          {
            date: "2025-12-09T10:00:00-08:00",
            expected: false,
            week: "December 9",
          },
          {
            date: "2025-12-16T10:00:00-08:00",
            expected: true,
            week: "December 16",
          },
          {
            date: "2025-12-23T10:00:00-08:00",
            expected: false,
            week: "December 23",
          },
          {
            date: "2025-12-30T10:00:00-08:00",
            expected: true,
            week: "December 30",
          },
        ];

        dates.forEach(({ date, expected }) => {
          const testDate = new Date(date);
          const result = getRecyclingInfo(testDate, timezone);
          expect(result.isRecyclingWeek).toBe(expected);
        });
      });
    });

    describe("Edge cases", () => {
      it("should handle DST transition (spring forward)", () => {
        // Sunday, March 9, 2025 at 2:00 AM PDT (DST starts)
        const testDate = new Date("2025-03-09T10:00:00-07:00");
        const result = getRecyclingInfo(testDate, timezone);

        // Should still return a valid result
        expect(result).toHaveProperty("isRecyclingWeek");
        expect(result).toHaveProperty("message");
      });

      it("should handle DST transition (fall back)", () => {
        // Sunday, November 2, 2025 at 2:00 AM PST (DST ends)
        const testDate = new Date("2025-11-02T10:00:00-08:00");
        const result = getRecyclingInfo(testDate, timezone);

        // Should still return a valid result
        expect(result).toHaveProperty("isRecyclingWeek");
        expect(result).toHaveProperty("message");
      });

      it("should handle year boundary correctly", () => {
        // Tuesday, Dec 31, 2024 10:00 AM Pacific (recycling week)
        const testDate = new Date("2024-12-31T10:00:00-08:00");
        const result = getRecyclingInfo(testDate, timezone);

        expect(result.isRecyclingWeek).toBe(true);
        expect(result.message).toBe("This week is recycling pickup");
      });
    });
  });
});
