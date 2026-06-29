"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Patient } from "@/types/patient";
import { Staff } from "@/types/staff";
import { Role } from "@/types/user";
import { createRecipeAction } from "@/lib/actions/recipe.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";

const itemSchema = z.object({
  medicine: z.string().min(1, "Medicamento requerido"),
  presentation: z.string().min(1, "Presentación requerida"),
  dosage: z.string().min(1, "Dosis requerida"),
  frequency: z.string().min(1, "Frecuencia requerida"),
  duration: z.string().min(1, "Duración requerida"),
  instructions: z.string().optional().or(z.literal("")),
});

const formSchema = z.object({
  patientId: z.string().min(1, "Seleccione un paciente"),
  staffId: z.string().min(1, "Seleccione un especialista"),
  prescribedAt: z.string().min(1, "Seleccione una fecha"),
  diagnosis: z.string().min(1, "Ingrese el diagnóstico"),
  notes: z.string().optional().or(z.literal("")),
  items: z.array(itemSchema).min(1, "Agregue al menos un medicamento"),
});

const emptyItem = {
  medicine: "",
  presentation: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
};

interface RecipeFormProps {
  patients: Patient[];
  staffMembers: Staff[];
  onSuccess?: () => void;
}

export function RecipeForm({
  patients,
  staffMembers,
  onSuccess,
}: RecipeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: "",
      staffId: "",
      prescribedAt: new Date().toISOString().slice(0, 10),
      diagnosis: "",
      notes: "",
      items: [emptyItem],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const doctors = staffMembers.filter((item) =>
    item.user?.roles?.includes(Role.DOCTOR),
  );
  const specialists = doctors.length > 0 ? doctors : staffMembers;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await createRecipeAction({
        ...values,
        notes: values.notes || undefined,
        items: values.items.map((item) => ({
          ...item,
          instructions: item.instructions || undefined,
        })),
      });
      toast.success("Receta registrada correctamente");
      onSuccess?.();
      form.reset({
        patientId: "",
        staffId: "",
        prescribedAt: new Date().toISOString().slice(0, 10),
        diagnosis: "",
        notes: "",
        items: [emptyItem],
      });
    } catch (error: any) {
      toast.error(error.message || "Error al registrar la receta");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Paso 1. Datos clínicos</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field data-invalid={!!form.formState.errors.patientId}>
                <FieldLabel>Paciente</FieldLabel>
                <Select
                  onValueChange={(value) => form.setValue("patientId", value)}
                  value={form.watch("patientId")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} · {patient.document}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.patientId && (
                  <FieldError errors={[form.formState.errors.patientId]} />
                )}
              </Field>

              <Field data-invalid={!!form.formState.errors.staffId}>
                <FieldLabel>Médico tratante</FieldLabel>
                <Select
                  onValueChange={(value) => form.setValue("staffId", value)}
                  value={form.watch("staffId")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialists.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.user.firstName} {doctor.user.lastName}
                        {doctor.specialty ? ` · ${doctor.specialty}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Solo se muestran especialistas con rol médico.
                </FieldDescription>
                {form.formState.errors.staffId && (
                  <FieldError errors={[form.formState.errors.staffId]} />
                )}
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[180px,1fr] gap-4">
              <Field data-invalid={!!form.formState.errors.prescribedAt}>
                <FieldLabel>Fecha</FieldLabel>
                <Input type="date" {...form.register("prescribedAt")} />
                {form.formState.errors.prescribedAt && (
                  <FieldError errors={[form.formState.errors.prescribedAt]} />
                )}
              </Field>

              <Field data-invalid={!!form.formState.errors.diagnosis}>
                <FieldLabel>Diagnóstico</FieldLabel>
                <Input
                  {...form.register("diagnosis")}
                  placeholder="Ej. Dermatitis atópica moderada"
                />
                {form.formState.errors.diagnosis && (
                  <FieldError errors={[form.formState.errors.diagnosis]} />
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel>Observaciones generales</FieldLabel>
              <Textarea
                {...form.register("notes")}
                placeholder="Indicaciones generales, alergias relevantes o cuidados adicionales"
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Paso 2. Medicamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border p-4 space-y-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Indicador {index + 1}</h3>
                {fields.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Quitar
                  </Button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field data-invalid={!!form.formState.errors.items?.[index]?.medicine}>
                  <FieldLabel>Medicamento</FieldLabel>
                  <Input {...form.register(`items.${index}.medicine`)} placeholder="Amoxicilina" />
                  {form.formState.errors.items?.[index]?.medicine && (
                    <FieldError errors={[form.formState.errors.items[index]!.medicine!]} />
                  )}
                </Field>
                <Field data-invalid={!!form.formState.errors.items?.[index]?.presentation}>
                  <FieldLabel>Presentación</FieldLabel>
                  <Input
                    {...form.register(`items.${index}.presentation`)}
                    placeholder="Tableta 500 mg"
                  />
                  {form.formState.errors.items?.[index]?.presentation && (
                    <FieldError errors={[form.formState.errors.items[index]!.presentation!]} />
                  )}
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field data-invalid={!!form.formState.errors.items?.[index]?.dosage}>
                  <FieldLabel>Dosis</FieldLabel>
                  <Input {...form.register(`items.${index}.dosage`)} placeholder="1 tableta" />
                  {form.formState.errors.items?.[index]?.dosage && (
                    <FieldError errors={[form.formState.errors.items[index]!.dosage!]} />
                  )}
                </Field>
                <Field data-invalid={!!form.formState.errors.items?.[index]?.frequency}>
                  <FieldLabel>Frecuencia</FieldLabel>
                  <Input
                    {...form.register(`items.${index}.frequency`)}
                    placeholder="Cada 8 horas"
                  />
                  {form.formState.errors.items?.[index]?.frequency && (
                    <FieldError errors={[form.formState.errors.items[index]!.frequency!]} />
                  )}
                </Field>
                <Field data-invalid={!!form.formState.errors.items?.[index]?.duration}>
                  <FieldLabel>Duración</FieldLabel>
                  <Input
                    {...form.register(`items.${index}.duration`)}
                    placeholder="Por 7 días"
                  />
                  {form.formState.errors.items?.[index]?.duration && (
                    <FieldError errors={[form.formState.errors.items[index]!.duration!]} />
                  )}
                </Field>
              </div>

              <Field>
                <FieldLabel>Indicaciones puntuales</FieldLabel>
                <Textarea
                  {...form.register(`items.${index}.instructions`)}
                  placeholder="Tomar después de alimentos, suspender ante reacción, etc."
                />
              </Field>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={() => append(emptyItem)}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar medicamento
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Registrando..." : "Registrar receta"}
        </Button>
      </div>
    </form>
  );
}
