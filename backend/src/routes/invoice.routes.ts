import { Router } from "express";

import {
  cancelInvoiceController,
  createInvoiceController,
  getInvoiceByIdController,
  getInvoicesController,
  updateInvoiceController,
  updateInvoiceStatusController
} from "../controllers/invoice.controller.js";

import {
  validate
} from "../middleware/validate.middleware.js";

import {
  cancelInvoiceSchema,
  createInvoiceSchema,
    updateInvoiceSchema,
  updateInvoiceStatusSchema
} from "../schemas/invoice.schema.js";

const router = Router();

router.post(
  "/",
  validate(createInvoiceSchema),
  createInvoiceController
);

router.get(
  "/",
  getInvoicesController
);

router.get(
  "/:id",
  getInvoiceByIdController
);

router.patch(
  "/:id",
  validate(updateInvoiceSchema),
  updateInvoiceController
);

router.patch(
  "/:id/status",
  validate(
    updateInvoiceStatusSchema
  ),
  updateInvoiceStatusController
);

router.patch(
  "/:id/cancel",
  validate(cancelInvoiceSchema),
  cancelInvoiceController
);

export default router;