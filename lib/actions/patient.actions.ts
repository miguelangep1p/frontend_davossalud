"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/action-result";
import { getPatientById, createPatient, updatePatient, deletePatient } from "@/lib/services/patient";
import { getSession } from "@/lib/actions/auth.actions";
import { CreatePatientDto, UpdatePatientDto } from "@/types/patient";
import { getPatientsList } from "@/lib/services/patient";

export async function getPatientsAction() {
  const token = await getSession();
  if (!token) throw new Error("UNAUTHORIZED");
  return await getPatientsList(token);
}

export async function getPatientByIdAction(id: string) {
  const token = await getSession();
  if (!token) throw new Error("UNAUTHORIZED");
  return await getPatientById(id, token);
}

export async function createPatientAction(data: CreatePatientDto) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    const newPatient = await createPatient(data, token);
    revalidatePath("/pacientes");
    return newPatient;
  }, "No se pudo registrar el paciente.");
}

export async function updatePatientAction(id: string, data: UpdatePatientDto) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    const updatedPatient = await updatePatient(id, data, token);
    revalidatePath("/pacientes");
    revalidatePath(`/pacientes/${id}`);
    return updatedPatient;
  }, "No se pudo actualizar el paciente.");
}

export async function deletePatientAction(id: string) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    await deletePatient(id, token);
    revalidatePath("/pacientes");
  }, "No se pudo eliminar el paciente.");
}
