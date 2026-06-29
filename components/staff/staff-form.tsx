"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as z from "zod";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createStaffAction } from "@/lib/actions/staff.actions";
import { getUsersAction } from "@/lib/actions/user.actions";
import { User } from "@/types/auth";

const formSchema = z.object({
  userId: z.string().min(1, "El usuario es requerido"),
  document: z
    .string()
    .min(1, "El documento es requerido")
    .regex(/^\d{8}$/, "El documento debe tener exactamente 8 numeros"),
  phone: z
    .string()
    .regex(/^\d{9}$/, "El telefono debe tener exactamente 9 numeros")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  profilePhoto: z.string().optional(),
  specialty: z.string().optional(),
});

interface StaffFormProps {
  onSuccess?: () => void;
}

export function StaffForm({ onSuccess }: StaffFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      document: "",
      phone: "",
      address: "",
      profilePhoto: "",
      specialty: "",
    },
  });

  useEffect(() => {
    async function fetchUsers() {
      try {
        const availableUsers = await getUsersAction({ withoutStaff: true });
        setUsers(availableUsers);
      } catch {
        toast.error("Error al cargar los usuarios disponibles");
      }
    }

    void fetchUsers();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await createStaffAction(values);
      toast.success("Personal registrado correctamente");
      form.reset();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Error al registrar el personal",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      id="staff-registration-form"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <FieldGroup>
        <Controller
          name="profilePhoto"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Foto de perfil</FieldLabel>
              <div className="flex items-center gap-4 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
                <AvatarUpload
                  currentUrl={field.value}
                  initials="DS"
                  onUpload={(url) => field.onChange(url)}
                />
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Sube una foto para el perfil del especialista.
                  </p>
                  <p>Se aceptan JPG, PNG o WEBP de hasta 15 MB.</p>
                </div>
              </div>
            </Field>
          )}
        />

        <Controller
          name="userId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Usuario</FieldLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger
                  id={field.name}
                  data-invalid={fieldState.invalid}
                  className="w-full"
                >
                  <SelectValue placeholder="Seleccione un usuario" />
                </SelectTrigger>
                <SelectContent>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No hay usuarios disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FieldDescription>
                Solo se muestran usuarios que aun no tienen personal asignado.
              </FieldDescription>
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Controller
          name="document"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Documento de identidad</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="Ej: 12345678"
                autoComplete="off"
                maxLength={8}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "");
                  field.onChange(value);
                }}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Controller
            name="phone"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Telefono</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="Ej: 987654321"
                  maxLength={9}
                  onChange={(event) => {
                    const value = event.target.value.replace(/\D/g, "");
                    field.onChange(value);
                  }}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />

          <Controller
            name="specialty"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Especialidad</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="Ej: Cardiologia"
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
        </div>

        <Controller
          name="address"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Direccion</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="Av. Principal 123"
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />
      </FieldGroup>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Registrando..." : "Registrar personal"}
        </Button>
      </div>
    </form>
  );
}
