"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginCredentials } from "@/types/auth";

const SESSION_COOKIE_NAME = "auth_token";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function createSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSession() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function login(credentials: LoginCredentials) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al iniciar sesion");
  }

  const data = await response.json();
  await createSession(data.access_token);
}

export async function logout() {
  const token = await getSession();

  if (token) {
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch {
      // El cierre local de sesion es suficiente para el frontend.
    }
  }

  await deleteSession();
  redirect("/login");
}
