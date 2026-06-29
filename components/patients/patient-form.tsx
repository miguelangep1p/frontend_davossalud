"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPatientAction, updatePatientAction } from "@/lib/actions/patient.actions";
import { BloodType, Gender, Patient } from "@/types/patient";

const formSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  document: z.string().min(5, "El documento debe tener al menos 5 caracteres"),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (YYYY-MM-DD)"),
  gender: z.enum(Gender),
  phone: z
    .string()
    .min(7, "El teléfono debe tener al menos 7 números")
    .max(15, "El teléfono es muy largo"),
  address: z.string().optional().or(z.literal("")),
  profilePhoto: z.string().optional().or(z.literal("")),
  additionalNote: z.string().optional().or(z.literal("")),
  bloodType: z.enum(BloodType).optional().or(z.literal("")),
  allergies: z.string().optional().or(z.literal("")),
  chronicDiseases: z.string().optional().or(z.literal("")),
});

interface PatientFormProps {
  patient?: Patient;
  onSuccess?: () => void;
}

export function PatientForm({ patient, onSuccess }: PatientFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: patient?.firstName || "",
      lastName: patient?.lastName || "",
      document: patient?.document || "",
      birthDate: patient?.birthDate || "",
      gender: patient?.gender || undefined,
      phone: patient?.phone || "",
      address: patient?.address || "",
      profilePhoto: patient?.profilePhoto || "",
      additionalNote: patient?.additionalNote || "",
      bloodType: patient?.bloodType || "",
      allergies: patient?.allergies || "",
      chronicDiseases: patient?.chronicDiseases || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        address: values.address || undefined,
        profilePhoto: values.profilePhoto || undefined,
        additionalNote: values.additionalNote || undefined,
        bloodType: values.bloodType || undefined,
        allergies: values.allergies || undefined,
        chronicDiseases: values.chronicDiseases || undefined,
      };

      if (patient) {
        await updatePatientAction(patient.id, payload);
        toast.success("Paciente actualizado correctamente");
      } else {
        await createPatientAction(payload);
        toast.success("Paciente registrado correctamente");
      }

      onSuccess?.();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Error al procesar la solicitud",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const initials = `${form.watch("firstName")?.[0] || ""}${form.watch("lastName")?.[0] || ""}`.trim() || "PT";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h3 className="border-b pb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Información personal
        </h3>
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
                    initials={initials}
                    onUpload={(url) => field.onChange(url)}
                  />
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">
                      Sube una foto para identificar al paciente.
                    </p>
                    <p>Se aceptan JPG, PNG o WEBP de hasta 15 MB.</p>
                  </div>
                </div>
              </Field>
            )}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Controller
              name="firstName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Nombres</FieldLabel>
                  <Input {...field} id={field.name} placeholder="Juan" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="lastName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Apellidos</FieldLabel>
                  <Input {...field} id={field.name} placeholder="Pérez" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Controller
              name="document"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Documento</FieldLabel>
                  <Input {...field} id={field.name} placeholder="DNI / CE" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="birthDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Fecha de nacimiento</FieldLabel>
                  <Input {...field} id={field.name} type="date" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Controller
              name="gender"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Género</FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Gender.MALE}>Masculino</SelectItem>
                      <SelectItem value={Gender.FEMALE}>Femenino</SelectItem>
                      <SelectItem value={Gender.OTHER}>Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="bloodType"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Grupo sanguíneo</FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(BloodType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Teléfono</FieldLabel>
                  <Input {...field} id={field.name} placeholder="987654321" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="address"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Dirección</FieldLabel>
                  <Input {...field} id={field.name} placeholder="Av. Siempre Viva 123" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <Controller
            name="additionalNote"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Nota adicional</FieldLabel>
                <Textarea
                  {...field}
                  id={field.name}
                  placeholder="Observaciones adicionales del paciente..."
                  rows={3}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>
      </div>

      <div className="space-y-4">
        <h3 className="border-b pb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Información médica
        </h3>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Controller
              name="allergies"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={field.name}
                    className="flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Alergias
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="Penicilina, látex..."
                    className="border-red-200 focus-visible:ring-red-400 dark:border-red-900"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="chronicDiseases"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={field.name}
                    className="flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Condiciones crónicas
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="Diabetes, hipertensión..."
                    className="border-red-200 focus-visible:ring-red-400 dark:border-red-900"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
        </FieldGroup>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Procesando..." : patient ? "Guardar cambios" : "Registrar paciente"}
        </Button>
      </div>
    </form>
  );
}
