import { describe, it, expect } from "vitest";
import {
  checkUnknownDrug,
  checkMissingWeight,
  checkDecimalFormat,
  checkUnitRisk,
  checkSingleDose,
  checkDailyDose,
  checkPerKg,
  checkWeeklyOnly,
  checkConcentrationMismatch,
  runCodeChecks,
} from "@/lib/checks";

// ---------------------------------------------------------------------------
// UNKNOWN_DRUG
// ---------------------------------------------------------------------------
describe("checkUnknownDrug", () => {
  it("flags a drug not in the table", () => {
    const result = checkUnknownDrug("unicornium");
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("UNKNOWN_DRUG");
    expect(result[0].source).toBe("code");
  });

  it("does not flag a known drug (case-insensitive)", () => {
    expect(checkUnknownDrug("Paracetamol")).toHaveLength(0);
    expect(checkUnknownDrug("IBUPROFEN")).toHaveLength(0);
    expect(checkUnknownDrug("methotrexate")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// MISSING_WEIGHT
// ---------------------------------------------------------------------------
describe("checkMissingWeight", () => {
  it("flags a minor with no weight", () => {
    const result = checkMissingWeight(10, null);
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("MISSING_WEIGHT");
    expect(result[0].severity).toBe("high");
  });

  it("does not flag a minor with weight provided", () => {
    expect(checkMissingWeight(10, 30)).toHaveLength(0);
  });

  it("does not flag an adult with no weight", () => {
    expect(checkMissingWeight(25, null)).toHaveLength(0);
  });

  it("flags a 17-year-old with no weight", () => {
    const result = checkMissingWeight(17, null);
    expect(result).toHaveLength(1);
  });

  it("does not flag an 18-year-old with no weight", () => {
    expect(checkMissingWeight(18, null)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// DECIMAL_FORMAT_RISK
// ---------------------------------------------------------------------------
describe("checkDecimalFormat", () => {
  it("flags missing leading zero (.5 mg)", () => {
    const result = checkDecimalFormat(".5");
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("DECIMAL_FORMAT_RISK");
  });

  it("flags trailing zero after decimal (5.0)", () => {
    const result = checkDecimalFormat("5.0");
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("DECIMAL_FORMAT_RISK");
  });

  it("does not flag a correct format", () => {
    expect(checkDecimalFormat("0.5")).toHaveLength(0);
    expect(checkDecimalFormat("500")).toHaveLength(0);
    expect(checkDecimalFormat("1.5")).toHaveLength(0);
  });

  it("does not flag '10' as trailing zero", () => {
    // "10" — the zero is before decimal, not after
    expect(checkDecimalFormat("10")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// UNIT_RISK
// ---------------------------------------------------------------------------
describe("checkUnitRisk", () => {
  it("flags mg entered for digoxin (which is in mcg)", () => {
    const result = checkUnitRisk("digoxin", "mg");
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("UNIT_RISK");
  });

  it("does not flag mcg for digoxin (correct unit)", () => {
    expect(checkUnitRisk("digoxin", "mcg")).toHaveLength(0);
  });

  it("does not flag mg for paracetamol (correct unit)", () => {
    expect(checkUnitRisk("paracetamol", "mg")).toHaveLength(0);
  });

  it("does not flag an unknown drug", () => {
    expect(checkUnitRisk("unicornium", "mg")).toHaveLength(0);
  });

  it("flags mcg entered for paracetamol (which is in mg)", () => {
    const result = checkUnitRisk("paracetamol", "mcg");
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("UNIT_RISK");
  });
});

// ---------------------------------------------------------------------------
// SINGLE_DOSE_EXCEEDED
// ---------------------------------------------------------------------------
describe("checkSingleDose", () => {
  it("flags adult paracetamol exceeding 1000 mg single dose", () => {
    const result = checkSingleDose("paracetamol", 1200, "mg", 30, 70);
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("SINGLE_DOSE_EXCEEDED");
    expect(result[0].severity).toBe("high");
  });

  it("does not flag adult paracetamol exactly at 1000 mg", () => {
    expect(checkSingleDose("paracetamol", 1000, "mg", 30, 70)).toHaveLength(0);
  });

  it("does not flag adult paracetamol at 500 mg", () => {
    expect(checkSingleDose("paracetamol", 500, "mg", 30, 70)).toHaveLength(0);
  });

  it("flags pediatric paracetamol exceeding per-kg limit", () => {
    // 6-year-old 18kg, 300mg per dose = 16.7 mg/kg > 15 mg/kg limit
    const result = checkSingleDose("paracetamol", 300, "mg", 6, 18);
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("SINGLE_DOSE_EXCEEDED");
  });

  it("does not flag pediatric paracetamol exactly at limit", () => {
    // 18kg × 15 mg/kg = 270 mg exactly
    expect(checkSingleDose("paracetamol", 270, "mg", 6, 18)).toHaveLength(0);
  });

  it("handles g to mg conversion correctly", () => {
    // 1.5 g = 1500 mg > 1000 mg adult limit
    const result = checkSingleDose("paracetamol", 1.5, "g", 30, 70);
    expect(result).toHaveLength(1);
  });

  it("skips check for unknown drug", () => {
    expect(checkSingleDose("unicornium", 9999, "mg", 30, 70)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// DAILY_DOSE_EXCEEDED
// ---------------------------------------------------------------------------
describe("checkDailyDose", () => {
  it("flags paracetamol 1500mg × 4/day = 6000mg/day > 4000mg limit", () => {
    const result = checkDailyDose("paracetamol", 1500, "mg", 4, 30, 70);
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("DAILY_DOSE_EXCEEDED");
  });

  it("does not flag paracetamol 1000mg × 4/day = 4000mg exactly", () => {
    expect(checkDailyDose("paracetamol", 1000, "mg", 4, 30, 70)).toHaveLength(0);
  });

  it("returns empty when frequency_per_day is null", () => {
    expect(checkDailyDose("paracetamol", 1500, "mg", null, 30, 70)).toHaveLength(0);
  });

  it("flags pediatric 18kg × paracetamol 1500mg × 4/day", () => {
    // daily = 1500 × 4 = 6000mg; pediatric limit = 18 × 75 = 1350mg
    const result = checkDailyDose("paracetamol", 1500, "mg", 4, 6, 18);
    expect(result).toHaveLength(1);
  });

  it("does not flag paracetamol 500mg × 3/day = 1500mg (below 4000 limit)", () => {
    expect(checkDailyDose("paracetamol", 500, "mg", 3, 30, 70)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// PER_KG_EXCEEDED
// ---------------------------------------------------------------------------
describe("checkPerKg", () => {
  it("flags pediatric paracetamol 1500mg for 18kg = 83.3 mg/kg > 15 mg/kg", () => {
    const result = checkPerKg("paracetamol", 1500, "mg", 4, 6, 18);
    // Should catch both single and daily
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.every((f) => f.code === "PER_KG_EXCEEDED")).toBe(true);
  });

  it("does not run for adult (age 30, weight 70)", () => {
    expect(checkPerKg("paracetamol", 1500, "mg", 4, 30, 70)).toHaveLength(0);
  });

  it("does not run when weight is null", () => {
    expect(checkPerKg("paracetamol", 1500, "mg", 4, 6, null)).toHaveLength(0);
  });

  it("does not flag at exactly the per-kg limit", () => {
    // 18 kg × 15 mg/kg = 270 mg exactly — must not flag
    expect(checkPerKg("paracetamol", 270, "mg", null, 6, 18)).toHaveLength(0);
  });

  it("triggers for low-weight adult (35kg) treated as pediatric", () => {
    // weight < 40 kg → pediatric; 400mg / 35kg = 11.4 mg/kg > 10 mg/kg (ibuprofen)
    const result = checkPerKg("ibuprofen", 400, "mg", null, 20, 35);
    expect(result).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// WEEKLY_ONLY_VIOLATION
// ---------------------------------------------------------------------------
describe("checkWeeklyOnly", () => {
  it("flags methotrexate with frequency_per_day = 1", () => {
    const result = checkWeeklyOnly("methotrexate", 1);
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("WEEKLY_ONLY_VIOLATION");
    expect(result[0].severity).toBe("high");
  });

  it("does not flag methotrexate with frequency_per_day = null", () => {
    expect(checkWeeklyOnly("methotrexate", null)).toHaveLength(0);
  });

  it("does not flag paracetamol (not weekly only) with any frequency", () => {
    expect(checkWeeklyOnly("paracetamol", 3)).toHaveLength(0);
  });

  it("does not flag unknown drug", () => {
    expect(checkWeeklyOnly("unicornium", 1)).toHaveLength(0);
  });

  it("flags methotrexate with frequency_per_day = 7", () => {
    const result = checkWeeklyOnly("methotrexate", 7);
    expect(result).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// CONCENTRATION_MISMATCH
// ---------------------------------------------------------------------------
describe("checkConcentrationMismatch", () => {
  it("flags heparin with non-standard concentration", () => {
    const result = checkConcentrationMismatch("heparin", "500 units/mL", 70);
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("CONCENTRATION_MISMATCH");
  });

  it("does not flag heparin with standard 1000 units/mL for adult", () => {
    expect(checkConcentrationMismatch("heparin", "1000 units/mL", 70)).toHaveLength(0);
  });

  it("flags heparin 10000 units/mL for 3kg neonate (implausible volume)", () => {
    const result = checkConcentrationMismatch("heparin", "10000 units/mL", 3);
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("CONCENTRATION_MISMATCH");
  });

  it("returns empty when concentration is not provided", () => {
    expect(checkConcentrationMismatch("heparin", undefined, 70)).toHaveLength(0);
  });

  it("returns empty for paracetamol (no expected concentration list)", () => {
    expect(checkConcentrationMismatch("paracetamol", "500 mg/5mL", 70)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Demo case verification
// ---------------------------------------------------------------------------
describe("Demo cases via runCodeChecks", () => {
  const basePatientAdult = { age_years: 35, weight_kg: 70 };
  const basePrescription = {
    patient: basePatientAdult,
    dose_text_raw: "500 mg",
    frequency_per_day: 3 as number | null,
    frequency_text: "three times daily",
    note: "for pain",
  };

  it("Demo case 1: clean adult paracetamol 500mg TDS → no findings", () => {
    const result = runCodeChecks({
      ...basePrescription,
      drug: "paracetamol",
      dose_value: 500,
      dose_unit: "mg",
    });
    expect(result).toHaveLength(0);
  });

  it("Demo case 2: pediatric 18kg paracetamol 1500mg × 4/day → PER_KG + DAILY_DOSE", () => {
    const result = runCodeChecks({
      patient: { age_years: 6, weight_kg: 18 },
      drug: "paracetamol",
      dose_value: 1500,
      dose_unit: "mg",
      dose_text_raw: "1500 mg",
      frequency_per_day: 4,
      frequency_text: "four times daily",
      note: "for fever",
    });
    const codes = result.map((f) => f.code);
    expect(codes).toContain("PER_KG_EXCEEDED");
    expect(codes).toContain("DAILY_DOSE_EXCEEDED");
  });

  it("Demo case 3: methotrexate daily → WEEKLY_ONLY_VIOLATION", () => {
    const result = runCodeChecks({
      patient: basePatientAdult,
      drug: "methotrexate",
      dose_value: 10,
      dose_unit: "mg",
      dose_text_raw: "10 mg",
      frequency_per_day: 1,
      frequency_text: "once daily",
      note: "rheumatoid arthritis",
    });
    expect(result.map((f) => f.code)).toContain("WEEKLY_ONLY_VIOLATION");
  });

  it("Demo case 4a: dose_text_raw '.5 mg' → DECIMAL_FORMAT_RISK", () => {
    const result = runCodeChecks({
      patient: basePatientAdult,
      drug: "paracetamol",
      dose_value: 0.5,
      dose_unit: "mg",
      dose_text_raw: ".5 mg",
      frequency_per_day: 3,
      frequency_text: "three times daily",
      note: "test",
    });
    expect(result.map((f) => f.code)).toContain("DECIMAL_FORMAT_RISK");
  });

  it("Demo case 4b: dose_text_raw '5.0 mg' → DECIMAL_FORMAT_RISK", () => {
    const result = runCodeChecks({
      patient: basePatientAdult,
      drug: "paracetamol",
      dose_value: 5,
      dose_unit: "mg",
      dose_text_raw: "5.0 mg",
      frequency_per_day: 3,
      frequency_text: "three times daily",
      note: "test",
    });
    expect(result.map((f) => f.code)).toContain("DECIMAL_FORMAT_RISK");
  });

  it("Demo case 7: neonate 3kg heparin 10000 units/mL → CONCENTRATION_MISMATCH", () => {
    const result = runCodeChecks({
      patient: { age_years: 0, weight_kg: 3 },
      drug: "heparin",
      dose_value: 100,
      dose_unit: "units",
      dose_text_raw: "100 units",
      frequency_per_day: null,
      frequency_text: "as required",
      note: "IV heparin flush for neonate",
      concentration: "10000 units/mL",
    });
    expect(result.map((f) => f.code)).toContain("CONCENTRATION_MISMATCH");
  });
});
