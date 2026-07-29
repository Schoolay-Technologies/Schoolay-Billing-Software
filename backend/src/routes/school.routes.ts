import { Router } from "express";
import { z } from "zod";

import {
  changeSchoolStatusController,
  createSchoolController,
  getSchoolByIdController,
  getSchoolsController,
  updateSchoolController
} from "../controllers/school.controller.js";

import { validate } from "../middleware/validate.middleware.js";

import {
  createSchoolSchema,
  updateSchoolSchema
} from "../schemas/school.schema.js";

const router = Router();

const statusSchema = z.object({
  body: z.object({
    status: z.enum(["ACTIVE", "INACTIVE"])
  })
});

router.post(
  "/",
  validate(createSchoolSchema),
  createSchoolController
);

router.get("/", getSchoolsController);

router.get("/:id", getSchoolByIdController);

router.patch(
  "/:id",
  validate(updateSchoolSchema),
  updateSchoolController
);

router.patch(
  "/:id/status",
  validate(statusSchema),
  changeSchoolStatusController
);

export default router;