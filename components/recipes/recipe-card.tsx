"use client";

import { useState } from "react";
import { Download, Loader2, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteRecipeAction } from "@/lib/actions/recipe.actions";
import { Recipe } from "@/types/recipe";
import { Button } from "@/components/ui/button";

interface RecipeCardProps {
  recipe: Recipe;
  onDeleted?: () => void;
}

export function RecipeCard({ recipe, onDeleted }: RecipeCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function openPdf() {
    window.open(`/api/recipes/${recipe.id}/pdf`, "_blank", "noopener,noreferrer");
  }

  function openWhatsApp() {
    const phone = recipe.patient?.phone?.replace(/\D/g, "");
    if (!phone) {
      toast.error("El paciente no tiene teléfono registrado");
      return;
    }
    // Peruvian numbers: add the country code when missing.
    const fullPhone = phone.startsWith("51") ? phone : `51${phone}`;
    const message = encodeURIComponent(
      `Hola ${recipe.patient.firstName}, le enviamos su receta médica de Davos Salud.\n\nDiagnóstico: ${recipe.diagnosis}\nFecha: ${recipe.prescribedAt}\n\nRecuerde seguir las indicaciones de su médico. ¡Que se mejore pronto!`,
    );
    window.open(`https://wa.me/${fullPhone}?text=${message}`, "_blank", "noopener,noreferrer");
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteRecipeAction(recipe.id);
    setDeleting(false);
    if (!result.success) {
      toast.error("No se pudo eliminar la receta", { description: result.error });
      return;
    }
    toast.success("Receta eliminada");
    onDeleted?.();
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{recipe.diagnosis}</p>
          <p className="text-xs text-muted-foreground">
            {recipe.items.length} medicamento{recipe.items.length !== 1 ? "s" : ""}
            {recipe.notes ? ` · ${recipe.notes}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" onClick={openPdf}>
            <Download className="size-3.5" />
            PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-green-700 hover:text-green-700"
            onClick={openWhatsApp}
          >
            <MessageCircle className="size-3.5" />
            WhatsApp
          </Button>
          {confirmDelete ? (
            <>
              <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Eliminar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                No
              </Button>
            </>
          ) : (
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Eliminar receta"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
      <ol className="divide-y text-sm">
        {recipe.items.map((item, index) => (
          <li key={item.id} className="flex gap-3 px-4 py-2.5">
            <span className="font-semibold text-primary">{index + 1}.</span>
            <div className="min-w-0">
              <p className="font-medium">
                {item.medicine} <span className="font-normal text-muted-foreground">· {item.presentation}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {item.dosage} · {item.frequency} · {item.duration}
                {item.instructions ? ` · ${item.instructions}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
