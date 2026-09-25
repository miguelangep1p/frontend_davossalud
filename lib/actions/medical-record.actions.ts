"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/action-result";
import { getSession } from "@/lib/actions/auth.actions";
import {
  createMedicalRecord,
  deleteMedicalRecord,
  updateMedicalRecord,
} from "@/lib/services/medical-record";
import { CreateMedicalRecordDto, UpdateMedicalRecordDto } from "@/types/medical-record";

export async function createMedicalRecordAction(data: CreateMedicalRecordDto) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");
    const record = await createMedicalRecord(data, token);
    revalidatePath("/historia-clinica");
    return record;
  }, "No se pudo registrar la historia clínica.");
}

export async function updateMedicalRecordAction(id: string, data: UpdateMedicalRecordDto) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");
    const record = await updateMedicalRecord(id, data, token);
    revalidatePath("/historia-clinica");
    return record;
  }, "No se pudo actualizar la historia clínica.");
}

export async function deleteMedicalRecordAction(id: string) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");
    await deleteMedicalRecord(id, token);
    revalidatePath("/historia-clinica");
  }, "No se pudo eliminar la historia clínica.");
}
