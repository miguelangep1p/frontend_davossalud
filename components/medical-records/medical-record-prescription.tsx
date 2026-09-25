"use client";

import { useFieldArray, UseFormReturn, useWatch } from "react-hook-form";
import { Pill, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type PrescriptionItemValues = {
  medicine: string;
  presentation: string;
  quantity: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  /** True once the doctor edits the indications by hand; stops auto-filling. */
  instructionsEdited: boolean;
};

export const emptyPrescriptionItem: PrescriptionItemValues = {
  medicine: "",
  presentation: "",
  quantity: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
  instructionsEdited: false,
};

/** "1 tableta" + "cada 8 horas" + "7 días" → "Tomar 1 tableta cada 8 horas durante 7 días." */
export function buildItemInstructions(item: Partial<PrescriptionItemValues>) {
  const dosage = item.dosage?.trim() ?? "";
  const frequency = item.frequency?.trim() ?? "";
  const duration = item.duration?.trim() ?? "";
  if (!dosage && !frequency && !duration) return "";

  const parts = [
    dosage && (/^\d/.test(dosage) ? `Tomar ${dosage}` : dosage),
    frequency,
    duration && (/^(por|durante)\b/i.test(duration) ? duration : `durante ${duration}`),
  ].filter(Boolean);
  const sentence = parts.join(" ");
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
}

/** Numbered summary of the prescription for the record's "Tratamiento" field. */
export function buildTreatmentFromItems(items: Partial<PrescriptionItemValues>[]) {
  return items
    .filter((item) => item.medicine?.trim())
    .map((item, index) => {
      const name = [item.medicine, item.presentation].filter((v) => v?.trim()).join(" ");
      const quantity = item.quantity?.trim() ? ` (${item.quantity.trim()})` : "";
      const how = item.instructions?.trim() || buildItemInstructions(item);
      return `${index + 1}. ${name}${quantity}${how ? `: ${how}` : ""}`;
    })
    .join("\n");
}

// Any form that embeds the prescription must have this field.
type WithPrescription = { recipeItems: PrescriptionItemValues[] };

interface Props<T extends WithPrescription> {
  form: UseFormReturn<T>;
  /** Called after any change that affects the generated treatment text. */
  onItemsChange: () => void;
}

export function MedicalRecordPrescription<T extends WithPrescription>({
  form: typedForm,
  onItemsChange,
}: Props<T>) {
  // The component only touches `recipeItems`, so it works on that slice of the form.
  const form = typedForm as unknown as UseFormReturn<WithPrescription>;
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "recipeItems" });
  const items = useWatch({ control: form.control, name: "recipeItems" }) ?? [];
  const errors = form.formState.errors.recipeItems;

  function syncInstructions(index: number) {
    const item = form.getValues(`recipeItems.${index}`);
    if (!item.instructionsEdited) {
      form.setValue(`recipeItems.${index}.instructions`, buildItemInstructions(item));
    }
    onItemsChange();
  }

  function resetInstructions(index: number) {
    form.setValue(`recipeItems.${index}.instructionsEdited`, false);
    syncInstructions(index);
  }

  return (
    <div className="space-y-3">
      {fields.length === 0 ? (
        <button
          type="button"
          onClick={() => append(emptyPrescriptionItem)}
          className="flex w-full flex-col items-center gap-1 rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
        >
          <Pill className="size-5" />
          <span className="font-medium">Agregar medicamento a la receta</span>
          <span className="text-xs">Si no recetas nada, deja esta sección vacía.</span>
        </button>
      ) : null}

      {fields.map((field, index) => {
        const itemErrors = errors?.[index];
        const register = (
          name: "medicine" | "presentation" | "quantity" | "dosage" | "frequency" | "duration",
        ) => form.register(`recipeItems.${index}.${name}`, { onChange: () => syncInstructions(index) });

        return (
          <div key={field.id} className="space-y-3 rounded-xl border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </span>
                {items[index]?.medicine || "Medicamento"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  remove(index);
                  onItemsChange();
                }}
              >
                <Trash2 className="size-4" />
                Quitar
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-[2fr_2fr_1fr]">
              <Field data-invalid={!!itemErrors?.medicine}>
                <FieldLabel>Medicamento</FieldLabel>
                <Input {...register("medicine")} placeholder="Amoxicilina" />
                {itemErrors?.medicine ? <FieldError errors={[itemErrors.medicine]} /> : null}
              </Field>
              <Field data-invalid={!!itemErrors?.presentation}>
                <FieldLabel>Presentación</FieldLabel>
                <Input {...register("presentation")} placeholder="Tableta 500 mg" />
                {itemErrors?.presentation ? <FieldError errors={[itemErrors.presentation]} /> : null}
              </Field>
              <Field data-invalid={!!itemErrors?.quantity}>
                <FieldLabel>Cantidad</FieldLabel>
                <Input {...register("quantity")} placeholder="21" />
                {itemErrors?.quantity ? <FieldError errors={[itemErrors.quantity]} /> : null}
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field data-invalid={!!itemErrors?.dosage}>
                <FieldLabel>Dosis</FieldLabel>
                <Input {...register("dosage")} placeholder="1 tableta" />
                {itemErrors?.dosage ? <FieldError errors={[itemErrors.dosage]} /> : null}
              </Field>
              <Field data-invalid={!!itemErrors?.frequency}>
                <FieldLabel>Frecuencia</FieldLabel>
                <Input {...register("frequency")} placeholder="cada 8 horas" />
                {itemErrors?.frequency ? <FieldError errors={[itemErrors.frequency]} /> : null}
              </Field>
              <Field data-invalid={!!itemErrors?.duration}>
                <FieldLabel>Duración</FieldLabel>
                <Input {...register("duration")} placeholder="7 días" />
                {itemErrors?.duration ? <FieldError errors={[itemErrors.duration]} /> : null}
              </Field>
            </div>

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel>Indicaciones</FieldLabel>
                {items[index]?.instructionsEdited ? (
                  <button
                    type="button"
                    onClick={() => resetInstructions(index)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <RotateCcw className="size-3" />
                    Volver a generar
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">Se completa sola · puedes editarla</span>
                )}
              </div>
              <Textarea
                {...form.register(`recipeItems.${index}.instructions`, {
                  onChange: () => {
                    form.setValue(`recipeItems.${index}.instructionsEdited`, true);
                    onItemsChange();
                  },
                })}
                className="min-h-16"
                placeholder="Se llena con la dosis, frecuencia y duración"
              />
            </Field>
          </div>
        );
      })}

      {fields.length > 0 ? (
        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed"
          onClick={() => append(emptyPrescriptionItem)}
        >
          <Plus className="size-4" />
          Agregar otro medicamento
        </Button>
      ) : null}
    </div>
  );
}
