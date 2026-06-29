"use client";

export async function uploadImageFile(
  endpoint: "/upload/profile-photo" | "/upload/medical-record-image",
  file: File,
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("endpoint", endpoint);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "No se pudo subir la imagen.");
  }

  return response.json();
}
