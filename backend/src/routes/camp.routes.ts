import {
  Router
} from "express";

import {
  activateCampController,
  closeCampController,
  createCampController,
  deleteCampController,
  generateCampQrCodeController,
  getCampByIdController,
  getCampsController,
  getPublicCampController,
  submitPublicCampOrderController,
  updateCampController
} from "../controllers/camp.controller.js";

import {
  validate
} from "../middleware/validate.middleware.js";

import {
  campIdSchema,
  campTokenSchema,
  createCampSchema,
  publicCampOrderSchema,
  updateCampSchema
} from "../schemas/camp.schema.js";

const router =
  Router();

/*
 * Public routes must be placed before "/:id".
 * Otherwise Express may treat "public"
 * as a camp ID.
 */

router.get(
  "/public/:token",
  validate(
    campTokenSchema
  ),
  getPublicCampController
);

router.post(
  "/public/:token/orders",
  validate(
    publicCampOrderSchema
  ),
  submitPublicCampOrderController
);

/*
 * Admin routes
 */

router.post(
  "/",
  validate(
    createCampSchema
  ),
  createCampController
);

router.get(
  "/",
  getCampsController
);

router.patch(
  "/:id/activate",
  validate(
    campIdSchema
  ),
  activateCampController
);

router.patch(
  "/:id/close",
  validate(
    campIdSchema
  ),
  closeCampController
);

router.get(
  "/:id/qr",
  validate(
    campIdSchema
  ),
  generateCampQrCodeController
);

router.get(
  "/:id",
  validate(
    campIdSchema
  ),
  getCampByIdController
);

router.patch(
  "/:id",
  validate(
    campIdSchema
  ),
  validate(
    updateCampSchema
  ),
  updateCampController
);

router.delete(
  "/:id",
  validate(
    campIdSchema
  ),
  deleteCampController
);

export default router;