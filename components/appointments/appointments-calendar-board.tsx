"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CalendarClock, GripVertical, Loader2, MoveRight } from "lucide-react";
import { toast } from "sonner";
import {
  getAppointmentsListAction,
  rescheduleAppointmentAction,
} from "@/lib/actions/appointment.actions";
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
const ALL_STAFF_VALUE = "__ALL__";
const FALLBACK_COLORS = [
  "#F472B6",
  "#60A5FA",
  "#34D399",
  "#F59E0B",
  "#A78BFA",
  "#F87171",
  "#22C55E",
  "#06B6D4",
];

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

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace("#", "");
  if (sanitized.length !== 6) {
    return `rgba(244, 114, 182, ${alpha})`;
  }

  const value = Number.parseInt(sanitized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getFallbackColor(staffId: string) {
  let hash = 0;
  for (const char of staffId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

interface Props {
  currentUser: User | null;
  staffMembers: Staff[];
}

export function AppointmentsCalendarBoard({ currentUser, staffMembers }: Props) {
  const doctors = useMemo(() => {
    const staffWithDoctorRole = staffMembers.filter((staff) =>
      staff.user.roles.includes(Role.DOCTOR),
    );

    return staffWithDoctorRole.length > 0 ? staffWithDoctorRole : staffMembers;
  }, [staffMembers]);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [selectedStaffId, setSelectedStaffId] = useState(
    currentUser?.roles.includes(Role.DOCTOR)
      ? currentUser.staff?.id || ""
      : ALL_STAFF_VALUE,
  );
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [draggingAppointmentId, setDraggingAppointmentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleStaffMembers = useMemo(() => {
    if (selectedStaffId === ALL_STAFF_VALUE) {
      return doctors;
    }

    return doctors.filter((staff) => staff.id === selectedStaffId);
  }, [doctors, selectedStaffId]);

  const visibleStaffIds = useMemo(
    () => new Set(visibleStaffMembers.map((staff) => staff.id)),
    [visibleStaffMembers],
  );

  useEffect(() => {
    async function loadCalendarData() {
      if (!selectedDate) {
        setSchedules([]);
        setAppointments([]);
        return;
      }

      const resolvedStaffId =
        selectedStaffId === ALL_STAFF_VALUE ? undefined : selectedStaffId;

      if (!resolvedStaffId && selectedStaffId !== ALL_STAFF_VALUE) {
        setSchedules([]);
        setAppointments([]);
        return;
      }

      setIsLoading(true);
      try {
        const [appointmentsResult, schedulesResult] = await Promise.all([
          getAppointmentsListAction({ date: selectedDate, staffId: resolvedStaffId }),
          getSchedulesByStaffIdAction(resolvedStaffId, selectedDate),
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

  useEffect(() => {
    if (currentUser?.roles.includes(Role.DOCTOR)) {
      setSelectedStaffId(currentUser.staff?.id || "");
      return;
    }

    if (selectedStaffId !== ALL_STAFF_VALUE && doctors.length > 0) {
      const hasSelected = doctors.some((doctor) => doctor.id === selectedStaffId);
      if (!hasSelected) {
        setSelectedStaffId(ALL_STAFF_VALUE);
      }
    }
  }, [currentUser, doctors, selectedStaffId]);

  const filteredAppointments = useMemo(
    () => appointments.filter((appointment) => visibleStaffIds.has(appointment.staffId)),
    [appointments, visibleStaffIds],
  );

  const filteredSchedules = useMemo(
    () => schedules.filter((schedule) => visibleStaffIds.has(schedule.staffId)),
    [schedules, visibleStaffIds],
  );

  const schedulesByStaff = useMemo(() => {
    const grouped = new Map<string, Schedule[]>();

    filteredSchedules.forEach((schedule) => {
      const current = grouped.get(schedule.staffId) || [];
      current.push(schedule);
      grouped.set(schedule.staffId, current);
    });

    grouped.forEach((staffSchedules) => {
      staffSchedules.sort((left, right) => timeToMins(left.startTime) - timeToMins(right.startTime));
    });

    return grouped;
  }, [filteredSchedules]);

  const scheduledAppointments = useMemo(
    () =>
      filteredAppointments.filter(
        (appointment) =>
          appointment.startTime &&
          appointment.duration &&
          appointment.status !== AppointmentStatus.RESCHEDULED,
      ),
    [filteredAppointments],
  );

  const unscheduledAppointments = useMemo(
    () =>
      filteredAppointments.filter(
        (appointment) =>
          !appointment.startTime ||
          !appointment.duration ||
          appointment.status === AppointmentStatus.PENDING_CONFIRMATION,
      ),
    [filteredAppointments],
  );

  const dayWindow = useMemo(() => {
    const startCandidates = filteredSchedules.map((schedule) => timeToMins(schedule.startTime));
    const endCandidates = filteredSchedules.map((schedule) => timeToMins(schedule.endTime));

    scheduledAppointments.forEach((appointment) => {
      if (!appointment.startTime) {
        return;
      }

      const start = timeToMins(appointment.startTime);
      const end = appointment.endTime
        ? timeToMins(appointment.endTime)
        : start + (appointment.duration || 0);

      startCandidates.push(start);
      endCandidates.push(end);
    });

    if (!startCandidates.length || !endCandidates.length) {
      return null;
    }

    return {
      start: Math.min(...startCandidates),
      end: Math.max(...endCandidates),
    };
  }, [filteredSchedules, scheduledAppointments]);

  const timeSlots = useMemo(() => {
    if (!dayWindow) return [];

    const slots: string[] = [];
    for (let mins = dayWindow.start; mins < dayWindow.end; mins += 30) {
      slots.push(minsToTime(mins));
    }
    return slots;
  }, [dayWindow]);

  const slotIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    timeSlots.forEach((slot, index) => map.set(slot, index));
    return map;
  }, [timeSlots]);

  const appointmentsByStaff = useMemo(() => {
    const grouped = new Map<string, Appointment[]>();

    scheduledAppointments.forEach((appointment) => {
      const current = grouped.get(appointment.staffId) || [];
      current.push(appointment);
      grouped.set(appointment.staffId, current);
    });

    grouped.forEach((staffAppointments) => {
      staffAppointments.sort((left, right) => {
        if (!left.startTime || !right.startTime) return 0;
        return timeToMins(left.startTime) - timeToMins(right.startTime);
      });
    });

    return grouped;
  }, [scheduledAppointments]);

  const draggingAppointment = useMemo(
    () =>
      appointments.find((appointment) => appointment.id === draggingAppointmentId) || null,
    [appointments, draggingAppointmentId],
  );

  function getAppointmentColor(appointment: Appointment) {
    return appointment.schedule?.color || getFallbackColor(appointment.staffId);
  }

  function getMatchingSchedule(staffId: string, startTime: string, duration: number) {
    const start = timeToMins(startTime);
    const end = start + duration;
    const staffSchedules = schedulesByStaff.get(staffId) || [];

    return staffSchedules.find((schedule) => {
      const scheduleStart = timeToMins(schedule.startTime);
      const scheduleEnd = timeToMins(schedule.endTime);
      return start >= scheduleStart && end <= scheduleEnd;
    });
  }

  function hasScheduleCoverage(staffId: string, startTime: string) {
    const start = timeToMins(startTime);
    const end = start + 30;
    const staffSchedules = schedulesByStaff.get(staffId) || [];

    return staffSchedules.some((schedule) => {
      const scheduleStart = timeToMins(schedule.startTime);
      const scheduleEnd = timeToMins(schedule.endTime);
      return start < scheduleEnd && end > scheduleStart;
    });
  }

  async function refreshCalendarData() {
    const resolvedStaffId =
      selectedStaffId === ALL_STAFF_VALUE ? undefined : selectedStaffId;

    const [appointmentsResult, schedulesResult] = await Promise.all([
      getAppointmentsListAction({ date: selectedDate, staffId: resolvedStaffId }),
      getSchedulesByStaffIdAction(resolvedStaffId, selectedDate),
    ]);

    if (appointmentsResult.success) {
      setAppointments(appointmentsResult.data || []);
    }

    if (schedulesResult.success) {
      setSchedules(schedulesResult.data || []);
    }
  }

  function moveAppointment(staffId: string, targetStartTime: string) {
    if (!draggingAppointment || !draggingAppointment.duration) {
      return;
    }

    if (draggingAppointment.staffId !== staffId) {
      toast.error("La cita solo se puede mover dentro del mismo especialista.");
      return;
    }

    const matchingSchedule = getMatchingSchedule(
      staffId,
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
        await refreshCalendarData();
      } catch (error: unknown) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo mover la cita.",
        );
      } finally {
        setDraggingAppointmentId(null);
      }
    });
  }

  const gridTemplateColumns = `96px repeat(${Math.max(visibleStaffMembers.length, 1)}, minmax(280px, 1fr))`;

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
                    {!currentUser?.roles.includes(Role.DOCTOR) ? (
                      <SelectItem value={ALL_STAFF_VALUE}>Todos</SelectItem>
                    ) : null}
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
          ) : !visibleStaffMembers.length ? (
            <div className="flex h-[560px] items-center justify-center text-sm text-muted-foreground">
              No hay especialistas disponibles para mostrar.
            </div>
          ) : !timeSlots.length ? (
            <div className="flex h-[560px] items-center justify-center text-sm text-muted-foreground">
              No hay turnos configurados para la fecha seleccionada.
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-auto">
              <div
                className="grid min-w-[720px]"
                style={{
                  gridTemplateColumns,
                  gridTemplateRows: `auto repeat(${timeSlots.length}, ${ROW_HEIGHT}px)`,
                }}
              >
                <div className="sticky top-0 z-20 border-b border-r border-border/70 bg-white/95 px-3 py-3 backdrop-blur-sm" />
                {visibleStaffMembers.map((staff) => (
                  <div
                    key={staff.id}
                    className="sticky top-0 z-20 border-b border-border/70 bg-white/95 px-4 py-3 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full border border-border"
                        style={{ backgroundColor: getFallbackColor(staff.id) }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {staff.user.firstName} {staff.user.lastName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {staff.specialty || "Especialista"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {timeSlots.map((slot, rowIndex) => (
                  <div key={slot} className="contents">
                    <div
                      className="border-b border-r border-border/70 bg-muted/20 px-3 py-3 text-xs font-medium text-muted-foreground"
                      style={{ gridColumn: 1, gridRow: rowIndex + 2 }}
                    >
                      {slot}
                    </div>
                    {visibleStaffMembers.map((staff, staffIndex) => {
                      const isCovered = hasScheduleCoverage(staff.id, slot);
                      const isDropTarget =
                        Boolean(draggingAppointment) &&
                        draggingAppointment.staffId === staff.id &&
                        Boolean(
                          draggingAppointment.duration &&
                            getMatchingSchedule(staff.id, slot, draggingAppointment.duration),
                        ) &&
                        !isPending;

                      return (
                        <div
                          key={`${staff.id}-${slot}`}
                          className={`relative border-b border-border/70 ${
                            isCovered ? "bg-white" : "bg-muted/10"
                          } ${isDropTarget ? "ring-2 ring-rose-200 ring-inset" : ""}`}
                          style={{
                            gridColumn: staffIndex + 2,
                            gridRow: rowIndex + 2,
                          }}
                          onDragOver={(event) => {
                            if (isDropTarget) {
                              event.preventDefault();
                            }
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            if (isDropTarget) {
                              moveAppointment(staff.id, slot);
                            }
                          }}
                        >
                          {isCovered ? (
                            <div className="absolute inset-y-0 left-0 w-1 bg-rose-100/80" />
                          ) : null}
                          {isDropTarget ? (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] font-medium text-rose-500">
                              Soltar aquí
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {visibleStaffMembers.flatMap((staff, staffIndex) =>
                  (appointmentsByStaff.get(staff.id) || []).map((appointment) => {
                    if (!appointment.startTime || !appointment.duration) {
                      return null;
                    }

                    const startIndex = slotIndexMap.get(appointment.startTime);
                    if (startIndex === undefined) {
                      return null;
                    }

                    const color = getAppointmentColor(appointment);
                    const blockSpan = Math.max(Math.ceil(appointment.duration / 30), 1);

                    return (
                      <div
                        key={appointment.id}
                        draggable={canDragAppointment(appointment, currentUser)}
                        onDragStart={() => setDraggingAppointmentId(appointment.id)}
                        onDragEnd={() => setDraggingAppointmentId(null)}
                        className={`relative z-10 m-1 rounded-2xl border px-3 py-2 shadow-sm ${
                          canDragAppointment(appointment, currentUser)
                            ? "cursor-grab active:cursor-grabbing"
                            : "cursor-default"
                        }`}
                        style={{
                          gridColumn: staffIndex + 2,
                          gridRow: `${startIndex + 2} / span ${blockSpan}`,
                          borderColor: hexToRgba(color, 0.42),
                          backgroundColor:
                            appointment.status === AppointmentStatus.CONFIRMED
                              ? hexToRgba(color, 0.16)
                              : "rgba(251, 191, 36, 0.18)",
                          minHeight: ROW_HEIGHT - 8,
                        }}
                      >
                        <div
                          className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
                          style={{ backgroundColor: color }}
                        />
                        <div className="ml-2 flex h-full items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {appointment.patient.firstName} {appointment.patient.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {appointment.startTime} - {appointment.endTime}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {appointment.duration} min
                            </p>
                          </div>
                          {canDragAppointment(appointment, currentUser) ? (
                            <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          ) : null}
                        </div>
                      </div>
                    );
                  }),
                )}
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
                  <p className="mt-2 text-xs text-muted-foreground">
                    {appointment.staff?.user
                      ? `${appointment.staff.user.firstName} ${appointment.staff.user.lastName}`
                      : "Sin especialista"}
                  </p>
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
              <p>En vista Todos, la cita se mueve dentro de la columna de su mismo especialista.</p>
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
