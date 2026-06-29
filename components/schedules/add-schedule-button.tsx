"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createScheduleAction } from "@/lib/actions/schedule.actions";
import { toast } from "sonner";

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

export function AddScheduleButton({ staffId }: { staffId: string }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultColor = "#F472B6";
  const [selectedColor, setSelectedColor] = useState(defaultColor);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;

    if (endTime <= startTime) {
      const message = "La hora de fin debe ser posterior a la hora de inicio";
      setError(message);
      toast.error("Revisa el horario", { description: message });
      setIsLoading(false);
      return;
    }
    const dataToCreate = {
      staffId,
      date,
      startTime,
      endTime,
      color: selectedColor,
    };

    try {
      const result = await createScheduleAction(dataToCreate, staffId);
      if (!result.success) {
        throw new Error(result.error);
      }
      toast.success("Turno registrado correctamente");
      setOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo registrar el turno";
      setError(message);
      toast.error("No se pudo registrar el turno", { description: message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => {
          setSelectedColor(defaultColor);
          setOpen(true);
        }}
        className="shadow-sm"
      >
        <Plus className="h-4 w-4 mr-2" />
        Añadir Turno
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-8">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Turno</DialogTitle>
            <DialogDescription>
              Asigne un nuevo bloque de horario para este médico.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right font-medium">
                  Fecha
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  className="col-span-3 ml-2"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startTime" className="text-right font-medium">
                  Hora Inicio
                </Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  required
                  className="col-span-3 ml-2"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endTime" className="text-right font-medium">
                  Hora Fin
                </Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  required
                  className="col-span-3 ml-2"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="color" className="text-right font-medium">
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
                    id="color"
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
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar Turno"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
