import { Types } from "mongoose";

import { SchoolModel } from "../models/school.model.js";
import type {
  CreateSchoolInput,
  UpdateSchoolInput
} from "../schemas/school.schema.js";

export async function createSchool(input: CreateSchoolInput) {
  const existingSchool = await SchoolModel.findOne({
    schoolCode: input.schoolCode
  });

  if (existingSchool) {
    throw new Error(
      `A school with code ${input.schoolCode} already exists.`
    );
  }

  return SchoolModel.create(input);
}

export async function getSchools(options: {
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  page?: number;
  limit?: number;
}) {
  const page = Math.max(options.page ?? 1, 1);
  const limit = Math.min(Math.max(options.limit ?? 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (options.status) {
    filter.status = options.status;
  }

  if (options.search) {
    filter.$or = [
      {
        schoolName: {
          $regex: options.search,
          $options: "i"
        }
      },
      {
        schoolCode: {
          $regex: options.search,
          $options: "i"
        }
      }
    ];
  }

  const [schools, total] = await Promise.all([
    SchoolModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    SchoolModel.countDocuments(filter)
  ]);

  return {
    schools,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getSchoolById(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid school ID.");
  }

  const school = await SchoolModel.findById(id).lean();

  if (!school) {
    throw new Error("School not found.");
  }

  return school;
}

export async function updateSchool(
  id: string,
  input: UpdateSchoolInput
) {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid school ID.");
  }

  if (input.schoolCode) {
    const duplicateSchool = await SchoolModel.findOne({
      _id: { $ne: id },
      schoolCode: input.schoolCode
    });

    if (duplicateSchool) {
      throw new Error(
        `A school with code ${input.schoolCode} already exists.`
      );
    }
  }

  const school = await SchoolModel.findByIdAndUpdate(
    id,
    input,
    {
      new: true,
      runValidators: true
    }
  );

  if (!school) {
    throw new Error("School not found.");
  }

  return school;
}

export async function changeSchoolStatus(
  id: string,
  status: "ACTIVE" | "INACTIVE"
) {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid school ID.");
  }

  const school = await SchoolModel.findByIdAndUpdate(
    id,
    { status },
    {
      new: true,
      runValidators: true
    }
  );

  if (!school) {
    throw new Error("School not found.");
  }

  return school;
}