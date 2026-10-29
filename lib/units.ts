import type { DoseUnit } from "@/lib/schema";

/**
 * Normalize a dose value to a target unit.
 *
 * Supported conversions within the mass scale: g <-> mg <-> mcg
 * "units" is a dimensionless count and only converts to itself.
 *
 * @throws {Error} if either unit is unknown or conversion is between incompatible types
 */
export function normalizeToUnit(
  value: number,
  fromUnit: DoseUnit,
  toUnit: DoseUnit
): number {
  if (fromUnit === toUnit) return value;

  // "units" is only compatible with itself
  if (fromUnit === "units" || toUnit === "units") {
    throw new Error(
      `Cannot convert between "${fromUnit}" and "${toUnit}": incompatible unit types`
    );
  }

  // Convert everything to mcg first, then to target
  const toMcg: Record<string, number> = {
    mcg: 1,
    mg: 1_000,
    g: 1_000_000,
  };

  const fromFactor = toMcg[fromUnit];
  const toFactor = toMcg[toUnit];

  if (fromFactor === undefined) {
    throw new Error(`Unknown source unit: "${fromUnit}"`);
  }
  if (toFactor === undefined) {
    throw new Error(`Unknown target unit: "${toUnit}"`);
  }

  return (value * fromFactor) / toFactor;
}

/**
 * Returns true if the two units differ by exactly 1000× (mg/mcg confusion risk).
 * Used by the UNIT_RISK check.
 */
export function isThousandFoldMismatch(unitA: string, unitB: string): boolean {
  const pairs = new Set(["mcg|mg", "mg|mcg", "mg|g", "g|mg"]);
  return pairs.has(`${unitA}|${unitB}`);
}

/**
 * Safe floating-point comparison: returns true if a > b beyond a small tolerance.
 */
export function exceedsLimit(value: number, limit: number, tolerance = 1e-9): boolean {
  return value - limit > tolerance;
}
