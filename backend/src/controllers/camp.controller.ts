import type {
  NextFunction,
  Request,
  RequestHandler,
  Response
} from "express";

import type {
  CreateCampInput,
  PublicCampOrderInput,
  UpdateCampInput
} from "../schemas/camp.schema.js";

import type {
  CampStatus
} from "../types/camp.types.js";

import {
  activateCamp,
  closeCamp,
  createCamp,
  deleteCamp,
  generateCampQrCode,
  getCampById,
  getCamps,
  getPublicCamp,
  submitPublicCampOrder,
  updateCamp
} from "../services/camp.service.js";

function getStringQuery(
  request: Request,
  field: string
): string | undefined {
  const value = request.query[field];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue =
    value.trim();

  return trimmedValue
    ? trimmedValue
    : undefined;
}

function getCampStatusQuery(
  request: Request
): CampStatus | undefined {
  const value =
    getStringQuery(
      request,
      "status"
    );

  if (
    value === "DRAFT" ||
    value === "ACTIVE" ||
    value === "CLOSED"
  ) {
    return value;
  }

  return undefined;
}

function getPositiveIntegerQuery(
  request: Request,
  field: string,
  defaultValue: number
): number {
  const value =
    getStringQuery(
      request,
      field
    );

  if (!value) {
    return defaultValue;
  }

  const parsedValue =
    Number(value);

  if (
    !Number.isFinite(
      parsedValue
    ) ||
    parsedValue < 1
  ) {
    return defaultValue;
  }

  return Math.floor(
    parsedValue
  );
}

function getCampId(
  request: Request
): string {
  const id =
    request.params.id;

  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    throw new Error(
      "Camp ID is required."
    );
  }

  return id.trim();
}

function getCampToken(
  request: Request
): string {
  const token =
    request.params.token;

  if (
    typeof token !== "string" ||
    !token.trim()
  ) {
    throw new Error(
      "Camp token is required."
    );
  }

  return token.trim();
}

export const createCampController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input =
        request.body as CreateCampInput;

      const camp =
        await createCamp(
          input
        );

      response
        .status(201)
        .json({
          success: true,
          message:
            "Camp created successfully.",
          data: camp
        });
    } catch (error) {
      next(error);
    }
  };

export const getCampsController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result =
        await getCamps({
          schoolId:
            getStringQuery(
              request,
              "schoolId"
            ),

          search:
            getStringQuery(
              request,
              "search"
            ),

          status:
            getCampStatusQuery(
              request
            ),

          dateFrom:
            getStringQuery(
              request,
              "dateFrom"
            ),

          dateTo:
            getStringQuery(
              request,
              "dateTo"
            ),

          page:
            getPositiveIntegerQuery(
              request,
              "page",
              1
            ),

          limit:
            getPositiveIntegerQuery(
              request,
              "limit",
              10
            )
        });

      response
        .status(200)
        .json({
          success: true,
          data: result.camps,
          pagination:
            result.pagination
        });
    } catch (error) {
      next(error);
    }
  };

export const getCampByIdController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const camp =
        await getCampById(
          getCampId(request)
        );

      response
        .status(200)
        .json({
          success: true,
          data: camp
        });
    } catch (error) {
      next(error);
    }
  };

export const updateCampController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input =
        request.body as UpdateCampInput;

      const camp =
        await updateCamp(
          getCampId(request),
          input
        );

      response
        .status(200)
        .json({
          success: true,
          message:
            "Camp updated successfully.",
          data: camp
        });
    } catch (error) {
      next(error);
    }
  };

export const activateCampController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const camp =
        await activateCamp(
          getCampId(request)
        );

      response
        .status(200)
        .json({
          success: true,
          message:
            "Camp activated successfully.",
          data: camp
        });
    } catch (error) {
      next(error);
    }
  };

export const closeCampController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const camp =
        await closeCamp(
          getCampId(request)
        );

      response
        .status(200)
        .json({
          success: true,
          message:
            "Camp closed successfully.",
          data: camp
        });
    } catch (error) {
      next(error);
    }
  };

export const deleteCampController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await deleteCamp(
        getCampId(request)
      );

      response
        .status(200)
        .json({
          success: true,
          message:
            "Camp deleted successfully."
        });
    } catch (error) {
      next(error);
    }
  };

export const generateCampQrCodeController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data =
        await generateCampQrCode(
          getCampId(request)
        );

      response
        .status(200)
        .json({
          success: true,
          data
        });
    } catch (error) {
      next(error);
    }
  };

export const getPublicCampController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const camp =
        await getPublicCamp(
          getCampToken(request)
        );

      response
        .status(200)
        .json({
          success: true,
          data: camp
        });
    } catch (error) {
      next(error);
    }
  };

export const submitPublicCampOrderController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input =
        request.body as PublicCampOrderInput;

      const result =
        await submitPublicCampOrder(
          getCampToken(request),
          input
        );

      response
        .status(201)
        .json({
          success: true,
          message:
            "Uniform requirement submitted successfully.",
          data: result
        });
    } catch (error) {
      next(error);
    }
  };