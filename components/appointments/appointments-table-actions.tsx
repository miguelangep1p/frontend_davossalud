"use client";

import { useState } from "react";
import { Eye, MoreHorizontal, PenIcon, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateAppointmentStatusAction } from "@/lib/actions/appointment.actions";
import { Appointment, AppointmentStatus } from "@/types/appointment";
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

interface AppointmentsTableActionsProps {
  appointment: Appointment;
}

export function AppointmentsTableActions({
  appointment,
}: AppointmentsTableActionsProps) {
  const router = useRouter();
  const [viewOpen, setViewOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setIsLoading(true);
    setError(null);

    try {
      await updateAppointmentStatusAction(appointment.id, {
        status: AppointmentStatus.CANCELLED,
      });
      toast.success("Cita cancelada correctamente");
      setCancelOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al cancelar la cita";
      toast.error(message);
      setError(message);
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

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setViewOpen(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver detalles
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push(`/citas/${appointment.id}/editar`)}
          >
            <PenIcon className="mr-2 h-4 w-4" />
            Editar / Reprogramar
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/10"
            onClick={() => setCancelOpen(true)}
            disabled={appointment.status === AppointmentStatus.CANCELLED}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Cancelar cita
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="p-8 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Detalles de la cita</DialogTitle>
            <DialogDescription>
              Informacion de la cita del {appointment.date}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-muted-foreground">
                Paciente
              </Label>
              <div className="col-span-3 pl-4 text-sm">
                {appointment.patient.firstName} {appointment.patient.lastName}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-muted-foreground">
                Doc.
              </Label>
              <div className="col-span-3 pl-4 text-sm">
                {appointment.patient.document}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-muted-foreground">
                Especialista
              </Label>
              <div className="col-span-3 pl-4 text-sm">
                {appointment.staff?.user
                  ? `${appointment.staff.user.firstName} ${appointment.staff.user.lastName}`
                  : "Sin asignar"}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-muted-foreground">
                Fecha
              </Label>
              <div className="col-span-3 pl-4 text-sm">{appointment.date}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-muted-foreground">
                Horario
              </Label>
              <div className="col-span-3 pl-4 text-sm">
                {appointment.startTime
                  ? `${appointment.startTime} - ${appointment.endTime}`
                  : "Por coordinar"}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-muted-foreground">
                Estado
              </Label>
              <div className="col-span-3 pl-4 text-sm">{appointment.status}</div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Esta seguro de cancelar esta cita?</AlertDialogTitle>
            <AlertDialogDescription>
              La cita pasara a estado &quot;Cancelada&quot;. Esta accion notificara
              al paciente si tuviera un sistema de notificaciones activo.
              {error ? (
                <p className="mt-2 font-medium text-red-500">{error}</p>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cerrar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {isLoading ? "Cancelando..." : "Si, cancelar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
