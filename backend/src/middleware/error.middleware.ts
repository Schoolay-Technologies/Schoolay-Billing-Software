import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response
} from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
): void => {
  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });

    return;
  }

  if (error instanceof Error) {
    const statusCode = response.statusCode >= 400
      ? response.statusCode
      : 500;

    response.status(statusCode).json({
      success: false,
      message: error.message,
      stack:
        process.env.NODE_ENV === "development"
          ? error.stack
          : undefined
    });

    return;
  }

  response.status(500).json({
    success: false,
    message: "An unexpected server error occurred."
  });
};