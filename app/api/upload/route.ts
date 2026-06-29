import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const ALLOWED_ENDPOINTS = new Set([
  "/upload/profile-photo",
  "/upload/medical-record-image",
]);

export async function POST(request: Request) {
  if (!BASE_URL) {
    return NextResponse.json(
      { message: "NEXT_PUBLIC_API_URL no está configurado." },
      { status: 500 },
    );
  }

  const token = (await cookies()).get("auth_token")?.value;
  if (!token) {
    return NextResponse.json(
      { message: "Sesión no disponible para subir archivos." },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const endpoint = formData.get("endpoint");
  const file = formData.get("file");

  if (typeof endpoint !== "string" || !ALLOWED_ENDPOINTS.has(endpoint)) {
    return NextResponse.json(
      { message: "Endpoint de subida no permitido." },
      { status: 400 },
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "No se recibió un archivo válido." },
      { status: 400 },
    );
  }

  const upstreamFormData = new FormData();
  upstreamFormData.append("file", file);

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: upstreamFormData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return NextResponse.json(
      { message: data.message || "No se pudo subir la imagen." },
      { status: response.status },
    );
  }

  const url =
    typeof data.url === "string" && data.url.startsWith("http")
      ? data.url
      : `${BASE_URL}${data.url}`;

  return NextResponse.json({
    ...data,
    url,
  });
}
