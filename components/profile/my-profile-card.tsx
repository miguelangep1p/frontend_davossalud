"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateStaffAction } from "@/lib/actions/staff.actions";
import { User } from "@/types/user";

interface Props {
  user: User;
}

export function MyProfileCard({ user }: Props) {
  const router = useRouter();
  const [profilePhoto, setProfilePhoto] = useState(user.staff?.profilePhoto || "");
  const [phone, setPhone] = useState(user.staff?.phone || "");
  const [address, setAddress] = useState(user.staff?.address || "");
  const [specialty, setSpecialty] = useState(user.staff?.specialty || "");
  const [isSaving, setIsSaving] = useState(false);

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` || "DS";

  async function handleSave() {
    if (!user.staff?.id) {
      toast.error("Este usuario no tiene un perfil de personal vinculado.");
      return;
    }

    setIsSaving(true);
    try {
      await updateStaffAction(user.staff.id, {
        profilePhoto: profilePhoto || undefined,
        phone: phone || undefined,
        address: address || undefined,
        specialty: specialty || undefined,
      });
      toast.success("Perfil actualizado correctamente");
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo actualizar el perfil",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="space-y-3">
          <AvatarUpload
            currentUrl={profilePhoto}
            initials={initials}
            onUpload={(url) => setProfilePhoto(url)}
          />
          <div className="max-w-[220px] text-sm text-muted-foreground">
            Sube una foto visible para el sidebar y la ficha del personal.
          </div>
        </div>

        <div className="flex-1 space-y-5">
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Nombres</FieldLabel>
                <Input value={user.firstName} disabled />
              </Field>
              <Field>
                <FieldLabel>Apellidos</FieldLabel>
                <Input value={user.lastName} disabled />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Correo</FieldLabel>
                <Input value={user.email} disabled />
              </Field>
              <Field>
                <FieldLabel>Roles</FieldLabel>
                <Input value={user.roles.join(", ")} disabled />
              </Field>
            </div>

            {user.staff ? (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>Documento</FieldLabel>
                    <Input value={user.staff.document || ""} disabled />
                  </Field>
                  <Field>
                    <FieldLabel>Especialidad</FieldLabel>
                    <Input
                      value={specialty}
                      onChange={(event) => setSpecialty(event.target.value)}
                      placeholder="Especialidad"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>Teléfono</FieldLabel>
                    <Input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="987654321"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Dirección</FieldLabel>
                    <Input
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Av. Principal 123"
                    />
                  </Field>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                Este usuario no tiene una ficha de personal vinculada, por lo que
                la foto de perfil no se puede persistir todavía.
              </div>
            )}
          </FieldGroup>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving || !user.staff?.id}>
              {isSaving ? "Guardando..." : "Guardar perfil"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
