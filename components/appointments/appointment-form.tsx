"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { showFormErrors } from "@/lib/form-notifications";
import * as z from "zod";
import { createAppointmentAction, getAppointmentsListAction } from "@/lib/actions/appointment.actions";
import { getSchedulesByStaffIdAction } from "@/lib/actions/schedule.actions";
import { Appointment } from "@/types/appointment";
import { Patient } from "@/types/patient";
import { Schedule } from "@/types/schedule";
import { Staff } from "@/types/staff";
import { Role } from "@/types/user";
import { Button } from "@/components/ui/button";
import {
  Field,
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
import { Switch } from "@/components/ui/switch";

function timeToMins(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

function minsToTime(mins: number) {
  const hours = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (mins % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

interface Slot {
  startTime: string;
  endTime: string;
  scheduleId: string;
  available: boolean;
}

const formSchema = z
  .object({
    patientId: z.string().min(1, "Seleccione un paciente"),
    staffId: z.string().min(1, "Seleccione un especialista"),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato invalido (YYYY-MM-DD)"),
    coordinateLater: z.boolean(),
    duration: z.string().optional(),
    startTime: z.string().optional(),
    scheduleId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.coordinateLater) {
      if (!data.duration) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Seleccione la duracion",
          path: ["duration"],
        });
      }

      if (!data.startTime || !data.scheduleId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Seleccione un bloque de horario disponible",
          path: ["startTime"],
        });
      }
    }
  });

interface AppointmentFormProps {
  patients: Patient[];
  staffMembers: Staff[];
  onSuccess?: () => void;
}

export function AppointmentForm({
  patients,
  staffMembers,
  onSuccess,
}: AppointmentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: "",
      staffId: "",
      date: "",
      coordinateLater: false,
      startTime: "",
      duration: "",
      scheduleId: "",
    },
  });

  const coordinateLater = form.watch("coordinateLater");
  const staffId = form.watch("staffId");
  const date = form.watch("date");
  const durationStr = form.watch("duration");
  const selectedStartTime = form.watch("startTime");
  const selectedScheduleId = form.watch("scheduleId");
  const specialists = useMemo(() => {
    const doctors = staffMembers.filter((staff) =>
      staff.user.roles.includes(Role.DOCTOR),
    );

    return doctors.length > 0 ? doctors : staffMembers;
  }, [staffMembers]);

  useEffect(() => {
    async function loadAvailability() {
      if (!staffId || !date || coordinateLater) {
        setSchedules([]);
        setAppointments([]);
        return;
      }

      setFetchingSlots(true);
      try {
        const [schedulesResult, appointmentsResult] = await Promise.all([
          getSchedulesByStaffIdAction(staffId, date),
          getAppointmentsListAction({ staffId, date, status: "CONFIRMED" }),
        ]);

        if (schedulesResult.success) {
          setSchedules(schedulesResult.data || []);
        }

        if (appointmentsResult.success) {
          setAppointments(appointmentsResult.data || []);
        }

        form.setValue("startTime", "");
        form.setValue("scheduleId", "");
      } catch {
        toast.error("Error al cargar la disponibilidad");
      } finally {
        setFetchingSlots(false);
      }
    }

    void loadAvailability();
  }, [staffId, date, coordinateLater, form]);

  const availableSlotsGrouped = useMemo(() => {
    const durationMins = parseInt(durationStr || "0", 10);
    if (!durationMins || schedules.length === 0) {
      return {};
    }

    const grouped: Record<string, { title: string; slots: Slot[] }> = {};

    schedules.forEach((schedule) => {
      const slots: Slot[] = [];
      let currentMins = timeToMins(schedule.startTime);
      const endMins = timeToMins(schedule.endTime);

      while (currentMins + durationMins <= endMins) {
        const slotStart = currentMins;
        const slotEnd = currentMins + durationMins;

        const hasConflict = appointments.some((appointment) => {
          if (!appointment.startTime) {
            return false;
          }

          const appointmentStart = timeToMins(appointment.startTime);
          const appointmentEnd = appointment.endTime
            ? timeToMins(appointment.endTime)
            : appointmentStart + (appointment.duration || 0);

          return appointmentStart < slotEnd && appointmentEnd > slotStart;
        });

        slots.push({
          startTime: minsToTime(slotStart),
          endTime: minsToTime(slotEnd),
          scheduleId: schedule.id,
          available: !hasConflict,
        });

        currentMins += 30;
      }

      if (slots.length > 0) {
        grouped[schedule.id] = {
          title: `Turno ${schedule.startTime} - ${schedule.endTime}`,
          slots,
        };
      }
    });

    return grouped;
  }, [appointments, durationStr, schedules]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const payload: {
        patientId: string;
        staffId: string;
        date: string;
        startTime?: string;
        duration?: number;
        scheduleId?: string;
      } = {
        patientId: values.patientId,
        staffId: values.staffId,
        date: values.date,
      };

      if (!values.coordinateLater) {
        payload.startTime = values.startTime;
        payload.duration = parseInt(values.duration || "0", 10);
        payload.scheduleId = values.scheduleId;
      }

      await createAppointmentAction(payload);
      toast.success("Cita registrada correctamente");

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/citas");
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al procesar la solicitud",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const durationOptions = Array.from({ length: 8 }, (_, index) => (index + 1) * 30);

  return (
    <form onSubmit={form.handleSubmit(onSubmit, showFormErrors)} className="space-y-6">
      <FieldGroup>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Controller
            name="patientId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Paciente</FieldLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Seleccione un paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} - {patient.document}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />

          <Controller
            name="staffId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Especialista</FieldLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Seleccione especialista" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialists.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.user.firstName} {staff.user.lastName}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Controller
            name="date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Fecha de la cita</FieldLabel>
                <Input {...field} id={field.name} type="date" />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />

          {!coordinateLater ? (
            <Controller
              name="duration"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Duracion</FieldLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("startTime", "");
                      form.setValue("scheduleId", "");
                    }}
                    value={field.value || ""}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Seleccione duracion" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((duration) => (
                        <SelectItem key={duration} value={duration.toString()}>
                          {duration} minutos ({duration / 60} horas)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
          ) : null}
        </div>

        <div className="py-4">
          <Controller
            name="coordinateLater"
            control={form.control}
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Switch
                  id={field.name}
                  checked={field.value}
                  onCheckedChange={(value) => {
                    field.onChange(value);
                    if (value) {
                      form.setValue("startTime", "");
                      form.setValue("duration", "");
                      form.setValue("scheduleId", "");
                    }
                  }}
                />
                <FieldLabel htmlFor={field.name} className="mb-0 cursor-pointer">
                  Coordinar hora despues
                </FieldLabel>
              </div>
            )}
          />
        </div>

        {!coordinateLater && staffId && date && durationStr ? (
          <div className="mt-6 border-t pt-4">
            <h3 className="mb-4 text-lg font-medium">Seleccion de horario</h3>
            {fetchingSlots ? (
              <p className="text-sm text-gray-500">Cargando disponibilidad...</p>
            ) : Object.keys(availableSlotsGrouped).length === 0 ? (
              <p className="text-sm text-amber-600">
                No hay turnos disponibles para esta fecha o la duracion excede los bloques libres.
              </p>
            ) : (
              <div className="space-y-6">
                {Object.entries(availableSlotsGrouped).map(([scheduleKey, group]) => (
                  <div key={scheduleKey} className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700">
                      {group.title}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {group.slots.map((slot) => {
                        const isSelected =
                          selectedStartTime === slot.startTime &&
                          selectedScheduleId === slot.scheduleId;

                        return (
                          <button
                            key={`${slot.startTime}-${slot.endTime}`}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => {
                              form.setValue("startTime", slot.startTime);
                              form.setValue("scheduleId", slot.scheduleId);
                              form.clearErrors("startTime");
                            }}
                            className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                              !slot.available
                                ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                : isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-gray-300 bg-white text-gray-700 hover:border-primary hover:text-primary"
                            }`}
                          >
                            {slot.startTime} - {slot.endTime}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {form.formState.errors.startTime ? (
                  <p className="mt-2 text-sm font-medium text-destructive">
                    {form.formState.errors.startTime.message}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </FieldGroup>

      <div className="flex justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          className="mr-2"
          onClick={() => router.push("/citas")}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : "Agendar cita"}
        </Button>
      </div>
    </form>
  );
}
