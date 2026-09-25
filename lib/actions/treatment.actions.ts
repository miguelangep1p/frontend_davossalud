"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/action-result";
import { getSession } from "@/lib/actions/auth.actions";
import {
  createTreatment,
  deleteTreatment,
  updateTreatment,
} from "@/lib/services/treatment";
import { CreateTreatmentDto, UpdateTreatmentDto } from "@/types/treatment";

export async function createTreatmentAction(data: CreateTreatmentDto) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    const treatment = await createTreatment(data, token);
    revalidatePath("/tratamientos");
    return treatment;
  }, "No se pudo registrar el tratamiento.");
}

export async function updateTreatmentAction(
  id: string,
  data: UpdateTreatmentDto,
) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    const treatment = await updateTreatment(id, data, token);
    revalidatePath("/tratamientos");
    return treatment;
  }, "No se pudo actualizar el tratamiento.");
}

export async function deleteTreatmentAction(id: string) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    await deleteTreatment(id, token);
    revalidatePath("/tratamientos");
  }, "No se pudo eliminar el tratamiento.");
}
