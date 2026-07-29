import { Router } from "express";

import {
  getOrderTrackingByInvoiceIdController,
  getOrderTrackingListController,
  updateDistributionController,
} from "../controllers/orderTracking.controller.js";

import {
  validate
} from "../middleware/validate.middleware.js";

import {
  updateDistributionSchema,
} from "../schemas/orderTracking.schema.js";

const router = Router();

router.get(
  "/",
  getOrderTrackingListController
);

router.get(
  "/:invoiceId",
  getOrderTrackingByInvoiceIdController
);

router.patch(
  "/:invoiceId/distribution",
  validate(updateDistributionSchema),
  updateDistributionController
);


export default router;