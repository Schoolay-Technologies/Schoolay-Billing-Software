import { Router } from "express";

import {
  downloadReportExcelController,
  getReportController
} from "../controllers/report.controller.js";

import {
  validate
} from "../middleware/validate.middleware.js";

import {
  reportQuerySchema
} from "../schemas/report.schema.js";

const router = Router();

router.get(
  "/:reportType/excel",
  validate(reportQuerySchema),
  downloadReportExcelController
);

router.get(
  "/:reportType",
  validate(reportQuerySchema),
  getReportController
);

export default router;