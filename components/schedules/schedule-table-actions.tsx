"use client";

import { useEffect, useState } from "react";
import {
  MoreHorizontal,
  Loader2,
  UserRoundPenIcon,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Schedule } from "@/types/schedule";
import {
  deleteScheduleAction,
  updateScheduleAction,
} from "@/lib/actions/schedule.actions";

const SCHEDULE_COLOR_OPTIONS = [
  "#F472B6",
  "#60A5FA",
  "#34D399",
  "#F59E0B",
  "#A78BFA",
  "#F87171",
  "#06B6D4",
  "#84CC16",
];

export function ScheduleTableActions({ schedule }: { schedule: Schedule }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(schedule.color || "#F472B6");

  useEffect(() => {
    if (editOpen) {
      setSelectedColor(schedule.color || "#F472B6");
    }
  }, [editOpen, schedule.color]);

  async function handleDelete() {
    setIsLoading(true);
    setError(null);

    try {
      const result = await deleteScheduleAction(schedule.id, schedule.staffId);
      if (!result.success) {
        throw new Error(result.error);
      }
      setDeleteOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const dataToUpdate = {
      date,
      startTime,
      endTime,
      color: selectedColor,
    };

    try {
      const result = await updateScheduleAction(
        schedule.id,
        dataToUpdate,
        schedule.staffId,
      );
      if (!result.success) {
        throw new Error(result.error);
      }
      setEditOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
            <span className="sr-only">Abrir menú</span>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>Opciones</DropdownMenuLabel>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setEditOpen(true)}
          >
            <UserRoundPenIcon className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>

          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10 cursor-pointer"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md p-8">
          <DialogHeader>
            <DialogTitle>Editar Turno</DialogTitle>
            <DialogDescription>
              Modifique la fecha u horario del turno.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date-edit" className="text-right font-medium">
                  Fecha
                </Label>
                <Input
                  id="date-edit"
                  name="date"
                  type="date"
                  defaultValue={schedule.date}
                  required
                  className="col-span-3 ml-2"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="startTime-edit"
                  className="text-right font-medium"
                >
                  Hora Inicio
                </Label>
                <Input
                  id="startTime-edit"
                  name="startTime"
                  type="time"
                  defaultValue={schedule.startTime}
                  required
                  className="col-span-3 ml-2"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="endTime-edit"
                  className="text-right font-medium"
                >
                  Hora Fin
                </Label>
                <Input
                  id="endTime-edit"
                  name="endTime"
                  type="time"
                  defaultValue={schedule.endTime}
                  required
                  className="col-span-3 ml-2"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="color-edit" className="text-right font-medium">
                  Color
                </Label>
                <div className="col-span-3 ml-2 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {SCHEDULE_COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Seleccionar color ${color}`}
                        onClick={() => setSelectedColor(color)}
                        className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-105 ${
                          selectedColor === color
                            ? "border-foreground ring-2 ring-rose-200"
                            : "border-border"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      id="color-edit"
                      name="color"
                      type="color"
                      value={selectedColor}
                      onChange={(event) => setSelectedColor(event.target.value)}
                      required
                      className="h-10 w-16 p-1"
                    />
                    <span className="text-sm text-muted-foreground">
                      Color del turno en el calendario
                    </span>
                  </div>
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-500 text-center col-span-4 font-medium px-4">
                  {error}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este turno?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el horario para este día y liberará la
              disponibilidad. No se puede deshacer.
              {error && (
                <p className="text-red-500 mt-2 font-medium">{error}</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
