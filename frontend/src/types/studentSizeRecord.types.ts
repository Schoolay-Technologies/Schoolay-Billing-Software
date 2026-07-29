import type {
  Pagination
} from "./school.types";

export type StudentGender =
  | "MALE"
  | "FEMALE"
  | "UNISEX";

export type StudentSizeRecordStatus =
  | "ACTIVE"
  | "INACTIVE";

export interface StudentSizeItemInput {
  productId: string;
  variantId: string;
  quantity: number;
  additionalDescription: string;
}

export interface CreateStudentSizeRecordInput {
  schoolId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  section: string;
  gender: StudentGender;
  parentName: string;
  contactNumber: string;
  recordDate: string;
  items: StudentSizeItemInput[];
  generalRemarks: string;
  status: StudentSizeRecordStatus;
}

export interface StudentSizeRecordItem {
  _id: string;
  productId: string;
  variantId: string;
  productName: string;
  productCode: string;
  gender: StudentGender;
  size: string;
  quantity: number;
  additionalDescription: string;
}

export interface StudentSizeRecord {
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
  admissionNumber: string;
  className: string;
  section: string;
  gender: StudentGender;

  parentName: string;
  contactNumber: string;

  recordDate: string;

  items: StudentSizeRecordItem[];

  generalRemarks: string;
  status: StudentSizeRecordStatus;

  createdAt: string;
  updatedAt: string;
}

export interface StudentSizeRecordResponse {
  success: boolean;
  message?: string;
  data: StudentSizeRecord;
}

export interface StudentSizeRecordListResponse {
  success: boolean;
  data: StudentSizeRecord[];
  pagination: Pagination;
}

export interface StudentSizeReportFilters {
  schoolId: string;
  dateFrom: string;
  dateTo: string;
  className: string;
  section: string;
  gender: StudentGender | "";
  productId: string;
}