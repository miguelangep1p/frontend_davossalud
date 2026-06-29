import { CreateStaffDto, Staff, UpdateStaffDto } from "@/types/staff"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function getStaffList(token: string): Promise<Staff[]> {
  const response = await fetch(`${BASE_URL}/staff`, {
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
    throw new Error(error.message || "Error al obtener la lista de personal")
  }

  return response.json()
}

export async function getStaffById(id: string, token: string): Promise<Staff> {
  const response = await fetch(`${BASE_URL}/staff/${id}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: 'no-store' 
  })

  if (response.status === 401) throw new Error("UNAUTHORIZED")

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Error al obtener el personal con ID ${id}`)
  }

  return response.json()
}

export async function updateStaff(id: string, data: UpdateStaffDto, token: string): Promise<Staff> {
  const response = await fetch(`${BASE_URL}/staff/${id}`, {
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
    throw new Error(error.message || `Error al actualizar el personal con ID ${id}`)
  }

  return response.json()
}

export async function createStaff(data: CreateStaffDto, token: string): Promise<Staff> {
  const response = await fetch(`${BASE_URL}/staff`, {
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
    throw new Error(error.message || "Error al crear el personal")
  }

  return response.json()
}

export async function deleteStaff(id: string, token: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/staff/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (response.status === 401) throw new Error("UNAUTHORIZED")

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Error al eliminar el personal con ID ${id}`)
  }
}
