export const STUDENT_GENDERS = [
  "MALE",
  "FEMALE",
  "UNISEX"
] as const;

export type StudentGender =
  (typeof STUDENT_GENDERS)[number];

export const STUDENT_SIZE_RECORD_STATUSES = [
  "ACTIVE",
  "INACTIVE"
] as const;

export type StudentSizeRecordStatus =
  (typeof STUDENT_SIZE_RECORD_STATUSES)[number];