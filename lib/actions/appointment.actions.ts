"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/actions/auth.actions";
import { ActionResult, toErrorMessage } from "@/lib/action-result";
import {
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  getAppointmentsList,
} from "@/lib/services/appointment";
import {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentStatusDto,
  RescheduleAppointmentDto,
} from "@/types/appointment";

export type AppointmentActionResult = ActionResult<Appointment>;

const BACKEND_MESSAGES: Record<string, string> = {
  "Cannot create or reschedule appointments to a past date":
    "No se pueden agendar citas en una fecha pasada.",
  "Appointment must be between 07:00 and 22:00":
    "La cita debe estar entre las 07:00 y las 22:00.",
  "This time slot overlaps with another confirmed appointment":
    "Ese horario ya está ocupado por otra cita confirmada.",
  "Patient not found": "No se encontró el paciente.",
  "Staff not found": "No se encontró el especialista.",
  "Appointment not found": "No se encontró la cita.",
  "Cannot reschedule this appointment": "Esta cita ya no se puede reprogramar.",
  "Doctor user is not associated with any staff profile":
    "Tu usuario no está vinculado a un perfil de especialista.",
};

function toErrorResult(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  return {
    success: false as const,
    error: BACKEND_MESSAGES[message] ?? toErrorMessage(error, fallback),
  };
}

export async function createAppointmentAction(
  data: CreateAppointmentDto
): Promise<AppointmentActionResult> {
  try {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    const newAppointment = await createAppointment(data, token);
    revalidatePath("/citas");
    return { success: true, data: newAppointment };
  } catch (error: unknown) {
    return toErrorResult(error, "No se pudo registrar la cita.");
  }
}

export async function updateAppointmentStatusAction(
  id: string,
  data: UpdateAppointmentStatusDto
): Promise<AppointmentActionResult> {
  try {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    const updatedAppointment = await updateAppointmentStatus(id, data, token);
    revalidatePath("/citas");
    revalidatePath(`/citas/${id}`);
    return { success: true, data: updatedAppointment };
  } catch (error: unknown) {
    return toErrorResult(error, "No se pudo actualizar la cita.");
  }
}

export async function rescheduleAppointmentAction(
  id: string,
  data: RescheduleAppointmentDto
): Promise<AppointmentActionResult> {
  try {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    const rescheduledAppointment = await rescheduleAppointment(id, data, token);
    revalidatePath("/citas");
    revalidatePath(`/citas/${id}`);
    return { success: true, data: rescheduledAppointment };
  } catch (error: unknown) {
    return toErrorResult(error, "No se pudo reprogramar la cita.");
  }
}

export async function getAppointmentsListAction(params?: { date?: string; staffId?: string; status?: string }) {
  try {
    const token = await getSession();
    if (!token) throw new Error("UNAUTHORIZED");

    const appointments = await getAppointmentsList(token, params);
    return { success: true, data: appointments };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al obtener citas" };
  }
}
