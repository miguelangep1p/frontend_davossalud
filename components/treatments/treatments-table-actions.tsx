"use client";

import { useState } from "react";
import { Eye, MoreHorizontal, PenIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Treatment } from "@/types/treatment";
import { deleteTreatmentAction } from "@/lib/actions/treatment.actions";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { TreatmentForm } from "./treatment-form";

interface TreatmentsTableActionsProps {
  treatment: Treatment;
}

export function TreatmentsTableActions({
  treatment,
}: TreatmentsTableActionsProps) {
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    setIsLoading(true);
    try {
      await deleteTreatmentAction(treatment.id);
      toast.success("Tratamiento eliminado correctamente");
      setDeleteOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar tratamiento");
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
          <DropdownMenuItem className="cursor-pointer" onClick={() => setEditOpen(true)}>
            <PenIcon className="mr-2 h-4 w-4" />
            Editar
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles del Tratamiento</DialogTitle>
            <DialogDescription>{treatment.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground font-medium">Precio</Label>
              <div className="col-span-3 text-sm pl-4">S/ {Number(treatment.price).toFixed(2)}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground font-medium">Duración</Label>
              <div className="col-span-3 text-sm pl-4">
                {treatment.durationMinutes ? `${treatment.durationMinutes} min` : "Sin definir"}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground font-medium">Estado</Label>
              <div className="col-span-3 text-sm pl-4">
                {treatment.isActive ? "Activo" : "Inactivo"}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground font-medium">Descripción</Label>
              <div className="col-span-3 text-sm pl-4">
                {treatment.description || "Sin descripción"}
              </div>
            </div>
            {treatment.instructions && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right text-muted-foreground font-medium pt-0.5">Instrucciones</Label>
                <div className="col-span-3 text-sm pl-4 whitespace-pre-wrap">{treatment.instructions}</div>
              </div>
            )}
            {treatment.observations && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right text-muted-foreground font-medium pt-0.5">Observaciones</Label>
                <div className="col-span-3 text-sm pl-4 whitespace-pre-wrap">{treatment.observations}</div>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Tratamiento</DialogTitle>
            <DialogDescription>
              Modifique los datos del tratamiento y guarde los cambios.
            </DialogDescription>
          </DialogHeader>
          <TreatmentForm treatment={treatment} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el tratamiento "{treatment.name}".
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
