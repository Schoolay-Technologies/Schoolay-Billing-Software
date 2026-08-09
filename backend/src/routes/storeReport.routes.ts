import {
  Router
} from "express";

import {
  createStoreReportController,
  downloadStoreReportsExcelController,
  getStoreMtdController,
  getStoreReportByIdController,
  getStoreReportsController
} from "../controllers/storeReport.controller.js";

import {
  validate
} from "../middleware/validate.middleware.js";

import {
  createStoreReportSchema,
  storeReportIdSchema
} from "../schemas/storeReport.schema.js";

const router =
  Router();

/*
 * Keep these before /:id.
 */

router.get(
  "/export/excel",
  downloadStoreReportsExcelController
);

router.get(
  "/mtd",
  getStoreMtdController
);

router.post(
  "/",
  validate(
    createStoreReportSchema
  ),
  createStoreReportController
);

router.get(
  "/",
  getStoreReportsController
);

router.get(
  "/:id",
  validate(
    storeReportIdSchema
  ),
  getStoreReportByIdController
);

export default router;