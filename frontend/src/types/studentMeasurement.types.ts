import type {
  Pagination
} from "./school.types";

export type StudentGender =
  | "MALE"
  | "FEMALE"
  | "UNISEX";

export type MeasurementRecordStatus =
  | "ACTIVE"
  | "INACTIVE";

export type SizeMode =
  | "STANDARD"
  | "CUSTOM";

export type SizeSelectionMode =
  | "RECOMMENDED"
  | "MANUAL_OVERRIDE";

export interface StudentPhoto {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export interface BodyMeasurements {
  /**
   * Height is stored in centimetres.
   * All remaining measurements are stored in inches.
   */
  height?: number;
  chest?: number;
  waist?: number;
  hip?: number;
  shoulder?: number;
  sleeve?: number;
  shirtLength?: number;
  pantLength?: number;
  inseam?: number;
  neck?: number;
}

export interface StudentMeasurementItemInput {
  productId: string;
  quantity: number;

  sizeMode: SizeMode;

  sizeSelectionMode:
    SizeSelectionMode;

  manualOverrideSize: string;

  /**
   * Used only when sizeMode is CUSTOM.
   */
  customSize: string;

  remarks: string;
}

export interface StudentMeasurementInput {
  schoolId: string;

  studentName: string;
  studentId: string;
  mobileNumber: string;

  className: string;
  section: string;

  gender: StudentGender;
  academicYear: string;

  photo: StudentPhoto;

  measurements: BodyMeasurements;

  measurementDate: string;

  items:
    StudentMeasurementItemInput[];

  generalRemarks: string;

  status:
    MeasurementRecordStatus;
}

export interface StudentMeasurementItem {
  _id: string;

  productId:
    | string
    | {
        _id: string;
      };

  productName: string;
  productCode: string;

  productGender:
    StudentGender;

  quantity: number;

  sizeMode: SizeMode;

  recommendedSize: string;

  recommendationScore: number;

  sizeSelectionMode:
    SizeSelectionMode;

  manualOverrideSize: string;

  finalSize: string;

  remarks: string;
}

export interface StudentMeasurementRecord {
  _id: string;

  schoolId:
    | string
    | {
        _id: string;
        schoolName?: string;
        schoolCode?: string;
      };

  schoolName: string;
  schoolCode: string;

  studentName: string;
  studentId: string;
  mobileNumber: string;

  className: string;
  section: string;

  gender: StudentGender;
  academicYear: string;

  photo: StudentPhoto;

  measurements:
    BodyMeasurements;

  recommendedSize: string;

  recommendationScore: number;

  recommendationMatchedFields:
    string[];

  measurementDate: string;

  items:
    StudentMeasurementItem[];

  generalRemarks: string;

  status:
    MeasurementRecordStatus;

  createdAt: string;
  updatedAt: string;
}

export interface StudentMeasurementResponse {
  success: boolean;
  message?: string;
  data:
    StudentMeasurementRecord;
}

export interface StudentMeasurementListResponse {
  success: boolean;

  data:
    StudentMeasurementRecord[];

  pagination: Pagination;
}

export interface StudentMeasurementListParameters {
  schoolId?: string;
  search?: string;

  className?: string;
  section?: string;

  gender?:
    | StudentGender
    | "";

  academicYear?: string;

  status?:
    | MeasurementRecordStatus
    | "";

  dateFrom?: string;
  dateTo?: string;

  productId?: string;
  size?: string;

  page?: number;
  limit?: number;
}

export interface StudentMeasurementReportFilters {
  schoolId: string;

  dateFrom: string;
  dateTo: string;

  className: string;
  section: string;

  gender:
    | StudentGender
    | "";

  academicYear: string;

  productId: string;
  size: string;
}

export interface StudentPhotoSignature {
  timestamp: number;
  folder: string;
  signature: string;
  cloudName: string;
  apiKey: string;
}

export interface StudentPhotoSignatureResponse {
  success: boolean;
  data:
    StudentPhotoSignature;
}

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
}

export interface SizeRecommendation {
  recommendedSize: string;
  score: number;
  matchedFields: string[];
  consideredFields: string[];
}