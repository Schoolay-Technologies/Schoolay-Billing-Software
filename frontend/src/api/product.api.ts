import { api } from "./axios";

import type {
  CreateProductInput,
  ProductGender,
  ProductResponse,
  ProductsResponse,
  ProductStatus
} from "../types/product.types";

interface GetProductsParameters {
  schoolId?: string;
  search?: string;
  gender?: ProductGender | "";
  status?: ProductStatus | "";
  page?: number;
  limit?: number;
}

export async function getProducts(
  parameters: GetProductsParameters = {}
): Promise<ProductsResponse> {
  const response = await api.get<ProductsResponse>(
    "/products",
    {
      params: parameters
    }
  );

  return response.data;
}

export async function createProduct(
  input: CreateProductInput
): Promise<ProductResponse> {
  const response = await api.post<ProductResponse>(
    "/products",
    input
  );

  return response.data;
}

export async function updateProductStatus(
  productId: string,
  status: ProductStatus
): Promise<ProductResponse> {
  const response = await api.patch<ProductResponse>(
    `/products/${productId}/status`,
    {
      status
    }
  );

  return response.data;
}