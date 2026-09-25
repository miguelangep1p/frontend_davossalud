"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/action-result";
import { getSession } from "@/lib/actions/auth.actions";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/lib/services/product";
import { CreateProductDto, UpdateProductDto } from "@/types/product";

export async function createProductAction(data: CreateProductDto) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    const product = await createProduct(data, token);
    revalidatePath("/productos");
    return product;
  }, "No se pudo registrar el producto.");
}

export async function updateProductAction(id: string, data: UpdateProductDto) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    const product = await updateProduct(id, data, token);
    revalidatePath("/productos");
    return product;
  }, "No se pudo actualizar el producto.");
}

export async function deleteProductAction(id: string) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    await deleteProduct(id, token);
    revalidatePath("/productos");
  }, "No se pudo eliminar el producto.");
}
