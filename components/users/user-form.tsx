"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

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

import { createUserAction, updateUserAction } from "@/lib/actions/user.actions";
import { Role, User } from "@/types/user";
import { Switch } from "@/components/ui/switch";
import { showFormErrors } from "@/lib/form-notifications";

const formSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.email("Email inválido"),
  roles: z.array(z.enum(Role)).min(1, "Seleccione al menos un rol"),
  isActive: z.boolean(),
});

interface UserFormProps {
  initialData?: User;
  onSuccess?: () => void;
}

export function UserForm({ initialData, onSuccess }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      email: initialData?.email || "",
      roles: initialData?.roles || [Role.RECEPTIONIST],
      isActive: initialData?.isActive ?? true,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      if (initialData) {
        const updateData = {
          firstName: values.firstName,
          lastName: values.lastName,
          roles: values.roles,
          isActive: values.isActive,
        };
        await updateUserAction(initialData.id, updateData);
        toast.success("Usuario actualizado correctamente");
      } else {
        await createUserAction(values);
        toast.success("Usuario registrado correctamente");
      }
      form.reset();
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al procesar el usuario",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form id="user-registration-form" onSubmit={form.handleSubmit(onSubmit, showFormErrors)} className="space-y-6">
      <FieldGroup>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="firstName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Nombre</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="Ej: Juan"
                  autoComplete="given-name"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="lastName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Apellido</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="Ej: Pérez"
                  autoComplete="family-name"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Correo Electrónico</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                aria-invalid={fieldState.invalid}
                placeholder="juan.perez@ejemplo.com"
                autoComplete="email"
                disabled={!!initialData}
              />
              {!!initialData && (
                <FieldDescription>
                  El correo electrónico no se puede cambiar desde aquí.
                </FieldDescription>
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <Controller
            name="roles"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Rol</FieldLabel>
                <Select 
                  onValueChange={(value) => field.onChange([value])} 
                  defaultValue={field.value[0]}
                >
                  <SelectTrigger id={field.name} data-invalid={fieldState.invalid} className="w-full">
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Role.RECEPTIONIST}>Recepcionista</SelectItem>
                    <SelectItem value={Role.DOCTOR}>Médico</SelectItem>
                    <SelectItem value={Role.ADMIN}>Administrador</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="isActive"
            control={form.control}
            render={({ field }) => (
              <Field className="flex flex-row items-center justify-between rounded-lg border p-2 shadow-sm h-[35px]">
                <FieldLabel className="text-sm font-medium mb-0">
                  Estado Activo
                </FieldLabel>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={!initialData}
                />
              </Field>
            )}
          />
        </div>
      </FieldGroup>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Procesando..." : initialData ? "Actualizar Usuario" : "Registrar Usuario"}
        </Button>
      </div>
    </form>
  );
}
