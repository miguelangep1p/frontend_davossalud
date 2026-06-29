"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CalendarClock, GripVertical, Loader2, MoveRight } from "lucide-react";
import { toast } from "sonner";
import { getAppointmentsListAction, rescheduleAppointmentAction } from "@/lib/actions/appointment.actions";
import { getSchedulesByStaffIdAction } from "@/lib/actions/schedule.actions";
import { Appointment, AppointmentStatus } from "@/types/appointment";
import { Schedule } from "@/types/schedule";
import { Staff } from "@/types/staff";
import { Role, User } from "@/types/user";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROW_HEIGHT = 54;

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

function getStatusLabel(status: AppointmentStatus) {
  switch (status) {
    case AppointmentStatus.CONFIRMED:
      return "Confirmada";
    case AppointmentStatus.PENDING_CONFIRMATION:
      return "Pendiente";
    case AppointmentStatus.ATTENDED:
      return "Atendida";
    case AppointmentStatus.CANCELLED:
      return "Cancelada";
    case AppointmentStatus.RESCHEDULED:
      return "Reprogramada";
    default:
      return status;
  }
}

function canDragAppointment(appointment: Appointment, currentUser: User | null) {
  if (!currentUser) return false;
  if (!appointment.startTime || !appointment.duration || !appointment.scheduleId) {
    return false;
  }
  if (
    appointment.status === AppointmentStatus.CANCELLED ||
    appointment.status === AppointmentStatus.ATTENDED ||
    appointment.status === AppointmentStatus.RESCHEDULED
  ) {
    return false;
  }

  return (
    currentUser.roles.includes(Role.ADMIN) ||
    currentUser.roles.includes(Role.RECEPTIONIST)
  );
}

interface Props {
  currentUser: User | null;
  staffMembers: Staff[];
}

export function AppointmentsCalendarBoard({ currentUser, staffMembers }: Props) {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [selectedStaffId, setSelectedStaffId] = useState(
    currentUser?.roles.includes(Role.DOCTOR)
      ? currentUser.staff?.id || ""
      : staffMembers.find((staff) => staff.user.roles.includes(Role.DOCTOR))?.id || "",
  );
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [draggingAppointmentId, setDraggingAppointmentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const doctors = useMemo(
    () => staffMembers.filter((staff) => staff.user.roles.includes(Role.DOCTOR)),
    [staffMembers],
  );

  useEffect(() => {
    async function loadCalendarData() {
      if (!selectedStaffId || !selectedDate) {
        setSchedules([]);
        setAppointments([]);
        return;
      }

      setIsLoading(true);
      try {
        const [appointmentsResult, schedulesResult] = await Promise.all([
          getAppointmentsListAction({ date: selectedDate, staffId: selectedStaffId }),
          getSchedulesByStaffIdAction(selectedStaffId, selectedDate),
        ]);

        if (!appointmentsResult.success) {
          throw new Error(appointmentsResult.error || "No se pudieron cargar las citas.");
        }
        if (!schedulesResult.success) {
          throw new Error(schedulesResult.error || "No se pudieron cargar los horarios.");
        }

        setAppointments(appointmentsResult.data || []);
        setSchedules(schedulesResult.data || []);
      } catch (error: unknown) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo cargar el calendario.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadCalendarData();
  }, [selectedDate, selectedStaffId]);

  const scheduledAppointments = appointments.filter(
    (appointment) =>
      appointment.startTime &&
      appointment.duration &&
      appointment.status !== AppointmentStatus.RESCHEDULED,
  );

  const unscheduledAppointments = appointments.filter(
    (appointment) =>
      !appointment.startTime ||
      !appointment.duration ||
      appointment.status === AppointmentStatus.PENDING_CONFIRMATION,
  );

  const dayWindow = useMemo(() => {
    if (!schedules.length) return null;

    return {
      start: Math.min(...schedules.map((schedule) => timeToMins(schedule.startTime))),
      end: Math.max(...schedules.map((schedule) => timeToMins(schedule.endTime))),
    };
  }, [schedules]);

  const timeSlots = useMemo(() => {
    if (!dayWindow) return [];

    const slots: string[] = [];
    for (let mins = dayWindow.start; mins < dayWindow.end; mins += 30) {
      slots.push(minsToTime(mins));
    }
    return slots;
  }, [dayWindow]);

  const appointmentStartMap = useMemo(() => {
    const map = new Map<string, Appointment>();
    scheduledAppointments.forEach((appointment) => {
      if (appointment.startTime) {
        map.set(appointment.startTime, appointment);
      }
    });
    return map;
  }, [scheduledAppointments]);

  const coveredSlots = useMemo(() => {
    const covered = new Set<string>();
    scheduledAppointments.forEach((appointment) => {
      if (!appointment.startTime || !appointment.duration) return;

      const start = timeToMins(appointment.startTime);
      const blocks = Math.max(appointment.duration / 30, 1);
      for (let index = 1; index < blocks; index += 1) {
        covered.add(minsToTime(start + index * 30));
      }
    });
    return covered;
  }, [scheduledAppointments]);

  const draggingAppointment = useMemo(
    () =>
      appointments.find((appointment) => appointment.id === draggingAppointmentId) || null,
    [appointments, draggingAppointmentId],
  );

  function getMatchingSchedule(startTime: string, duration: number) {
    const start = timeToMins(startTime);
    const end = start + duration;

    return schedules.find((schedule) => {
      const scheduleStart = timeToMins(schedule.startTime);
      const scheduleEnd = timeToMins(schedule.endTime);
      return start >= scheduleStart && end <= scheduleEnd;
    });
  }

  async function refreshAppointments() {
    const refreshed = await getAppointmentsListAction({
      date: selectedDate,
      staffId: selectedStaffId,
    });

    if (refreshed.success) {
      setAppointments(refreshed.data || []);
    }
  }

  function moveAppointment(targetStartTime: string) {
    if (!draggingAppointment || !draggingAppointment.duration) {
      return;
    }

    const matchingSchedule = getMatchingSchedule(
      targetStartTime,
      draggingAppointment.duration,
    );

    if (!matchingSchedule) {
      toast.error("Ese bloque no está dentro de un turno válido.");
      return;
    }

    startTransition(async () => {
      try {
        await rescheduleAppointmentAction(draggingAppointment.id, {
          date: selectedDate,
          startTime: targetStartTime,
          duration: draggingAppointment.duration || undefined,
          scheduleId: matchingSchedule.id,
        });

        toast.success("Cita reprogramada correctamente.");
        await refreshAppointments();
      } catch (error: unknown) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo mover la cita.",
        );
      } finally {
        setDraggingAppointmentId(null);
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="border-border/70 bg-white/90 shadow-sm">
        <CardHeader className="gap-4 border-b border-border/70 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-xl">Calendario de citas</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Arrastra citas confirmadas a otro bloque horario válido para reprogramarlas.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Fecha
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Especialista
                </label>
                <Select
                  value={selectedStaffId}
                  onValueChange={setSelectedStaffId}
                  disabled={currentUser?.roles.includes(Role.DOCTOR)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione especialista" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.user.firstName} {doctor.user.lastName}
                        {doctor.specialty ? ` - ${doctor.specialty}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-[560px] items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Cargando calendario...
            </div>
          ) : !selectedStaffId ? (
            <div className="flex h-[560px] items-center justify-center text-sm text-muted-foreground">
              Selecciona un especialista para visualizar la agenda.
            </div>
          ) : !timeSlots.length ? (
            <div className="flex h-[560px] items-center justify-center text-sm text-muted-foreground">
              No hay turnos configurados para este especialista en la fecha seleccionada.
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-auto">
              <div className="grid min-w-[720px] grid-cols-[96px_minmax(0,1fr)]">
                {timeSlots.map((slot) => {
                  const schedule = draggingAppointment?.duration
                    ? getMatchingSchedule(slot, draggingAppointment.duration)
                    : getMatchingSchedule(slot, 30);
                  const startsHere = appointmentStartMap.get(slot);
                  const hiddenBySpan = coveredSlots.has(slot);
                  const isDropTarget =
                    Boolean(schedule) &&
                    Boolean(draggingAppointment) &&
                    !isPending;

                  return (
                    <div key={slot} className="contents">
                      <div
                        className="border-b border-r border-border/70 bg-muted/20 px-3 py-3 text-xs font-medium text-muted-foreground"
                        style={{ height: ROW_HEIGHT }}
                      >
                        {slot}
                      </div>
                      <div
                        className={`relative border-b border-border/70 px-3 py-2 ${
                          schedule ? "bg-white" : "bg-muted/10"
                        } ${isDropTarget ? "ring-1 ring-rose-200 ring-inset" : ""}`}
                        style={{ height: ROW_HEIGHT }}
                        onDragOver={(event) => {
                          if (isDropTarget) {
                            event.preventDefault();
                          }
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (isDropTarget) {
                            moveAppointment(slot);
                          }
                        }}
                      >
                        {schedule ? (
                          <div className="absolute inset-y-0 left-0 w-1 bg-rose-100" />
                        ) : null}

                        {startsHere ? (
                          <div
                            draggable={canDragAppointment(startsHere, currentUser)}
                            onDragStart={() => setDraggingAppointmentId(startsHere.id)}
                            onDragEnd={() => setDraggingAppointmentId(null)}
                            className={`absolute left-3 right-3 z-10 rounded-2xl border px-3 py-2 shadow-sm ${
                              canDragAppointment(startsHere, currentUser)
                                ? "cursor-grab active:cursor-grabbing"
                                : "cursor-default"
                            } ${
                              startsHere.status === AppointmentStatus.CONFIRMED
                                ? "border-rose-200 bg-rose-50"
                                : "border-amber-200 bg-amber-50"
                            }`}
                            style={{
                              top: 6,
                              height: Math.max(
                                ((startsHere.duration || 30) / 30) * ROW_HEIGHT - 10,
                                ROW_HEIGHT - 10,
                              ),
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {startsHere.patient.firstName} {startsHere.patient.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {startsHere.startTime} - {startsHere.endTime}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {startsHere.duration} min
                                </p>
                              </div>
                              {canDragAppointment(startsHere, currentUser) ? (
                                <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                              ) : null}
                            </div>
                          </div>
                        ) : hiddenBySpan ? null : schedule ? (
                          <div className="flex h-full items-center text-xs text-muted-foreground/60">
                            {draggingAppointment ? "Suelta aquí para mover" : ""}
                          </div>
                        ) : (
                          <div className="flex h-full items-center text-xs text-muted-foreground/50">
                            Fuera de turno
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-border/70 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Por coordinar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unscheduledAppointments.length ? (
              unscheduledAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.patient.document}
                      </p>
                    </div>
                    <Badge variant="outline">{getStatusLabel(appointment.status)}</Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Esta cita aún no tiene bloque horario confirmado. Primero asígnale hora y duración desde la gestión normal.
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                No hay citas pendientes de coordinar para esta fecha.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Reglas de movimiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <CalendarClock className="mt-0.5 size-4 shrink-0 text-rose-600" />
              <p>Solo se pueden arrastrar citas con hora, duración y turno asignado.</p>
            </div>
            <div className="flex gap-2">
              <MoveRight className="mt-0.5 size-4 shrink-0 text-rose-600" />
              <p>El nuevo bloque debe caber completo dentro del turno del especialista.</p>
            </div>
            <div className="flex gap-2">
              <GripVertical className="mt-0.5 size-4 shrink-0 text-rose-600" />
              <p>Si el horario se cruza con otra cita confirmada, el backend rechazará el movimiento.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
