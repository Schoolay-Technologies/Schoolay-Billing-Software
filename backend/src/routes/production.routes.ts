import { Router } from "express";

import {
  downloadProductionExcelController,
  getProductionDataController,
  getProductionMatrixController
} from "../controllers/production.controller.js";

import {
  validate
} from "../middleware/validate.middleware.js";

import {
  productionReportQuerySchema
} from "../schemas/production.schema.js";

const router = Router();

router.get(
  "/data",
  validate(
    productionReportQuerySchema
  ),
  getProductionDataController
);

router.get(
  "/matrix",
  validate(
    productionReportQuerySchema
  ),
  getProductionMatrixController
);

router.get(
  "/export/excel",
  validate(
    productionReportQuerySchema
  ),
  downloadProductionExcelController
);

export default router;