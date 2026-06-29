"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { uploadImageFile } from "@/lib/client-upload";

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === "File too large") {
    return "La imagen excede el límite permitido de 15 MB.";
  }

  return error instanceof Error ? error.message : "Error al subir la foto";
}

interface Props {
  currentUrl?: string | null;
  initials?: string;
  onUpload?: (url: string) => void;
  className?: string;
}

export function AvatarUpload({ currentUrl, initials = "?", onUpload, className }: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local inmediato
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    // Upload al backend
    setIsUploading(true);
    try {
      const data = await uploadImageFile("/upload/profile-photo", file);
      setPreview(data.url);
      onUpload?.(data.url);
      toast.success("Foto actualizada correctamente");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
      setPreview(currentUrl || null);
    } finally {
      setIsUploading(false);
      // Reset input para permitir subir el mismo archivo de nuevo
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("relative inline-block", className)}>
      <Avatar className="size-24 ring-2 ring-border">
        {preview ? (
          <AvatarImage src={preview} alt="Foto de perfil" />
        ) : null}
        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
          {initials.slice(0, 2).toUpperCase() || <User className="size-8" />}
        </AvatarFallback>
      </Avatar>

      {/* Botón de cámara */}
      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-md ring-2 ring-background",
          "hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        )}
        aria-label="Cambiar foto de perfil"
      >
        {isUploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Camera className="size-4" />
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpg,image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
      />
    </div>
  );
}
