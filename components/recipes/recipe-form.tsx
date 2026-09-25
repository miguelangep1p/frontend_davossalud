"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createRecipeAction } from "@/lib/actions/recipe.actions";
import { showFormErrors } from "@/lib/form-notifications";
import { MedicalRecord } from "@/types/medical-record";
import { Recipe } from "@/types/recipe";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const itemSchema = z.object({
  medicine: z.string().min(1, "Escribe el medicamento"),
  presentation: z.string().min(1, "Escribe la presentación"),
  dosage: z.string().min(1, "Escribe la dosis"),
  frequency: z.string().min(1, "Escribe la frecuencia"),
  duration: z.string().min(1, "Escribe la duración"),
  instructions: z.string().optional(),
});

const formSchema = z.object({
  diagnosis: z
    .string()
    .min(1, "Escribe el diagnóstico")
    .max(180, "Máximo 180 caracteres"),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, "Agrega al menos un medicamento"),
});

type FormValues = z.infer<typeof formSchema>;

const emptyItem = {
  medicine: "",
  presentation: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
};

interface RecipeFormProps {
  /** The consultation this prescription belongs to (patient, doctor and date come from it). */
  record: MedicalRecord;
  onSuccess?: (recipe: Recipe) => void;
  onCancel?: () => void;
}

export function RecipeForm({ record, onSuccess, onCancel }: RecipeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      diagnosis: (record.diagnosis || record.reason || "").slice(0, 180),
      notes: "",
      items: [emptyItem],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const errors = form.formState.errors;

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    const result = await createRecipeAction({
      patientId: record.patientId,
      staffId: record.staffId,
      medicalRecordId: record.id,
      prescribedAt: record.date,
      diagnosis: values.diagnosis,
      notes: values.notes || undefined,
      items: values.items.map((item) => ({
        ...item,
        instructions: item.instructions || undefined,
      })),
    });
    setIsLoading(false);

    if (!result.success) {
      toast.error("No se pudo guardar la receta", { description: result.error });
      return;
    }

    const recipe = result.data;
    toast.success("Receta guardada", {
      description: `${values.items.length} medicamento${values.items.length !== 1 ? "s" : ""}`,
      action: {
        label: "Abrir PDF",
        onClick: () => window.open(`/api/recipes/${recipe.id}/pdf`, "_blank", "noopener,noreferrer"),
      },
    });
    onSuccess?.(recipe);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit, showFormErrors)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
        <Field data-invalid={!!errors.diagnosis}>
          <FieldLabel htmlFor="recipe-diagnosis">Diagnóstico</FieldLabel>
          <Input
            id="recipe-diagnosis"
            {...form.register("diagnosis")}
            placeholder="Ej. Dermatitis atópica moderada"
          />
          {errors.diagnosis ? <FieldError errors={[errors.diagnosis]} /> : null}
        </Field>
        <Field>
          <FieldLabel htmlFor="recipe-notes">Indicaciones generales (opcional)</FieldLabel>
          <Input
            id="recipe-notes"
            {...form.register("notes")}
            placeholder="Ej. Evitar exposición al sol"
          />
        </Field>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Medicamentos</h4>
          <span className="text-xs text-muted-foreground">
            {fields.length} en la receta
          </span>
        </div>

        {fields.map((field, index) => {
          const itemErrors = errors.items?.[index];
          return (
            <div key={field.id} className="space-y-3 rounded-xl border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </span>
                {fields.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                    Quitar
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field data-invalid={!!itemErrors?.medicine}>
                  <FieldLabel>Medicamento</FieldLabel>
                  <Input {...form.register(`items.${index}.medicine`)} placeholder="Amoxicilina" />
                  {itemErrors?.medicine ? <FieldError errors={[itemErrors.medicine]} /> : null}
                </Field>
                <Field data-invalid={!!itemErrors?.presentation}>
                  <FieldLabel>Presentación</FieldLabel>
                  <Input
                    {...form.register(`items.${index}.presentation`)}
                    placeholder="Tableta 500 mg"
                  />
                  {itemErrors?.presentation ? (
                    <FieldError errors={[itemErrors.presentation]} />
                  ) : null}
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field data-invalid={!!itemErrors?.dosage}>
                  <FieldLabel>Dosis</FieldLabel>
                  <Input {...form.register(`items.${index}.dosage`)} placeholder="1 tableta" />
                  {itemErrors?.dosage ? <FieldError errors={[itemErrors.dosage]} /> : null}
                </Field>
                <Field data-invalid={!!itemErrors?.frequency}>
                  <FieldLabel>Frecuencia</FieldLabel>
                  <Input
                    {...form.register(`items.${index}.frequency`)}
                    placeholder="Cada 8 horas"
                  />
                  {itemErrors?.frequency ? <FieldError errors={[itemErrors.frequency]} /> : null}
                </Field>
                <Field data-invalid={!!itemErrors?.duration}>
                  <FieldLabel>Duración</FieldLabel>
                  <Input {...form.register(`items.${index}.duration`)} placeholder="7 días" />
                  {itemErrors?.duration ? <FieldError errors={[itemErrors.duration]} /> : null}
                </Field>
              </div>

              <Field>
                <FieldLabel>Indicaciones (opcional)</FieldLabel>
                <Textarea
                  {...form.register(`items.${index}.instructions`)}
                  className="min-h-16"
                  placeholder="Tomar después de los alimentos"
                />
              </Field>
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed"
          onClick={() => append(emptyItem)}
        >
          <Plus className="size-4" />
          Agregar otro medicamento
        </Button>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
          {isLoading ? "Guardando…" : "Guardar receta"}
        </Button>
      </div>
    </form>
  );
}
