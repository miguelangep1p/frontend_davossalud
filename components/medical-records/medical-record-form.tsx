"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { showFormErrors } from "@/lib/form-notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createMedicalRecordAction,
  updateMedicalRecordAction,
} from "@/lib/actions/medical-record.actions";
import { getPatientsAction } from "@/lib/actions/patient.actions";
import { getStaffListAction } from "@/lib/actions/staff.actions";
import { uploadImageFile } from "@/lib/client-upload";
import { MedicalRecord } from "@/types/medical-record";
import { Patient } from "@/types/patient";
import { Staff } from "@/types/staff";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

const optionalNumber = (minimum: number, maximum: number, message: string) =>
  z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.coerce.number().min(minimum, message).max(maximum, message).optional(),
  );

const schema = z.object({
  patientId: z.string().uuid("ID de paciente invalido"),
  staffId: z.string().uuid("ID de especialista invalido"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
  anamnesis: z.string().optional(),
  physicalExam: z.string().optional(),
  cie10: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  observations: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  weight: optionalNumber(0, 500, "El peso debe estar entre 0 y 500 kg"),
  height: optionalNumber(0, 300, "La talla debe estar entre 0 y 300 cm"),
  bloodPressure: z.string().optional(),
  temperature: optionalNumber(30, 45, "La temperatura debe estar entre 30 y 45 °C"),
  heartRate: optionalNumber(0, 300, "La frecuencia debe estar entre 0 y 300"),
});

type FormValues = {
  patientId: string;
  staffId: string;
  date: string;
  reason?: string;
  anamnesis?: string;
  physicalExam?: string;
  cie10?: string;
  diagnosis?: string;
  treatment?: string;
  observations?: string;
  imageUrls?: string[];
  weight?: number | string;
  height?: number | string;
  bloodPressure?: string;
  temperature?: number | string;
  heartRate?: number | string;
};

interface Props {
  record?: MedicalRecord;
  defaultPatientId?: string;
  defaultStaffId?: string;
  onSuccess?: () => void;
}

export function MedicalRecordForm({
  record,
  defaultPatientId,
  defaultStaffId,
  onSuccess,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const today = new Date().toISOString().split("T")[0];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      patientId: record?.patientId || defaultPatientId || "",
      staffId: record?.staffId || defaultStaffId || "",
      date: record?.date || today,
      reason: record?.reason || "",
      anamnesis: record?.anamnesis || "",
      physicalExam: record?.physicalExam || "",
      cie10: record?.cie10 || "",
      diagnosis: record?.diagnosis || "",
      treatment: record?.treatment || "",
      observations: record?.observations || "",
      imageUrls: record?.imageUrls || [],
      weight: record?.weight as number | undefined,
      height: record?.height as number | undefined,
      bloodPressure: record?.bloodPressure || "",
      temperature: record?.temperature as number | undefined,
      heartRate: record?.heartRate as number | undefined,
    },
  });

  useEffect(() => {
    async function loadOptions() {
      try {
        const [patientsList, staffList] = await Promise.all([
          getPatientsAction(),
          getStaffListAction(),
        ]);
        setPatients(patientsList);
        setStaffMembers(staffList);
      } catch {
        toast.error("No se pudieron cargar pacientes o especialistas.");
      }
    }

    void loadOptions();
  }, []);

  const selectedImages = form.watch("imageUrls") || [];

  const selectedPatientLabel = useMemo(() => {
    return patients.find((patient) => patient.id === form.getValues("patientId"));
  }, [patients, form]);

  const selectedStaffLabel = useMemo(() => {
    return staffMembers.find((staff) => staff.id === form.getValues("staffId"));
  }, [staffMembers, form]);

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const uploaded = await uploadImageFile("/upload/medical-record-image", file);
      const currentImages = form.getValues("imageUrls") || [];
      form.setValue("imageUrls", [...currentImages, uploaded.url], {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success("Imagen clínica subida correctamente.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  }

  function removeImage(index: number) {
    const currentImages = form.getValues("imageUrls") || [];
    form.setValue(
      "imageUrls",
      currentImages.filter((_, currentIndex) => currentIndex !== index),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        reason: values.reason || undefined,
        anamnesis: values.anamnesis || undefined,
        physicalExam: values.physicalExam || undefined,
        cie10: values.cie10 || undefined,
        diagnosis: values.diagnosis || undefined,
        treatment: values.treatment || undefined,
        observations: values.observations || undefined,
        imageUrls: values.imageUrls?.length ? values.imageUrls : undefined,
        bloodPressure: values.bloodPressure || undefined,
        weight:
          values.weight !== "" && values.weight !== undefined
            ? Number(values.weight)
            : undefined,
        height:
          values.height !== "" && values.height !== undefined
            ? Number(values.height)
            : undefined,
        temperature:
          values.temperature !== "" && values.temperature !== undefined
            ? Number(values.temperature)
            : undefined,
        heartRate:
          values.heartRate !== "" && values.heartRate !== undefined
            ? Number(values.heartRate)
            : undefined,
      };

      if (record) {
        await updateMedicalRecordAction(record.id, payload);
        toast.success("Historia clínica actualizada.");
      } else {
        await createMedicalRecordAction(payload);
        toast.success("Historia clínica registrada.");
      }
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit, showFormErrors)} className="space-y-6">
      <div className="space-y-3">
        <h4 className="border-b pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Contexto de la Consulta
        </h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Controller
            name="patientId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Paciente</FieldLabel>
                {defaultPatientId ? (
                  <div className="rounded-xl border bg-muted/30 px-3 py-2 text-sm">
                    {selectedPatientLabel
                      ? `${selectedPatientLabel.firstName} ${selectedPatientLabel.lastName}`
                      : "Paciente preseleccionado"}
                  </div>
                ) : (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Selecciona un paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName} ({patient.document})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="staffId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Especialista</FieldLabel>
                {defaultStaffId ? (
                  <div className="rounded-xl border bg-muted/30 px-3 py-2 text-sm">
                    {selectedStaffLabel
                      ? `${selectedStaffLabel.user.firstName} ${selectedStaffLabel.user.lastName}`
                      : "Especialista preseleccionado"}
                  </div>
                ) : (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Selecciona un especialista" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.user.firstName} {staff.user.lastName}
                          {staff.specialty ? ` · ${staff.specialty}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Fecha</FieldLabel>
                <Input {...field} id={field.name} type="date" />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="border-b pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Datos Clínicos
        </h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Controller
            name="cie10"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Código CIE-10</FieldLabel>
                <Input {...field} id={field.name} placeholder="J06, K29.5..." />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="reason"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Motivo de Consulta</FieldLabel>
                <Input {...field} id={field.name} placeholder="Dolor abdominal, control, evaluación..." />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="border-b pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Signos Vitales
        </h4>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { name: "weight" as const, label: "Peso (kg)", placeholder: "70" },
            { name: "height" as const, label: "Talla (cm)", placeholder: "170" },
            { name: "bloodPressure" as const, label: "P. arterial", placeholder: "120/80", type: "text" },
            { name: "temperature" as const, label: "Temp. (°C)", placeholder: "36.5" },
            { name: "heartRate" as const, label: "FC (lpm)", placeholder: "75" },
          ].map(({ name, label, placeholder, type }) => (
            <Controller
              key={name}
              name={name}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={name} className="text-xs">
                    {label}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={name}
                    type={type || "number"}
                    step={type ? undefined : "0.1"}
                    placeholder={placeholder}
                    value={field.value ?? ""}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="border-b pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Evaluación Médica
        </h4>
        <FieldGroup>
          {[
            { name: "anamnesis" as const, label: "Anamnesis", placeholder: "Historia de la enfermedad actual..." },
            { name: "physicalExam" as const, label: "Examen Físico", placeholder: "Hallazgos clínicos..." },
            { name: "diagnosis" as const, label: "Diagnóstico", placeholder: "Diagnóstico principal y secundarios..." },
            { name: "treatment" as const, label: "Tratamiento", placeholder: "Indicaciones médicas..." },
            { name: "observations" as const, label: "Observaciones", placeholder: "Notas adicionales y seguimiento..." },
          ].map(({ name, label, placeholder }) => (
            <Controller
              key={name}
              name={name}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={name}>{label}</FieldLabel>
                  <Textarea {...field} id={name} placeholder={placeholder} rows={3} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          ))}
        </FieldGroup>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between border-b pb-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Imágenes de Soporte
          </h4>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100">
            {isUploadingImage ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            Subir imagen
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="sr-only"
              onChange={handleImageUpload}
              disabled={isUploadingImage}
            />
          </label>
        </div>

        {selectedImages.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {selectedImages.map((imageUrl, index) => (
              <div key={`${imageUrl}-${index}`} className="group relative overflow-hidden rounded-2xl border bg-card">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={imageUrl}
                    alt={`Adjunto clínico ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Eliminar imagen"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
            Añade fotos de lesiones, resultados o evidencias clínicas si aplica.
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading || isUploadingImage}>
          {isLoading ? "Guardando..." : record ? "Actualizar" : "Registrar Consulta"}
        </Button>
      </div>
    </form>
  );
}
