"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/action-result";
import { getStaffById, getStaffList, updateStaff, deleteStaff, createStaff } from "@/lib/services/staff";
import { getSession } from "@/lib/actions/auth.actions";
import { CreateStaffDto, UpdateStaffDto } from "@/types/staff";

export async function getStaffListAction() {
  const token = await getSession();
  if (!token) throw new Error("UNAUTHORIZED");
  return await getStaffList(token);
}

export async function getStaffByIdAction(id: string) {
  const token = await getSession();
  if (!token) throw new Error("UNAUTHORIZED");
  return await getStaffById(id, token);
}

export async function updateStaffAction(id: string, data: UpdateStaffDto) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    const updatedStaff = await updateStaff(id, data, token);
    revalidatePath("/personal");
    return updatedStaff;
  }, "No se pudo actualizar el personal.");
}

export async function createStaffAction(data: CreateStaffDto) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    const newStaff = await createStaff(data, token);
    revalidatePath("/personal");
    return newStaff;
  }, "No se pudo registrar el personal.");
}

export async function deleteStaffAction(id: string) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    await deleteStaff(id, token);
    revalidatePath("/personal");
  }, "No se pudo eliminar el personal.");
}
