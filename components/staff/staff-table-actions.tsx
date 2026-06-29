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
import { Staff } from "@/types/staff";
import { Role } from "@/types/user";
import {
  deleteStaffAction,
  updateStaffAction,
} from "@/lib/actions/staff.actions";

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
import { toast } from "sonner";

interface StaffRowActionsProps {
  staff: Staff;
}

export function StaffTableActions({ staff }: StaffRowActionsProps) {
  const router = useRouter();
  const isDoctor = staff.user?.roles?.includes(Role.DOCTOR);

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsLoading(true);
    setError(null);
    try {
      await deleteStaffAction(staff.id);
      toast.success("Personal eliminado correctamente");
      setDeleteOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo eliminar el personal";
      setError(message);
      toast.error("No se pudo eliminar el personal", { description: message });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const specialty = formData.get("specialty") as string;

    if (phone && !/^\d{9}$/.test(phone)) {
      const message = "El teléfono debe contener exactamente 9 dígitos";
      setError(message);
      toast.error("Revisa los datos ingresados", { description: message });
      setIsLoading(false);
      return;
    }

    const dataToUpdate = {
      phone,
      address,
      specialty,
    };

    try {
      await updateStaffAction(staff.id, dataToUpdate);
      toast.success("Personal actualizado correctamente");
      setEditOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar el personal";
      setError(message);
      toast.error("No se pudo actualizar el personal", { description: message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>Opciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isDoctor && (
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push(`/personal/${staff.id}`)}
            >
              <User className="mr-2 h-4 w-4" /> Ir a Perfil
            </DropdownMenuItem>
          )}
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
            <UserRoundPenIcon className="mr-2 h-4 w-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10 cursor-pointer"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-md p-8">
          <DialogHeader>
            <DialogTitle>Detalles del Personal</DialogTitle>
            <DialogDescription>
              Información de {staff.user.firstName} {staff.user.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Nombre</Label>
              <div className="col-span-3 text-sm pl-4">
                {staff.user.firstName} {staff.user.lastName}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Documento</Label>
              <div className="col-span-3 text-sm pl-4">{staff.document}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Especialidad</Label>
              <div className="col-span-3 text-sm pl-4">
                {staff.specialty || "General"}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Teléfono</Label>
              <div className="col-span-3 text-sm pl-4">
                {staff.phone || "No registrado"}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Dirección</Label>
              <div className="col-span-3 text-sm pl-4">
                {staff.address || "No registrado"}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md p-8">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
              Actualice los datos del miembro del personal. Haga clic en guardar
              cuando termine.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="specialty" className="text-right">
                  Especialidad
                </Label>
                <Input
                  id="specialty"
                  name="specialty"
                  defaultValue={staff.specialty || ""}
                  className="col-span-3 ml-2"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={staff.phone || ""}
                  className="col-span-3 ml-2"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Dirección
                </Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={staff.address || ""}
                  className="col-span-3 ml-2"
                />
              </div>
              {error && (
                <p className="text-sm text-red-500 text-center col-span-4">
                  {error}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
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
            <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              al personal "{staff.user.firstName}".
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
