"use server";

import { revalidatePath } from "next/cache";

import { runAction } from "@/lib/action-result";
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
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    const newUser = await createUser(token, data);
    revalidatePath("/usuarios");
    return newUser;
  }, "No se pudo registrar el usuario.");
}

export async function updateUserAction(id: string, data: UpdateUserDto) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    const updatedUser = await updateUser(token, id, data);
    revalidatePath("/usuarios");
    return updatedUser;
  }, "No se pudo actualizar el usuario.");
}

export async function updateUserPasswordAction(
  id: string,
  data: { password: string },
) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    await updateUserPassword(token, id, data);
    revalidatePath("/usuarios");
  }, "No se pudo actualizar la contraseña.");
}

export async function updateUserEmailAction(
  id: string,
  data: { email: string },
) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    await updateUserEmail(token, id, data);
    revalidatePath("/usuarios");
  }, "No se pudo actualizar el correo.");
}

export async function deleteUserAction(id: string) {
  return runAction(async () => {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    await deleteUser(token, id);
    revalidatePath("/usuarios");
  }, "No se pudo eliminar el usuario.");
}
