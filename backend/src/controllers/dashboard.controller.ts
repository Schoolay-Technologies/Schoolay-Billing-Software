import type {
  NextFunction,
  Request,
  RequestHandler,
  Response
} from "express";

import {
  getDashboardData
} from "../services/dashboard.service.js";

export const getDashboardController:
  RequestHandler = async (
    _request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data =
        await getDashboardData();

      response.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  };