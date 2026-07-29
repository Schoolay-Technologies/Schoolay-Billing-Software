import type {
  NextFunction,
  Request,
  Response
} from "express";

import type { ZodType } from "zod";

export function validate(schema: ZodType) {
  return (
    request: Request,
    response: Response,
    next: NextFunction
  ): void => {
    const result = schema.safeParse({
      body: request.body,
      params: request.params,
      query: request.query
    });

    if (!result.success) {
      response.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message
        }))
      });

      return;
    }

    const parsedData = result.data as {
      body?: unknown;
      params?: Record<string, string>;
      query?: Record<string, unknown>;
    };

    /*
     * request.body is writable, so parsed Zod values
     * and defaults can safely replace it.
     */
    if (parsedData.body !== undefined) {
      request.body = parsedData.body;
    }

    /*
     * request.params is writable.
     */
    if (parsedData.params !== undefined) {
      request.params =
        parsedData.params as Request["params"];
    }

    /*
     * Do not assign request.query.
     *
     * In Express 5, request.query is getter-only.
     * Assigning it causes:
     * "Cannot set property query of IncomingMessage"
     *
     * Query validation has already succeeded above.
     * Controllers can continue reading request.query.
     */

    next();
  };
}