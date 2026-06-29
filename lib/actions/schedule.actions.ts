"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "./auth.actions"
import { createSchedule, updateSchedule, deleteSchedule, getSchedulesByStaffId } from "../services/schedules"

export async function createScheduleAction(data: any, staffId: string) {
  try {
    const token = await getSession()
    if (!token) throw new Error("No hay sesión activa")

    const schedule = await createSchedule(data, token)
    
    revalidatePath(`/personal/${staffId}`)
    
    return { success: true, data: schedule }
  } catch (error: any) {
    return { success: false, error: error.message || "Error al crear el horario" }
  }
}

export async function updateScheduleAction(id: string, data: any, staffId: string) {
  try {
    const token = await getSession()
    if (!token) throw new Error("No hay sesión activa")

    const schedule = await updateSchedule(id, data, token)
    
    revalidatePath(`/personal/${staffId}`)
    
    return { success: true, data: schedule }
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar el horario" }
  }
}

export async function deleteScheduleAction(id: string, staffId: string) {
  try {
    const token = await getSession()
    if (!token) throw new Error("No hay sesión activa")

    await deleteSchedule(id, token)
    
    revalidatePath(`/personal/${staffId}`)
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Error al eliminar el horario" }
  }
}

export async function getSchedulesByStaffIdAction(staffId?: string, date?: string) {
  try {
    const token = await getSession()
    if (!token) throw new Error("No hay sesión activa")

    const schedules = await getSchedulesByStaffId(staffId, token, date)
    return { success: true, data: schedules }
  } catch (error: any) {
    return { success: false, error: error.message || "Error al obtener los horarios" }
  }
}
