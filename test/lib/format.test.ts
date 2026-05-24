import { describe, expect, it } from "vitest";
import { formatCurrency, percentage } from "@/lib/format";

describe("formatCurrency", () => {
  it("formats whole GBP values without unnecessary pennies", () => {
    expect(formatCurrency(1250)).toBe("£1,250");
  });

  it("preserves pennies for fractional values", () => {
    expect(formatCurrency(1250.5)).toBe("£1,250.50");
  });
});

describe("percentage", () => {
  it("rounds progress to the nearest percentage point", () => {
    expect(percentage(1, 3)).toBe(33);
  });

  it("returns zero when there is no positive target", () => {
    expect(percentage(10, 0)).toBe(0);
    expect(percentage(10, -4)).toBe(0);
  });
});
