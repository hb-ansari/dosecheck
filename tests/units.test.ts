import { describe, it, expect } from "vitest";
import { normalizeToUnit, isThousandFoldMismatch, exceedsLimit } from "@/lib/units";

describe("normalizeToUnit", () => {
  it("returns the same value when units are identical", () => {
    expect(normalizeToUnit(500, "mg", "mg")).toBe(500);
    expect(normalizeToUnit(100, "mcg", "mcg")).toBe(100);
    expect(normalizeToUnit(1, "g", "g")).toBe(1);
    expect(normalizeToUnit(5000, "units", "units")).toBe(5000);
  });

  it("converts mg to mcg correctly", () => {
    expect(normalizeToUnit(1, "mg", "mcg")).toBe(1000);
    expect(normalizeToUnit(0.5, "mg", "mcg")).toBe(500);
  });

  it("converts mcg to mg correctly", () => {
    expect(normalizeToUnit(1000, "mcg", "mg")).toBe(1);
    expect(normalizeToUnit(500, "mcg", "mg")).toBe(0.5);
  });

  it("converts g to mg correctly", () => {
    expect(normalizeToUnit(1, "g", "mg")).toBe(1000);
    expect(normalizeToUnit(0.5, "g", "mg")).toBe(500);
  });

  it("converts mg to g correctly", () => {
    expect(normalizeToUnit(1000, "mg", "g")).toBe(1);
    expect(normalizeToUnit(500, "mg", "g")).toBe(0.5);
  });

  it("converts g to mcg correctly", () => {
    expect(normalizeToUnit(1, "g", "mcg")).toBe(1_000_000);
  });

  it("converts mcg to g correctly", () => {
    expect(normalizeToUnit(1_000_000, "mcg", "g")).toBe(1);
  });

  it("throws when trying to convert units to mg", () => {
    expect(() => normalizeToUnit(1000, "units", "mg")).toThrow();
  });

  it("throws when trying to convert mg to units", () => {
    expect(() => normalizeToUnit(500, "mg", "units")).toThrow();
  });
});

describe("isThousandFoldMismatch", () => {
  it("detects mcg/mg mismatch", () => {
    expect(isThousandFoldMismatch("mcg", "mg")).toBe(true);
    expect(isThousandFoldMismatch("mg", "mcg")).toBe(true);
  });

  it("detects mg/g mismatch", () => {
    expect(isThousandFoldMismatch("mg", "g")).toBe(true);
    expect(isThousandFoldMismatch("g", "mg")).toBe(true);
  });

  it("returns false for same unit", () => {
    expect(isThousandFoldMismatch("mg", "mg")).toBe(false);
  });

  it("returns false for mcg/g (not a single 1000× step)", () => {
    expect(isThousandFoldMismatch("mcg", "g")).toBe(false);
  });

  it("returns false for units", () => {
    expect(isThousandFoldMismatch("units", "mg")).toBe(false);
  });
});

describe("exceedsLimit", () => {
  it("returns true when clearly above limit", () => {
    expect(exceedsLimit(1001, 1000)).toBe(true);
  });

  it("returns false when exactly at limit (floating point safe)", () => {
    expect(exceedsLimit(1000, 1000)).toBe(false);
  });

  it("returns false when below limit", () => {
    expect(exceedsLimit(999, 1000)).toBe(false);
  });

  it("handles floating-point near-equality correctly", () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS — should not flag as exceeding 0.3
    expect(exceedsLimit(0.1 + 0.2, 0.3)).toBe(false);
  });
});
