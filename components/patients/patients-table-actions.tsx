"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  UserRoundPenIcon,
  Trash2,
  Eye,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Gender, Patient } from "@/types/patient";
import { deletePatientAction } from "@/lib/actions/patient.actions";

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
import { PatientForm } from "./patient-form";
import { toast } from "sonner";

interface PatientsTableActionsProps {
  patient: Patient;
}

function getGenderLabel(gender: Gender) {
  switch (gender) {
    case Gender.FEMALE:
      return "Femenino";
    case Gender.MALE:
      return "Masculino";
    default:
      return "Otro";
  }
}

export function PatientsTableActions({ patient }: PatientsTableActionsProps) {
  const router = useRouter();
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsLoading(true);
    setError(null);

    try {
      await deletePatientAction(patient.id);
      toast.success("Paciente eliminado correctamente");
      setDeleteOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar paciente");
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
            onClick={() => router.push(`/pacientes/${patient.id}`)}
          >
            <User className="mr-2 h-4 w-4 text-primary" />
            Ir a perfil
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setViewOpen(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setEditOpen(true)}
          >
            <UserRoundPenIcon className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/10"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="p-8 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Detalles del paciente</DialogTitle>
            <DialogDescription>
              Información registrada de {patient.firstName} {patient.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-muted-foreground">
                Documento
              </Label>
              <div className="col-span-3 pl-4 text-sm">{patient.document}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-muted-foreground">
                Género
              </Label>
              <div className="col-span-3 pl-4 text-sm">
                {getGenderLabel(patient.gender)}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-muted-foreground">
                Teléfono
              </Label>
              <div className="col-span-3 pl-4 text-sm">{patient.phone}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-muted-foreground">
                F. nac.
              </Label>
              <div className="col-span-3 pl-4 text-sm">{patient.birthDate}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-muted-foreground">
                Dirección
              </Label>
              <div className="col-span-3 pl-4 text-sm">
                {patient.address || "—"}
              </div>
            </div>
            {patient.additionalNote && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="pt-0.5 text-right font-medium text-muted-foreground">
                  Nota
                </Label>
                <div className="col-span-3 whitespace-pre-wrap pl-4 text-sm">
                  {patient.additionalNote}
                </div>
              </div>
            )}
            {patient.allergies && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold text-red-600 dark:text-red-400">
                  Alergias
                </Label>
                <div className="col-span-3 pl-4 text-sm font-medium text-red-600 dark:text-red-400">
                  {patient.allergies}
                </div>
              </div>
            )}
            {patient.chronicDiseases && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold text-red-600 dark:text-red-400">
                  Cond. crónicas
                </Label>
                <div className="col-span-3 pl-4 text-sm font-medium text-red-600 dark:text-red-400">
                  {patient.chronicDiseases}
                </div>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto p-8 sm:max-w-xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold">
              Editar paciente
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Modifique los datos del paciente y guarde los cambios.
            </DialogDescription>
          </DialogHeader>
          <PatientForm patient={patient} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente al
              paciente "{patient.firstName} {patient.lastName}" de los
              registros.
              {error && (
                <p className="mt-2 font-medium text-red-500">{error}</p>
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
