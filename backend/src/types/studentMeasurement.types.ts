export const STUDENT_GENDERS = [
  "MALE",
  "FEMALE",
  "UNISEX"
] as const;

export type StudentGender =
  (typeof STUDENT_GENDERS)[number];

export const MEASUREMENT_RECORD_STATUSES = [
  "ACTIVE",
  "INACTIVE"
] as const;

export type MeasurementRecordStatus =
  (typeof MEASUREMENT_RECORD_STATUSES)[number];

export const SIZE_MODES = [
  "STANDARD",
  "CUSTOM"
] as const;

export type SizeMode =
  (typeof SIZE_MODES)[number];

export const SIZE_SELECTION_MODES = [
  "RECOMMENDED",
  "MANUAL_OVERRIDE"
] as const;

export type SizeSelectionMode =
  (typeof SIZE_SELECTION_MODES)[number];

export interface MeasurementRange {
  minimum: number;
  maximum: number;
}

export interface SizeChartEntry {
  size: string;
  height: MeasurementRange;
  chest: MeasurementRange;
  waist: MeasurementRange;
  hip: MeasurementRange;
  shoulder: number;
  sleeve: number;
  shirtLength: number;
  pantLength: number;
  inseam: number;
  neck: number;
}