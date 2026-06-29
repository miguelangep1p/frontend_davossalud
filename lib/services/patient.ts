import { Patient, CreatePatientDto, UpdatePatientDto } from "@/types/patient";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function getApiError(response: Response, fallback: string): Promise<string> {
  const error = await response.json().catch(() => null);

  if (Array.isArray(error?.errors) && error.errors.length > 0) {
    return error.errors.join(". ");
  }

  if (Array.isArray(error?.message)) {
    return error.message.join(". ");
  }

  return typeof error?.message === "string" ? error.message : fallback;
}

export async function getPatientsList(token: string): Promise<Patient[]> {
  const response = await fetch(`${BASE_URL}/patients`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401) throw new Error("UNAUTHORIZED");
  if (response.status === 403) throw new Error("No tienes permisos para consultar pacientes");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener la lista de pacientes");
  }

  return response.json();
}

export async function getPatientById(id: string, token: string): Promise<Patient> {
  const response = await fetch(`${BASE_URL}/patients/${id}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401) throw new Error("UNAUTHORIZED");
  if (response.status === 403) throw new Error("No tienes permisos para consultar este paciente");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error al obtener el paciente con ID ${id}`);
  }

  return response.json();
}

export async function searchPatients(query: string, token: string): Promise<Patient[]> {
  const response = await fetch(`${BASE_URL}/patients/search?q=${encodeURIComponent(query)}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401) throw new Error("UNAUTHORIZED");
  if (response.status === 403) throw new Error("No tienes permisos para buscar pacientes");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al buscar pacientes");
  }

  return response.json();
}

export async function createPatient(data: CreatePatientDto, token: string): Promise<Patient> {
  const response = await fetch(`${BASE_URL}/patients`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response.status === 401) throw new Error("UNAUTHORIZED");
  if (response.status === 403) throw new Error("No tienes permisos para crear pacientes");

  if (!response.ok) {
    throw new Error(await getApiError(response, "Error al crear el paciente"));
  }

  return response.json();
}

export async function updatePatient(id: string, data: UpdatePatientDto, token: string): Promise<Patient> {
  const response = await fetch(`${BASE_URL}/patients/${id}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response.status === 401) throw new Error("UNAUTHORIZED");
  if (response.status === 403) throw new Error("No tienes permisos para actualizar este paciente");

  if (!response.ok) {
    throw new Error(
      await getApiError(response, `Error al actualizar el paciente con ID ${id}`),
    );
  }

  return response.json();
}

export async function deletePatient(id: string, token: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/patients/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 401) throw new Error("UNAUTHORIZED");
  if (response.status === 403) throw new Error("No tienes permisos para eliminar este paciente");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error al eliminar el paciente con ID ${id}`);
  }
}
