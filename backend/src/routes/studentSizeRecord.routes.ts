import { Router } from "express";

import {
  createStudentSizeRecordController,
  deleteStudentSizeRecordController,
  downloadStudentSizeExcelController,
  getStudentSizeRecordByIdController,
  getStudentSizeRecordsController,
  getStudentSizeReportController,
  updateStudentSizeRecordController
} from "../controllers/studentSizeRecord.controller.js";

import {
  validate
} from "../middleware/validate.middleware.js";

import {
  createStudentSizeRecordSchema,
  studentSizeRecordIdSchema,
  updateStudentSizeRecordSchema
} from "../schemas/studentSizeRecord.schema.js";

const router = Router();

/*
 * These routes must appear before "/:id".
 * Otherwise Express may treat "reports" as a record ID.
 */
router.get(
  "/reports/data",
  getStudentSizeReportController
);

router.get(
  "/reports/excel",
  downloadStudentSizeExcelController
);

router.post(
  "/",
  validate(
    createStudentSizeRecordSchema
  ),
  createStudentSizeRecordController
);

router.get(
  "/",
  getStudentSizeRecordsController
);

router.get(
  "/:id",
  validate(
    studentSizeRecordIdSchema
  ),
  getStudentSizeRecordByIdController
);

router.patch(
  "/:id",
  validate(
    studentSizeRecordIdSchema
  ),
  validate(
    updateStudentSizeRecordSchema
  ),
  updateStudentSizeRecordController
);

router.delete(
  "/:id",
  validate(
    studentSizeRecordIdSchema
  ),
  deleteStudentSizeRecordController
);

export default router;