"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "./auth.actions";
import { getUsers, createUser, updateUser, deleteUser, updateUserPassword, updateUserEmail, getUserProfile } from "../services/user";
import { CreateUserDto, UpdateUserDto } from "@/types/user";

export async function getUsersAction(filters?: { withoutStaff?: boolean }) {
  const token = await getSession();
  if (!token) throw new Error("UNAUTHORIZED");
  return await getUsers(token, filters);
}

export async function getUserProfileAction() {
  const token = await getSession();
  if (!token) return null;
  
  try {
    return await getUserProfile(token);
  } catch {
    return null;
  }
}

export async function createUserAction(data: CreateUserDto) {
  const token = await getSession();
  if (!token) throw new Error("UNAUTHORIZED");

  const newUser = await createUser(token, data);
  revalidatePath("/usuarios");
  return newUser;
}

export async function updateUserAction(id: string, data: UpdateUserDto) {
  const token = await getSession();
  if (!token) throw new Error("UNAUTHORIZED");

  const updatedUser = await updateUser(token, id, data);
  revalidatePath("/usuarios");
  return updatedUser;
}

export async function updateUserPasswordAction(
  id: string,
  data: { password: string },
) {
  const token = await getSession();
  if (!token) throw new Error("UNAUTHORIZED");

  await updateUserPassword(token, id, data);
  revalidatePath("/usuarios");
}

export async function updateUserEmailAction(
  id: string,
  data: { email: string },
) {
  const token = await getSession();
  if (!token) throw new Error("UNAUTHORIZED");

  await updateUserEmail(token, id, data);
  revalidatePath("/usuarios");
}

export async function deleteUserAction(id: string) {
  const token = await getSession();
  if (!token) throw new Error("UNAUTHORIZED");

  await deleteUser(token, id);
  revalidatePath("/usuarios");
}
