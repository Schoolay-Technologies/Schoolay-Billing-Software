import type { NextFunction, Request, Response } from "express";

import type {
  CreateSchoolInput,
  UpdateSchoolInput
} from "../schemas/school.schema.js";

import {
  changeSchoolStatus,
  createSchool,
  getSchoolById,
  getSchools,
  updateSchool
} from "../services/school.service.js";

export async function createSchoolController(
  request: Request<object, object, CreateSchoolInput>,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const school = await createSchool(request.body);

    response.status(201).json({
      success: true,
      message: "School created successfully.",
      data: school
    });
  } catch (error) {
    next(error);
  }
}

export async function getSchoolsController(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const search =
      typeof request.query.search === "string"
        ? request.query.search
        : undefined;

    const rawStatus =
      typeof request.query.status === "string"
        ? request.query.status
        : undefined;

    const status =
      rawStatus === "ACTIVE" || rawStatus === "INACTIVE"
        ? rawStatus
        : undefined;

    const page = Number(request.query.page) || 1;
    const limit = Number(request.query.limit) || 10;

    const result = await getSchools({
      search,
      status,
      page,
      limit
    });

    response.status(200).json({
      success: true,
      data: result.schools,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

export async function getSchoolByIdController(
  request: Request<{ id: string }>,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const school = await getSchoolById(request.params.id);

    response.status(200).json({
      success: true,
      data: school
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSchoolController(
  request: Request<{ id: string }, object, UpdateSchoolInput>,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const school = await updateSchool(
      request.params.id,
      request.body
    );

    response.status(200).json({
      success: true,
      message: "School updated successfully.",
      data: school
    });
  } catch (error) {
    next(error);
  }
}

export async function changeSchoolStatusController(
  request: Request<
    { id: string },
    object,
    { status: "ACTIVE" | "INACTIVE" }
  >,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const school = await changeSchoolStatus(
      request.params.id,
      request.body.status
    );

    response.status(200).json({
      success: true,
      message: `School marked as ${request.body.status.toLowerCase()}.`,
      data: school
    });
  } catch (error) {
    next(error);
  }
}