"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/action-result";
import { getSession } from "@/lib/actions/auth.actions";
import { createRecipe, deleteRecipe, getRecipesList } from "@/lib/services/recipe";
import { CreateRecipeDto } from "@/types/recipe";

export async function createRecipeAction(data: CreateRecipeDto) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    const recipe = await createRecipe(data, token);
    revalidatePath("/historia-clinica");
    return recipe;
  }, "No se pudo registrar la receta.");
}

export async function deleteRecipeAction(id: string) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    await deleteRecipe(id, token);
    revalidatePath("/historia-clinica");
  }, "No se pudo eliminar la receta.");
}

export async function getMedicalRecordRecipesAction(medicalRecordId: string) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    return getRecipesList(token, { medicalRecordId });
  }, "No se pudieron cargar las recetas.");
}
