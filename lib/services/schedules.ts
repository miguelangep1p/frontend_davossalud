import { Schedule } from "@/types/schedule"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function getSchedulesByStaffId(staffId: string | undefined, token: string, date?: string): Promise<Schedule[]> {
  const urlParams = new URLSearchParams()
  if (staffId) urlParams.append("staffId", staffId)
  if (date) urlParams.append("date", date)
  const url = `${BASE_URL}/schedules${urlParams.toString() ? `?${urlParams.toString()}` : ""}`
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: 'no-store' 
  })

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED")
  }

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Error al obtener la lista de horarios")
  }

  return response.json()
}

export async function getScheduleById(id: string, token: string): Promise<Schedule> {
  const response = await fetch(`${BASE_URL}/schedules/${id}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: 'no-store' 
  })

  if (response.status === 401) throw new Error("UNAUTHORIZED")

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Error al obtener el horario con ID ${id}`)
  }

  return response.json()
}

export async function createSchedule(data: any, token: string): Promise<Schedule> {
  const response = await fetch(`${BASE_URL}/schedules`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (response.status === 401) throw new Error("UNAUTHORIZED")

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Error al crear el horario")
  }

  return response.json()
}

export async function updateSchedule(id: string, data: Partial<Schedule>, token: string): Promise<Schedule> {
  const response = await fetch(`${BASE_URL}/schedules/${id}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (response.status === 401) throw new Error("UNAUTHORIZED")

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Error al actualizar el horario con ID ${id}`)
  }

  return response.json()
}

export async function deleteSchedule(id: string, token: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/schedules/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (response.status === 401) throw new Error("UNAUTHORIZED")

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Error al eliminar el horario con ID ${id}`)
  }
}
