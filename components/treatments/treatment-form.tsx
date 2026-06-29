"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { showFormErrors } from "@/lib/form-notifications";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  createTreatmentAction,
  updateTreatmentAction,
} from "@/lib/actions/treatment.actions";
import { Treatment } from "@/types/treatment";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional().or(z.literal("")),
  durationMinutes: z.coerce.number().min(0).optional(),
  price: z.coerce.number().min(0, "El precio debe ser positivo"),
  instructions: z.string().optional().or(z.literal("")),
  observations: z.string().optional().or(z.literal("")),
  isActive: z.boolean(),
});

interface TreatmentFormProps {
  treatment?: Treatment;
  onSuccess?: () => void;
}

export function TreatmentForm({ treatment, onSuccess }: TreatmentFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<
    z.input<typeof formSchema>,
    unknown,
    z.output<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: treatment?.name || "",
      description: treatment?.description || "",
      durationMinutes: treatment?.durationMinutes ?? 0,
      price: Number(treatment?.price || 0),
      instructions: treatment?.instructions || "",
      observations: treatment?.observations || "",
      isActive: treatment?.isActive ?? true,
    },
  });

  async function onSubmit(values: z.output<typeof formSchema>) {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        description: values.description || undefined,
        durationMinutes: values.durationMinutes || undefined,
        instructions: values.instructions || undefined,
        observations: values.observations || undefined,
      };

      if (treatment) {
        await updateTreatmentAction(treatment.id, payload);
        toast.success("Tratamiento actualizado correctamente");
      } else {
        await createTreatmentAction(payload);
        toast.success("Tratamiento registrado correctamente");
      }

      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Error al procesar el tratamiento");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit, showFormErrors)} className="space-y-6">
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Nombre</FieldLabel>
              <Input {...field} id={field.name} placeholder="Limpieza facial" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Descripción</FieldLabel>
              <Input {...field} id={field.name} placeholder="Detalle del tratamiento" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="durationMinutes"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Duración (min)</FieldLabel>
                <Input
                  id={field.name}
                  type="number"
                  min={0}
                  value={Number(field.value ?? 0)}
                  onChange={field.onChange}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="price"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Precio (S/)</FieldLabel>
                <Input
                  id={field.name}
                  type="number"
                  min={0}
                  step="0.01"
                  value={Number(field.value ?? 0)}
                  onChange={field.onChange}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* Instrucciones */}
        <Controller
          name="instructions"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Instrucciones</FieldLabel>
              <Textarea
                {...field}
                id={field.name}
                placeholder="Pasos o instrucciones del tratamiento para el paciente..."
                rows={3}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Observaciones */}
        <Controller
          name="observations"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Observaciones</FieldLabel>
              <Textarea
                {...field}
                id={field.name}
                placeholder="Observaciones clínicas o contraindicaciones..."
                rows={3}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="isActive"
          control={form.control}
          render={({ field }) => (
            <div className="flex items-center space-x-2">
              <Switch
                id={field.name}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <FieldLabel htmlFor={field.name} className="mb-0 cursor-pointer">
                Tratamiento activo
              </FieldLabel>
            </div>
          )}
        />
      </FieldGroup>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Procesando..."
            : treatment
              ? "Guardar Cambios"
              : "Registrar Tratamiento"}
        </Button>
      </div>
    </form>
  );
}
