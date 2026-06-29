import { User } from "@/types/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getUsers(token: string, filters?: { withoutStaff?: boolean }): Promise<User[]> {
  const queryParams = new URLSearchParams();
  if (filters?.withoutStaff) {
    queryParams.append("withoutStaff", "true");
  }

  const response = await fetch(`${BASE_URL}/users?${queryParams.toString()}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: 'no-store'
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener la lista de usuarios");
  }

  return response.json();
}

export async function getUserProfile(token: string) {
  const response = await fetch(`${BASE_URL}/users/profile`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: 'no-store'
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener perfil");
  }

  const data = await response.json();
  return data.user;
}
export async function createUser(token: string, data: any): Promise<User> {
  const response = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al crear el usuario");
  }

  return response.json();
}

export async function updateUser(token: string, id: string, data: any): Promise<User> {
  const response = await fetch(`${BASE_URL}/users/${id}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al actualizar el usuario");
  }

  return response.json();
}

export async function updateUserPassword(token: string, id: string, data: any): Promise<void> {
  const response = await fetch(`${BASE_URL}/users/${id}/password`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al actualizar la contraseña");
  }
}

export async function updateUserEmail(token: string, id: string, data: any): Promise<void> {
  const response = await fetch(`${BASE_URL}/users/${id}/email`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al actualizar el email");
  }
}

export async function deleteUser(token: string, id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/users/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al eliminar el usuario");
  }
}
