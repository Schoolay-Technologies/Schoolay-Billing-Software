import type {
  NextFunction,
  Request,
  Response
} from "express";

import type {
  CreateProductInput,
  UpdateProductInput
} from "../schemas/product.schema.js";

import {
  changeProductStatus,
  createProduct,
  getProductById,
  getProducts,
  updateProduct
} from "../services/product.service.js";

export async function createProductController(
  request: Request<object, object, CreateProductInput>,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const product = await createProduct(request.body);

    response.status(201).json({
      success: true,
      message: "Product created successfully.",
      data: product
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductsController(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId =
      typeof request.query.schoolId === "string"
        ? request.query.schoolId
        : undefined;

    const search =
      typeof request.query.search === "string"
        ? request.query.search
        : undefined;

    const rawGender =
      typeof request.query.gender === "string"
        ? request.query.gender
        : undefined;

    const gender =
      rawGender === "MALE" ||
      rawGender === "FEMALE" ||
      rawGender === "UNISEX"
        ? rawGender
        : undefined;

    const rawStatus =
      typeof request.query.status === "string"
        ? request.query.status
        : undefined;

    const status =
      rawStatus === "ACTIVE" ||
      rawStatus === "INACTIVE"
        ? rawStatus
        : undefined;

    const page = Number(request.query.page) || 1;
    const limit = Number(request.query.limit) || 10;

    const result = await getProducts({
      schoolId,
      search,
      gender,
      status,
      page,
      limit
    });

    response.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductByIdController(
  request: Request<{ id: string }>,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const product = await getProductById(
      request.params.id
    );

    response.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProductController(
  request: Request<
    { id: string },
    object,
    UpdateProductInput
  >,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const product = await updateProduct(
      request.params.id,
      request.body
    );

    response.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: product
    });
  } catch (error) {
    next(error);
  }
}

export async function changeProductStatusController(
  request: Request<
    { id: string },
    object,
    { status: "ACTIVE" | "INACTIVE" }
  >,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const product = await changeProductStatus(
      request.params.id,
      request.body.status
    );

    response.status(200).json({
      success: true,
      message: `Product marked as ${request.body.status.toLowerCase()}.`,
      data: product
    });
  } catch (error) {
    next(error);
  }
}