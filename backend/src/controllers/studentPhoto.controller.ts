import type {
  NextFunction,
  Request,
  RequestHandler,
  Response
} from "express";

import {
  createStudentPhotoSignature
} from "../services/studentPhoto.service.js";

export const getStudentPhotoSignatureController:
  RequestHandler = async (
    _request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data =
        createStudentPhotoSignature();

      response.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  };