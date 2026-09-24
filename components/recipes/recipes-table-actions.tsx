"use client";

import { useState } from "react";
import { Download, Eye, MessageCircle, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { deleteRecipeAction } from "@/lib/actions/recipe.actions";
import { Recipe } from "@/types/recipe";

interface RecipesTableActionsProps {
  recipe: Recipe;
}

export function RecipesTableActions({ recipe }: RecipesTableActionsProps) {
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function openPdf() {
    window.open(`/api/recipes/${recipe.id}/pdf`, "_blank", "noopener,noreferrer");
  }

  function openWhatsApp() {
    const phone = recipe.patient.phone?.replace(/\D/g, "");
    if (!phone) {
      toast.error("El paciente no tiene teléfono registrado");
      return;
    }
    // Número peruano: agregar código de país si no lo tiene
    const fullPhone = phone.startsWith("51") ? phone : `51${phone}`;
    const msg = encodeURIComponent(
      `Hola ${recipe.patient.firstName}, le enviamos su receta médica de Davos Salud.\n\nDiagnóstico: ${recipe.diagnosis}\nFecha: ${recipe.prescribedAt}\n\nRecuerde seguir las indicaciones de su médico. ¡Que se mejore pronto!`,
    );
    window.open(`https://wa.me/${fullPhone}?text=${msg}`, "_blank", "noopener,noreferrer");
  }

  async function handleDelete() {
    setIsLoading(true);
    try {
      await deleteRecipeAction(recipe.id);
      toast.success("Receta eliminada correctamente");
      setDeleteOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar receta");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Opciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={() => setViewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={openPdf}>
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer text-green-600 focus:text-green-600" onClick={openWhatsApp}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Enviar WhatsApp
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10 cursor-pointer"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Resumen de receta</DialogTitle>
            <DialogDescription>
              {recipe.patient.firstName} {recipe.patient.lastName} · {recipe.prescribedAt}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <Label className="text-muted-foreground">Paciente</Label>
                <p className="font-medium">
                  {recipe.patient.firstName} {recipe.patient.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{recipe.patient.document}</p>
              </div>
              <div className="rounded-lg border p-4">
                <Label className="text-muted-foreground">Especialista</Label>
                <p className="font-medium">
                  {recipe.staff.user.firstName} {recipe.staff.user.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {recipe.staff.specialty || "Sin especialidad registrada"}
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <Label className="text-muted-foreground">Diagnóstico</Label>
              <p className="font-medium">{recipe.diagnosis}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {recipe.notes || "Sin observaciones adicionales"}
              </p>
            </div>

            <div className="space-y-3">
              {recipe.items.map((item, index) => (
                <div key={item.id} className="rounded-lg border p-4">
                  <p className="font-medium">
                    {index + 1}. {item.medicine}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.presentation} · {item.dosage} · {item.frequency} · {item.duration}
                  </p>
                  <p className="text-sm mt-1">
                    {item.instructions || "Sin indicaciones específicas"}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={openPdf}>
                <Download className="mr-2 h-4 w-4" />
                Abrir PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta receta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la receta registrada para {recipe.patient.firstName} {recipe.patient.lastName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Eliminando..." : "Eliminar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
