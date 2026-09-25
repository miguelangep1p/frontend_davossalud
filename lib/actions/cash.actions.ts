"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/action-result";
import { getSession } from "@/lib/actions/auth.actions";
import {
  createCashEntry,
  deleteCashEntry,
  updateCashEntry,
} from "@/lib/services/cash";
import { CreateCashEntryDto, UpdateCashEntryDto } from "@/types/cash";

export async function createCashEntryAction(data: CreateCashEntryDto) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");
    const entry = await createCashEntry(data, token);
    revalidatePath("/caja");
    return entry;
  }, "No se pudo registrar el movimiento de caja.");
}

export async function updateCashEntryAction(id: string, data: UpdateCashEntryDto) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");
    const entry = await updateCashEntry(id, data, token);
    revalidatePath("/caja");
    return entry;
  }, "No se pudo actualizar el movimiento de caja.");
}

export async function deleteCashEntryAction(id: string) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");
    await deleteCashEntry(id, token);
    revalidatePath("/caja");
  }, "No se pudo eliminar el movimiento de caja.");
}
