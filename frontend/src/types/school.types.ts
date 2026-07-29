export type SchoolStatus = "ACTIVE" | "INACTIVE";

export interface SchoolAddress {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface School {
  _id: string;
  schoolName: string;
  schoolCode: string;
  address: SchoolAddress;
  contactPerson: string;
  contactNumber: string;
  email: string;
  gstNumber: string;
  status: SchoolStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchoolInput {
  schoolName: string;
  schoolCode: string;
  address: SchoolAddress;
  contactPerson: string;
  contactNumber: string;
  email: string;
  gstNumber: string;
  status: SchoolStatus;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SchoolsResponse {
  success: boolean;
  data: School[];
  pagination: Pagination;
}

export interface SchoolResponse {
  success: boolean;
  message?: string;
  data: School;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}