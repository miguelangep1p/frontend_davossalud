import {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentStatusDto,
  RescheduleAppointmentDto,
} from "@/types/appointment";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getAppointmentsList(
  token: string,
  params?: { date?: string; staffId?: string; status?: string }
): Promise<Appointment[]> {
  if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL no estA configurada");
  }

  const urlParams = new URLSearchParams();
  if (params?.date) urlParams.append("date", params.date);
  if (params?.staffId) urlParams.append("staffId", params.staffId);
  if (params?.status) urlParams.append("status", params.status);

  const url = `${BASE_URL}/appointments${
    urlParams.toString() ? `?${urlParams.toString()}` : ""
  }`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401) throw new Error("UNAUTHORIZED");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener la lista de citas");
  }

  return response.json();
}

export async function createAppointment(
  data: CreateAppointmentDto,
  token: string
): Promise<Appointment> {
  if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL no estA configurada");
  }

  const response = await fetch(`${BASE_URL}/appointments`, {
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
    throw new Error(error.message || "Error al crear la cita");
  }

  return response.json();
}

export async function updateAppointmentStatus(
  id: string,
  data: UpdateAppointmentStatusDto,
  token: string
): Promise<Appointment> {
  if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL no estA configurada");
  }

  const response = await fetch(`${BASE_URL}/appointments/${id}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response.status === 401) throw new Error("UNAUTHORIZED");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Error al actualizar el estado de la cita con ID ${id}`
    );
  }

  return response.json();
}

export async function rescheduleAppointment(
  id: string,
  data: RescheduleAppointmentDto,
  token: string
): Promise<Appointment> {
  if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL no estA configurada");
  }

  const response = await fetch(`${BASE_URL}/appointments/${id}/reschedule`, {
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
    throw new Error(
      error.message || `Error al reprogramar la cita con ID ${id}`
    );
  }

  return response.json();
}
