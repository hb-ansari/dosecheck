import { v4 as uuid } from "uuid";
import type { Finding, NewPrescription, DoseUnit } from "@/lib/schema";
import drugsRaw from "@/data/drugs.json";
import { normalizeToUnit, isThousandFoldMismatch, exceedsLimit } from "@/lib/units";

// ---------------------------------------------------------------------------
// Drug table types
// ---------------------------------------------------------------------------
interface DrugLimits {
  unit: string;
  adult: { max_single: number; max_daily: number };
  pediatric: { max_single_per_kg: number; max_daily_per_kg: number };
  weekly_only: boolean;
  cross_allergy?: string[];
  expected_concentrations_units_per_ml?: number[];
  verified: boolean;
}

const drugs = drugsRaw as Record<string, DrugLimits>;

// ---------------------------------------------------------------------------
// Helper: determine if pediatric limits apply
// Pediatric cutoff: age < 12 OR weight < 40 kg
// ---------------------------------------------------------------------------
function isPediatric(age_years: number, weight_kg: number | null): boolean {
  if (age_years < 12) return true;
  if (weight_kg !== null && weight_kg < 40) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Helper: make a code Finding
// ---------------------------------------------------------------------------
function makeFinding(
  code: string,
  severity: Finding["severity"],
  title: string,
  evidence: string,
  explanation_en: string,
  field_involved?: string
): Finding {
  return {
    id: uuid(),
    source: "code",
    code,
    severity,
    title,
    evidence,
    explanation_en,
    field_involved,
  };
}

// ---------------------------------------------------------------------------
// Individual checks (all pure functions, no network, no randomness)
// ---------------------------------------------------------------------------

/** UNKNOWN_DRUG: drug name not found in drugs.json (case-insensitive) */
export function checkUnknownDrug(drug: string): Finding[] {
  const key = drug.toLowerCase().trim();
  if (!(key in drugs)) {
    return [
      makeFinding(
        "UNKNOWN_DRUG",
        "medium",
        "Unknown drug",
        `Drug "${drug}" not found in the reference table`,
        `The drug "${drug}" is not in the DoseCheck reference table. Verify the spelling or add it to the drug database before dispensing.`,
        "drug"
      ),
    ];
  }
  return [];
}

/** MISSING_WEIGHT: patient under 18 and weight not provided */
export function checkMissingWeight(age_years: number, weight_kg: number | null): Finding[] {
  if (age_years < 18 && weight_kg === null) {
    return [
      makeFinding(
        "MISSING_WEIGHT",
        "high",
        "Weight missing for minor patient",
        `Age: ${age_years} years; weight: not provided`,
        "Weight is required for patients under 18 to calculate weight-based dose limits. Please provide the patient's weight.",
        "patient.weight_kg"
      ),
    ];
  }
  return [];
}

/** DECIMAL_FORMAT_RISK: missing leading zero (.5) or trailing zero after decimal (5.0) */
export function checkDecimalFormat(dose_text_raw: string): Finding[] {
  const trimmed = dose_text_raw.trim();
  const missingLeading = /(?:^|\s)\.\d/.test(trimmed);
  const trailingZero = /\.\d*0(?:\s|[a-zA-Z]|$)/.test(trimmed);

  if (missingLeading) {
    return [
      makeFinding(
        "DECIMAL_FORMAT_RISK",
        "medium",
        "Decimal format risk: missing leading zero",
        `dose_text_raw = "${dose_text_raw}"`,
        `The dose "${dose_text_raw}" starts with a decimal point. A leading zero should be written (e.g. "0.5") to reduce transcription errors.`,
        "dose_text_raw"
      ),
    ];
  }
  if (trailingZero) {
    return [
      makeFinding(
        "DECIMAL_FORMAT_RISK",
        "medium",
        "Decimal format risk: trailing zero after decimal",
        `dose_text_raw = "${dose_text_raw}"`,
        `The dose "${dose_text_raw}" has a trailing zero after the decimal point. This may cause a 10× or 100× overdose if misread. Use "${dose_text_raw.replace(/\.?0+(?=\s|[a-zA-Z]|$)/, "")}" instead.`,
        "dose_text_raw"
      ),
    ];
  }
  return [];
}

/** UNIT_RISK: entered unit differs from drug's normal unit by a 1000× factor (mg/mcg confusion) */
export function checkUnitRisk(drug: string, enteredUnit: DoseUnit): Finding[] {
  const key = drug.toLowerCase().trim();
  const entry = drugs[key];
  if (!entry) return []; // UNKNOWN_DRUG will handle this

  const drugUnit = entry.unit;
  if (enteredUnit !== drugUnit && isThousandFoldMismatch(enteredUnit, drugUnit)) {
    return [
      makeFinding(
        "UNIT_RISK",
        "medium",
        "Possible unit confusion",
        `Entered unit: ${enteredUnit}; expected unit for ${drug}: ${drugUnit}`,
        `${drug} is normally prescribed in ${drugUnit}, but ${enteredUnit} was entered. This is a 1000× difference and may indicate a transcription error.`,
        "dose_unit"
      ),
    ];
  }
  return [];
}

/** SINGLE_DOSE_EXCEEDED: normalized single dose above the applicable maximum */
export function checkSingleDose(
  drug: string,
  dose_value: number,
  dose_unit: DoseUnit,
  age_years: number,
  weight_kg: number | null
): Finding[] {
  const key = drug.toLowerCase().trim();
  const entry = drugs[key];
  if (!entry) return [];

  let normalized: number;
  try {
    normalized = normalizeToUnit(dose_value, dose_unit, entry.unit as DoseUnit);
  } catch {
    return []; // unit incompatible — UNIT_RISK handles it
  }

  const ped = isPediatric(age_years, weight_kg);
  const limit = ped ? entry.pediatric.max_single_per_kg * (weight_kg ?? 0) : entry.adult.max_single;

  // For pediatric, only check if we have a weight
  if (ped && weight_kg === null) return [];

  if (exceedsLimit(normalized, limit)) {
    return [
      makeFinding(
        "SINGLE_DOSE_EXCEEDED",
        "high",
        "Single dose exceeds maximum",
        `${normalized.toFixed(2)} ${entry.unit} per dose; limit ${limit.toFixed(2)} ${entry.unit}${ped ? ` (${weight_kg} kg × ${entry.pediatric.max_single_per_kg} ${entry.unit}/kg)` : ""}`,
        `The prescribed single dose of ${normalized.toFixed(2)} ${entry.unit} exceeds the ${ped ? "pediatric" : "adult"} maximum of ${limit.toFixed(2)} ${entry.unit}. Review and correct before dispensing.`,
        "dose_value"
      ),
    ];
  }
  return [];
}

/** DAILY_DOSE_EXCEEDED: single dose × frequency above daily maximum */
export function checkDailyDose(
  drug: string,
  dose_value: number,
  dose_unit: DoseUnit,
  frequency_per_day: number | null,
  age_years: number,
  weight_kg: number | null
): Finding[] {
  if (frequency_per_day === null) return [];

  const key = drug.toLowerCase().trim();
  const entry = drugs[key];
  if (!entry) return [];

  let normalized: number;
  try {
    normalized = normalizeToUnit(dose_value, dose_unit, entry.unit as DoseUnit);
  } catch {
    return [];
  }

  const dailyTotal = normalized * frequency_per_day;
  const ped = isPediatric(age_years, weight_kg);
  const limit = ped ? entry.pediatric.max_daily_per_kg * (weight_kg ?? 0) : entry.adult.max_daily;

  if (ped && weight_kg === null) return [];

  if (exceedsLimit(dailyTotal, limit)) {
    return [
      makeFinding(
        "DAILY_DOSE_EXCEEDED",
        "high",
        "Daily dose exceeds maximum",
        `${normalized.toFixed(2)} ${entry.unit} × ${frequency_per_day}/day = ${dailyTotal.toFixed(2)} ${entry.unit}/day; limit ${limit.toFixed(2)} ${entry.unit}/day${ped ? ` (${weight_kg} kg × ${entry.pediatric.max_daily_per_kg} ${entry.unit}/kg/day)` : ""}`,
        `The total daily dose of ${dailyTotal.toFixed(2)} ${entry.unit} (${normalized.toFixed(2)} × ${frequency_per_day} doses) exceeds the ${ped ? "pediatric" : "adult"} maximum of ${limit.toFixed(2)} ${entry.unit}/day.`,
        "frequency_per_day"
      ),
    ];
  }
  return [];
}

/** PER_KG_EXCEEDED: dose per kg exceeds pediatric per-kg limit */
export function checkPerKg(
  drug: string,
  dose_value: number,
  dose_unit: DoseUnit,
  frequency_per_day: number | null,
  age_years: number,
  weight_kg: number | null
): Finding[] {
  if (weight_kg === null) return [];
  if (!isPediatric(age_years, weight_kg)) return [];

  const key = drug.toLowerCase().trim();
  const entry = drugs[key];
  if (!entry) return [];

  let normalized: number;
  try {
    normalized = normalizeToUnit(dose_value, dose_unit, entry.unit as DoseUnit);
  } catch {
    return [];
  }

  const findings: Finding[] = [];
  const dosePerKg = normalized / weight_kg;

  // Single dose per kg check
  if (exceedsLimit(dosePerKg, entry.pediatric.max_single_per_kg)) {
    findings.push(
      makeFinding(
        "PER_KG_EXCEEDED",
        "high",
        "Per-kg single dose exceeds pediatric limit",
        `${normalized.toFixed(2)} ${entry.unit} / ${weight_kg} kg = ${dosePerKg.toFixed(2)} ${entry.unit}/kg; limit ${entry.pediatric.max_single_per_kg} ${entry.unit}/kg`,
        `The dose of ${dosePerKg.toFixed(2)} ${entry.unit}/kg exceeds the pediatric maximum of ${entry.pediatric.max_single_per_kg} ${entry.unit}/kg per dose.`,
        "dose_value"
      )
    );
  }

  // Daily dose per kg check
  if (frequency_per_day !== null) {
    const dailyPerKg = dosePerKg * frequency_per_day;
    if (exceedsLimit(dailyPerKg, entry.pediatric.max_daily_per_kg)) {
      findings.push(
        makeFinding(
          "PER_KG_EXCEEDED",
          "high",
          "Per-kg daily dose exceeds pediatric limit",
          `${dosePerKg.toFixed(2)} ${entry.unit}/kg × ${frequency_per_day}/day = ${dailyPerKg.toFixed(2)} ${entry.unit}/kg/day; limit ${entry.pediatric.max_daily_per_kg} ${entry.unit}/kg/day`,
          `The total daily dose of ${dailyPerKg.toFixed(2)} ${entry.unit}/kg/day exceeds the pediatric maximum of ${entry.pediatric.max_daily_per_kg} ${entry.unit}/kg/day.`,
          "frequency_per_day"
        )
      );
    }
  }

  return findings;
}

/** WEEKLY_ONLY_VIOLATION: weekly-only drug prescribed more frequently than weekly */
export function checkWeeklyOnly(
  drug: string,
  frequency_per_day: number | null
): Finding[] {
  const key = drug.toLowerCase().trim();
  const entry = drugs[key];
  if (!entry) return [];
  if (!entry.weekly_only) return [];
  if (frequency_per_day === null) return [];
  if (frequency_per_day <= 0) return [];

  return [
    makeFinding(
      "WEEKLY_ONLY_VIOLATION",
      "high",
      "Weekly-only drug prescribed too frequently",
      `${drug} is weekly-only; frequency_per_day = ${frequency_per_day}`,
      `${drug} must only be administered once weekly. A daily frequency creates serious overdose risk. This finding must be resolved before dispensing.`,
      "frequency_per_day"
    ),
  ];
}

/** CONCENTRATION_MISMATCH: concentration not in expected list, or volume implausible for weight */
export function checkConcentrationMismatch(
  drug: string,
  concentration: string | undefined,
  weight_kg: number | null
): Finding[] {
  if (!concentration) return [];

  const key = drug.toLowerCase().trim();
  const entry = drugs[key];
  if (!entry || !entry.expected_concentrations_units_per_ml) return [];

  // Parse concentration value (e.g., "10000 units/mL" → 10000)
  const match = concentration.match(/^([\d.]+)\s*/);
  if (!match) return [];
  const entered = parseFloat(match[1]);
  if (isNaN(entered)) return [];

  const allowed = entry.expected_concentrations_units_per_ml;
  const isAllowed = allowed.some((v) => Math.abs(v - entered) < 1e-9);

  if (!isAllowed) {
    return [
      makeFinding(
        "CONCENTRATION_MISMATCH",
        "high",
        "Concentration not in expected list",
        `Entered: ${concentration}; expected one of: ${allowed.join(", ")} units/mL`,
        `The concentration "${concentration}" is not one of the standard concentrations for ${drug} (${allowed.join(", ")} units/mL). A non-standard concentration significantly increases the risk of dosing error.`,
        "concentration"
      ),
    ];
  }

  // Implausible volume check for neonates/very small patients
  // For heparin 10,000 units/mL — even a small volume gives a massive dose to a neonate
  if (weight_kg !== null && weight_kg < 5 && entered >= 10000) {
    return [
      makeFinding(
        "CONCENTRATION_MISMATCH",
        "high",
        "High-concentration preparation unsafe for low-weight patient",
        `Concentration: ${entered} units/mL; patient weight: ${weight_kg} kg`,
        `A ${entered} units/mL concentration is potentially dangerous for a ${weight_kg} kg patient. Even a fraction of 1 mL delivers a very high dose. This type of error has been associated with known heparin vial mix-up incidents. Use a lower concentration preparation.`,
        "concentration"
      ),
    ];
  }

  return [];
}

// ---------------------------------------------------------------------------
// Main: run all checks on a prescription input
// ---------------------------------------------------------------------------
export function runCodeChecks(
  rx: NewPrescription & { id?: string }
): Finding[] {
  const findings: Finding[] = [];

  findings.push(...checkUnknownDrug(rx.drug));
  findings.push(...checkMissingWeight(rx.patient.age_years, rx.patient.weight_kg));
  findings.push(...checkDecimalFormat(rx.dose_text_raw));
  findings.push(...checkUnitRisk(rx.drug, rx.dose_unit));
  findings.push(
    ...checkSingleDose(rx.drug, rx.dose_value, rx.dose_unit, rx.patient.age_years, rx.patient.weight_kg)
  );
  findings.push(
    ...checkDailyDose(
      rx.drug,
      rx.dose_value,
      rx.dose_unit,
      rx.frequency_per_day,
      rx.patient.age_years,
      rx.patient.weight_kg
    )
  );
  findings.push(
    ...checkPerKg(
      rx.drug,
      rx.dose_value,
      rx.dose_unit,
      rx.frequency_per_day,
      rx.patient.age_years,
      rx.patient.weight_kg
    )
  );
  findings.push(...checkWeeklyOnly(rx.drug, rx.frequency_per_day));
  findings.push(...checkConcentrationMismatch(rx.drug, rx.concentration, rx.patient.weight_kg));

  return findings;
}
