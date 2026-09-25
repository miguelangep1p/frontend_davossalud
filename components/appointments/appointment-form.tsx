"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as z from "zod";
import { CalendarCheck2, Clock, Loader2 } from "lucide-react";
import { showFormErrors } from "@/lib/form-notifications";
import {
  createAppointmentAction,
  getAppointmentsListAction,
} from "@/lib/actions/appointment.actions";
import {
  CLINIC_CLOSING_TIME,
  CLINIC_OPENING_TIME,
  CLINIC_SLOTS,
  fitsClinicDay,
  formatDuration,
  minsToTime,
  timeToMins,
  todayISO,
} from "@/lib/clinic-hours";
import { cn } from "@/lib/utils";
import { Appointment, AppointmentStatus } from "@/types/appointment";
import { Patient } from "@/types/patient";
import { Staff } from "@/types/staff";
import { Role } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const DURATION_OPTIONS = [30, 60, 90, 120, 150, 180, 210, 240];

const DAY_PARTS = [
  { label: "Mañana", from: "07:00", to: "12:00" },
  { label: "Tarde", from: "12:00", to: "18:00" },
  { label: "Noche", from: "18:00", to: "22:00" },
];

const formSchema = z
  .object({
    patientId: z.string().min(1, "Elige un paciente"),
    staffId: z.string().min(1, "Elige un especialista"),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Elige una fecha")
      .refine((value) => value >= todayISO(), {
        message: "La fecha no puede ser pasada",
      }),
    coordinateLater: z.boolean(),
    duration: z.string().optional(),
    startTime: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.coordinateLater) return;
    if (!data.duration) {
      ctx.addIssue({
        code: "custom",
        message: "Elige cuánto dura la cita",
        path: ["duration"],
      });
    }
    if (!data.startTime) {
      ctx.addIssue({
        code: "custom",
        message: "Elige una hora disponible",
        path: ["startTime"],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

export interface AppointmentFormDefaults {
  staffId?: string;
  date?: string;
  startTime?: string;
}

interface AppointmentFormProps {
  patients: Patient[];
  staffMembers: Staff[];
  defaults?: AppointmentFormDefaults;
  onSuccess?: (appointment: Appointment) => void;
  onCancel?: () => void;
}

function formatLongDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function AppointmentForm({
  patients,
  staffMembers,
  defaults,
  onSuccess,
  onCancel,
}: AppointmentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [bookedAppointments, setBookedAppointments] = useState<Appointment[]>([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: "",
      staffId: defaults?.staffId ?? "",
      date: defaults?.date ?? todayISO(),
      coordinateLater: false,
      duration: "30",
      startTime: defaults?.startTime ?? "",
    },
  });

  const coordinateLater = form.watch("coordinateLater");
  const staffId = form.watch("staffId");
  const date = form.watch("date");
  const duration = Number(form.watch("duration") || 0);
  const startTime = form.watch("startTime");
  const patientId = form.watch("patientId");

  const specialists = useMemo(() => {
    const doctors = staffMembers.filter((staff) =>
      staff.user.roles.includes(Role.DOCTOR),
    );
    return doctors.length > 0 ? doctors : staffMembers;
  }, [staffMembers]);

  useEffect(() => {
    if (!staffId || !date || coordinateLater) {
      setBookedAppointments([]);
      return;
    }

    let cancelled = false;
    setFetchingSlots(true);
    getAppointmentsListAction({ staffId, date, status: AppointmentStatus.CONFIRMED })
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setBookedAppointments(result.data || []);
        } else {
          toast.error("No se pudo cargar la disponibilidad", {
            description: result.error,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setFetchingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [staffId, date, coordinateLater]);

  const slots = useMemo(() => {
    const isToday = date === todayISO();
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    return CLINIC_SLOTS.map((slot) => {
      const start = timeToMins(slot);
      const end = start + duration;
      const taken = bookedAppointments.some((appointment) => {
        if (!appointment.startTime) return false;
        const bookedStart = timeToMins(appointment.startTime);
        const bookedEnd = appointment.endTime
          ? timeToMins(appointment.endTime)
          : bookedStart + (appointment.duration || 0);
        return bookedStart < end && bookedEnd > start;
      });
      const past = isToday && start <= nowMins;
      const fits = fitsClinicDay(slot, duration);

      return { time: slot, end: minsToTime(end), taken, past, fits };
    });
  }, [bookedAppointments, date, duration]);

  const selectedSlot = slots.find((slot) => slot.time === startTime);
  const selectedSlotUnavailable =
    Boolean(selectedSlot) &&
    (selectedSlot!.taken || selectedSlot!.past || !selectedSlot!.fits);

  const patient = patients.find((item) => item.id === patientId);
  const specialist = specialists.find((item) => item.id === staffId);

  function resetTime() {
    form.setValue("startTime", "");
  }

  async function onSubmit(values: FormValues) {
    if (!values.coordinateLater && selectedSlotUnavailable) {
      toast.error("Esa hora ya no está disponible", {
        description: "Elige otra hora libre para continuar.",
      });
      return;
    }

    setIsLoading(true);
    const result = await createAppointmentAction({
      patientId: values.patientId,
      staffId: values.staffId,
      date: values.date,
      ...(values.coordinateLater
        ? {}
        : {
            startTime: values.startTime,
            duration: Number(values.duration),
          }),
    });
    setIsLoading(false);

    if (!result.success) {
      toast.error("No se pudo agendar la cita", { description: result.error });
      return;
    }

    toast.success("Cita agendada", {
      description: values.coordinateLater
        ? "Quedó pendiente de asignar hora."
        : `${formatLongDate(values.date)} a las ${values.startTime}`,
    });

    if (onSuccess) {
      onSuccess(result.data);
    } else {
      router.push("/citas");
      router.refresh();
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, showFormErrors)}
      className="space-y-6"
    >
      <section className="space-y-4">
        <StepTitle step={1} title="Paciente y especialista" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Controller
            name="patientId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Paciente</FieldLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="¿A quién atenderemos?" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.length === 0 ? (
                      <p className="px-2.5 py-2 text-sm text-muted-foreground">
                        Aún no hay pacientes registrados
                      </p>
                    ) : (
                      patients.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.firstName} {item.lastName}
                          <span className="text-xs text-muted-foreground">
                            {item.document}
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />

          <Controller
            name="staffId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Especialista</FieldLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    resetTime();
                  }}
                  value={field.value}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="¿Con quién será la cita?" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialists.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.user.firstName} {staff.user.lastName}
                        {staff.specialty ? (
                          <span className="text-xs text-muted-foreground">
                            {staff.specialty}
                          </span>
                        ) : null}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </div>
      </section>

      <section className="space-y-4">
        <StepTitle step={2} title="Fecha y duración" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Controller
            name="date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Fecha</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="date"
                  min={todayISO()}
                  onChange={(event) => {
                    field.onChange(event);
                    resetTime();
                  }}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />

          <Controller
            name="duration"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Duración</FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={coordinateLater}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="¿Cuánto dura?" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((mins) => (
                      <SelectItem key={mins} value={String(mins)}>
                        {formatDuration(mins)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </div>

        <Controller
          name="coordinateLater"
          control={form.control}
          render={({ field }) => (
            <label
              htmlFor={field.name}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <span>
                <span className="block text-sm font-medium">Coordinar la hora después</span>
                <span className="block text-xs text-muted-foreground">
                  La cita queda pendiente y le asignas hora más adelante.
                </span>
              </span>
              <Switch
                id={field.name}
                checked={field.value}
                onCheckedChange={(value) => {
                  field.onChange(value);
                  if (value) {
                    resetTime();
                    form.clearErrors(["startTime", "duration"]);
                  }
                }}
              />
            </label>
          )}
        />
      </section>

      {!coordinateLater ? (
        <section className="space-y-4">
          <StepTitle
            step={3}
            title="Hora"
            hint={`Atención de ${CLINIC_OPENING_TIME} a ${CLINIC_CLOSING_TIME}`}
          />
          {!staffId ? (
            <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
              Elige un especialista para ver sus horas libres.
            </p>
          ) : fetchingSlots ? (
            <p className="flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Buscando horas libres…
            </p>
          ) : (
            <div className="space-y-4">
              {DAY_PARTS.map((part) => {
                const partSlots = slots.filter(
                  (slot) => slot.time >= part.from && slot.time < part.to,
                );
                return (
                  <div key={part.label} className="space-y-2">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {part.label}
                    </p>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {partSlots.map((slot) => {
                        const disabled = slot.taken || slot.past || !slot.fits;
                        const isSelected = startTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={disabled}
                            title={
                              slot.taken
                                ? "Ocupado"
                                : slot.past
                                  ? "Hora pasada"
                                  : !slot.fits
                                    ? "No alcanza antes del cierre"
                                    : `${slot.time} – ${slot.end}`
                            }
                            onClick={() => {
                              form.setValue("startTime", slot.time);
                              form.clearErrors("startTime");
                            }}
                            className={cn(
                              "h-9 rounded-lg border text-sm font-medium tabular-nums transition-colors",
                              disabled &&
                                "cursor-not-allowed border-transparent bg-muted/60 text-muted-foreground/50 line-through",
                              !disabled &&
                                !isSelected &&
                                "border-input bg-background hover:border-primary hover:text-primary",
                              isSelected &&
                                "border-primary bg-primary text-primary-foreground shadow-sm",
                            )}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {form.formState.errors.startTime ? (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.startTime.message}
                </p>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      {patient && specialist && date && (coordinateLater || (startTime && !selectedSlotUnavailable)) ? (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <CalendarCheck2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            <span className="font-medium">
              {patient.firstName} {patient.lastName}
            </span>{" "}
            con {specialist.user.firstName} {specialist.user.lastName} el{" "}
            {formatLongDate(date)}
            {coordinateLater ? (
              " · hora por coordinar"
            ) : (
              <>
                {" "}
                <Clock className="mb-0.5 inline size-3.5" /> {startTime} –{" "}
                {selectedSlot?.end} ({formatDuration(duration)})
              </>
            )}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => (onCancel ? onCancel() : router.push("/citas"))}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
          {isLoading ? "Agendando…" : "Agendar cita"}
        </Button>
      </div>
    </form>
  );
}

function StepTitle({ step, title, hint }: { step: number; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {step}
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
      {hint ? <span className="ml-auto text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
}
