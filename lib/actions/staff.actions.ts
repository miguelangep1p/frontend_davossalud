"use server";

import { revalidatePath } from "next/cache";
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
  const token = await getSession();
  if (!token) throw new Error("UNAUTHORIZED");
  
  const updatedStaff = await updateStaff(id, data, token);
  revalidatePath("/personal");
  return updatedStaff;
}

export async function createStaffAction(data: CreateStaffDto) {
  const token = await getSession();
  if (!token) throw new Error("UNAUTHORIZED");

  const newStaff = await createStaff(data, token);
  revalidatePath("/personal");
  return newStaff;
}

export async function deleteStaffAction(id: string) {
  const token = await getSession();
  if (!token) throw new Error("UNAUTHORIZED");

  await deleteStaff(id, token);
  revalidatePath("/personal");
}
