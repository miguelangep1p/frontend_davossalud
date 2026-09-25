import { CreateRecipeDto, Recipe } from "@/types/recipe";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getRecipesList(
  token: string,
  params?: { medicalRecordId?: string },
): Promise<Recipe[]> {
  const query = params?.medicalRecordId
    ? `?medicalRecordId=${encodeURIComponent(params.medicalRecordId)}`
    : "";
  const response = await fetch(`${BASE_URL}/recipes${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401) throw new Error("UNAUTHORIZED");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener la lista de recetas");
  }

  return response.json();
}

export async function createRecipe(
  data: CreateRecipeDto,
  token: string,
): Promise<Recipe> {
  const response = await fetch(`${BASE_URL}/recipes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response.status === 401) throw new Error("UNAUTHORIZED");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al crear la receta");
  }

  return response.json();
}

export async function deleteRecipe(id: string, token: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/recipes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 401) throw new Error("UNAUTHORIZED");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al eliminar la receta");
  }
}
