import { Router } from "express";

import {
  createStudentMeasurementController,
  deleteStudentMeasurementController,
  downloadStudentMeasurementExcelController,
  getStudentMeasurementByIdController,
  getStudentMeasurementReportController,
  getStudentMeasurementsController,
  updateStudentMeasurementController,
  getStudentMeasurementsByMobileController,
} from "../controllers/studentMeasurement.controller";

import {
  getStudentPhotoSignatureController
} from "../controllers/studentPhoto.controller.js";

import {
  validate
} from "../middleware/validate.middleware.js";

import {
  createStudentMeasurementSchema,
  studentMeasurementIdSchema,
  updateStudentMeasurementSchema
} from "../schemas/studentMeasurement.schema.js";

const router = Router();

/*
 * Fixed routes must always come before "/:id".
 * Otherwise Express may treat words like
 * "photo" or "reports" as a MongoDB record ID.
 */

router.get(
  "/photo/signature",
  getStudentPhotoSignatureController
);

router.get(
  "/reports/data",
  getStudentMeasurementReportController
);

router.get(
  "/reports/excel",
  downloadStudentMeasurementExcelController
);

router.get(
  "/lookup/mobile",
  getStudentMeasurementsByMobileController
);

router.post(
  "/",
  validate(
    createStudentMeasurementSchema
  ),
  createStudentMeasurementController
);

router.get(
  "/",
  getStudentMeasurementsController
);



router.get(
  "/:id",
  validate(
    studentMeasurementIdSchema
  ),
  getStudentMeasurementByIdController
);

router.patch(
  "/:id",
  validate(
    studentMeasurementIdSchema
  ),
  validate(
    updateStudentMeasurementSchema
  ),
  updateStudentMeasurementController
);

router.delete(
  "/:id",
  validate(
    studentMeasurementIdSchema
  ),
  deleteStudentMeasurementController
);

export default router;