import { Router } from "express";

import {
  changeProductStatusController,
  createProductController,
  getProductByIdController,
  getProductsController,
  updateProductController
} from "../controllers/product.controller.js";

import { validate } from "../middleware/validate.middleware.js";

import {
  createProductSchema,
  productStatusSchema,
  updateProductSchema
} from "../schemas/product.schema.js";

const router = Router();

router.post(
  "/",
  validate(createProductSchema),
  createProductController
);

router.get("/", getProductsController);

router.get("/:id", getProductByIdController);

router.patch(
  "/:id",
  validate(updateProductSchema),
  updateProductController
);

router.patch(
  "/:id/status",
  validate(productStatusSchema),
  changeProductStatusController
);

export default router;