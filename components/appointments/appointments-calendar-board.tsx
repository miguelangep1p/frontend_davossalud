"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Loader2,
  MousePointerClick,
  MoveRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAppointmentsListAction,
  rescheduleAppointmentAction,
} from "@/lib/actions/appointment.actions";
import {
  CLINIC_CLOSING_TIME,
  CLINIC_OPENING_TIME,
  CLINIC_SLOTS,
  SLOT_MINUTES,
  fitsClinicDay,
  timeToMins,
  todayISO,
} from "@/lib/clinic-hours";
import { cn } from "@/lib/utils";
import { Appointment, AppointmentStatus } from "@/types/appointment";
import { Patient } from "@/types/patient";
import { Staff } from "@/types/staff";
import { Role, User } from "@/types/user";
import {
  AppointmentForm,
  AppointmentFormDefaults,
} from "@/components/appointments/appointment-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROW_HEIGHT = 44;
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

function shiftDate(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(year, month - 1, day + days);
  const mm = String(next.getMonth() + 1).padStart(2, "0");
  const dd = String(next.getDate()).padStart(2, "0");
  return `${next.getFullYear()}-${mm}-${dd}`;
}

function formatDayTitle(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
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

const APPOINTMENT_MANAGER_ROLES = [Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR];

function canManageAppointments(currentUser: User | null) {
  return Boolean(
    currentUser?.roles?.some((role) => APPOINTMENT_MANAGER_ROLES.includes(role)),
  );
}

function canDragAppointment(appointment: Appointment, currentUser: User | null) {
  if (!canManageAppointments(currentUser)) return false;
  if (!appointment.startTime || !appointment.duration) return false;
  return ![
    AppointmentStatus.CANCELLED,
    AppointmentStatus.ATTENDED,
    AppointmentStatus.RESCHEDULED,
  ].includes(appointment.status);
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

function getStaffColor(staffId: string) {
  let hash = 0;
  for (const char of staffId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

function overlaps(appointment: Appointment, start: number, end: number) {
  if (!appointment.startTime) return false;
  const bookedStart = timeToMins(appointment.startTime);
  const bookedEnd = appointment.endTime
    ? timeToMins(appointment.endTime)
    : bookedStart + (appointment.duration || 0);
  return bookedStart < end && bookedEnd > start;
}

interface Props {
  currentUser: User | null;
  staffMembers: Staff[];
  patients: Patient[];
  /** Show a single professional's agenda without the specialist picker. */
  lockedStaffId?: string;
}

export function AppointmentsCalendarBoard({
  currentUser,
  staffMembers,
  patients,
  lockedStaffId,
}: Props) {
  const doctors = useMemo(() => {
    const staffWithDoctorRole = staffMembers.filter((staff) =>
      staff.user.roles.includes(Role.DOCTOR),
    );

    return staffWithDoctorRole.length > 0 ? staffWithDoctorRole : staffMembers;
  }, [staffMembers]);

  // Doctors without an admin/reception role only see their own agenda
  // (the backend also filters their appointment list to themselves).
  const isDoctor = Boolean(
    currentUser?.roles?.includes(Role.DOCTOR) &&
      !currentUser.roles.includes(Role.ADMIN) &&
      !currentUser.roles.includes(Role.RECEPTIONIST),
  );
  const canCreate = canManageAppointments(currentUser);

  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [pickedStaffId, setSelectedStaffId] = useState(ALL_STAFF_VALUE);
  const selectedStaffId =
    lockedStaffId ??
    (isDoctor
      ? currentUser?.staff?.id || ""
      : doctors.some((doctor) => doctor.id === pickedStaffId)
        ? pickedStaffId
        : ALL_STAFF_VALUE);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [draggingAppointmentId, setDraggingAppointmentId] = useState<string | null>(null);
  const [newAppointment, setNewAppointment] = useState<AppointmentFormDefaults | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleStaffMembers = useMemo(() => {
    if (lockedStaffId) {
      return staffMembers.filter((staff) => staff.id === lockedStaffId);
    }
    if (selectedStaffId === ALL_STAFF_VALUE) {
      return doctors;
    }
    return doctors.filter((staff) => staff.id === selectedStaffId);
  }, [doctors, lockedStaffId, selectedStaffId, staffMembers]);

  const visibleStaffIds = useMemo(
    () => new Set(visibleStaffMembers.map((staff) => staff.id)),
    [visibleStaffMembers],
  );

  const resolvedStaffId =
    selectedStaffId === ALL_STAFF_VALUE ? undefined : selectedStaffId;

  const fetchAppointments = useCallback(async (): Promise<Appointment[]> => {
    if (!selectedDate || (!resolvedStaffId && selectedStaffId !== ALL_STAFF_VALUE)) {
      return [];
    }

    const result = await getAppointmentsListAction({
      date: selectedDate,
      staffId: resolvedStaffId,
    });

    if (!result.success) {
      toast.error("No se pudo cargar el calendario", { description: result.error });
      return [];
    }
    return result.data || [];
  }, [resolvedStaffId, selectedDate, selectedStaffId]);

  const loadAppointments = useCallback(async () => {
    setAppointments(await fetchAppointments());
  }, [fetchAppointments]);

  const requestKey = `${selectedDate}|${selectedStaffId}`;
  const isLoading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    fetchAppointments().then((data) => {
      if (cancelled) return;
      setAppointments(data);
      setLoadedKey(requestKey);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchAppointments, requestKey]);

  const filteredAppointments = useMemo(
    () => appointments.filter((appointment) => visibleStaffIds.has(appointment.staffId)),
    [appointments, visibleStaffIds],
  );

  const scheduledAppointments = useMemo(
    () =>
      filteredAppointments.filter(
        (appointment) =>
          appointment.startTime &&
          appointment.duration &&
          appointment.status !== AppointmentStatus.RESCHEDULED &&
          appointment.status !== AppointmentStatus.CANCELLED,
      ),
    [filteredAppointments],
  );

  const unscheduledAppointments = useMemo(
    () =>
      filteredAppointments.filter(
        (appointment) =>
          (!appointment.startTime || !appointment.duration) &&
          appointment.status === AppointmentStatus.PENDING_CONFIRMATION,
      ),
    [filteredAppointments],
  );

  const slotIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    CLINIC_SLOTS.forEach((slot, index) => map.set(slot, index));
    return map;
  }, []);

  const appointmentsByStaff = useMemo(() => {
    const grouped = new Map<string, Appointment[]>();
    scheduledAppointments.forEach((appointment) => {
      const current = grouped.get(appointment.staffId) || [];
      current.push(appointment);
      grouped.set(appointment.staffId, current);
    });
    return grouped;
  }, [scheduledAppointments]);

  const draggingAppointment = useMemo(
    () =>
      appointments.find((appointment) => appointment.id === draggingAppointmentId) || null,
    [appointments, draggingAppointmentId],
  );

  const isToday = selectedDate === todayISO();
  const isPastDay = selectedDate < todayISO();
  const nowMins = (() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  })();

  function isSlotInPast(slot: string) {
    return isPastDay || (isToday && timeToMins(slot) <= nowMins);
  }

  function isSlotFree(staffId: string, slot: string, duration: number, excludeId?: string) {
    const start = timeToMins(slot);
    const end = start + duration;
    return !(appointmentsByStaff.get(staffId) || []).some(
      (appointment) =>
        appointment.id !== excludeId &&
        appointment.status === AppointmentStatus.CONFIRMED &&
        overlaps(appointment, start, end),
    );
  }

  function canDropOn(staffId: string, slot: string) {
    if (!draggingAppointment?.duration || isPending) return false;
    return (
      draggingAppointment.staffId === staffId &&
      fitsClinicDay(slot, draggingAppointment.duration) &&
      !isSlotInPast(slot) &&
      isSlotFree(staffId, slot, draggingAppointment.duration, draggingAppointment.id)
    );
  }

  function openNewAppointment(staffId: string, slot: string) {
    if (!canCreate) return;
    if (isSlotInPast(slot)) {
      toast.info("No puedes agendar en una hora pasada");
      return;
    }
    if (!isSlotFree(staffId, slot, SLOT_MINUTES)) return;
    setNewAppointment({ staffId, date: selectedDate, startTime: slot });
  }

  function moveAppointment(staffId: string, targetStartTime: string) {
    if (!draggingAppointment || !draggingAppointment.duration) return;

    if (draggingAppointment.staffId !== staffId) {
      toast.error("La cita solo se puede mover dentro del mismo especialista.");
      return;
    }

    const appointment = draggingAppointment;
    startTransition(async () => {
      const result = await rescheduleAppointmentAction(appointment.id, {
        date: selectedDate,
        startTime: targetStartTime,
        duration: appointment.duration || undefined,
      });

      if (result.success) {
        toast.success("Cita reprogramada", {
          description: `${appointment.patient.firstName} ${appointment.patient.lastName} · ${targetStartTime}`,
        });
        await loadAppointments();
      } else {
        toast.error("No se pudo mover la cita", { description: result.error });
      }
      setDraggingAppointmentId(null);
    });
  }

  const gridTemplateColumns = `72px repeat(${Math.max(visibleStaffMembers.length, 1)}, minmax(220px, 1fr))`;

  return (
    <div className={cn("grid gap-6", !lockedStaffId && "xl:grid-cols-[minmax(0,1fr)_300px]")}>
      <Card className="gap-0 overflow-hidden border-border/70 py-0 shadow-sm">
        <CardHeader className="gap-4 border-b border-border/70 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Día anterior"
                onClick={() => setSelectedDate((date) => shiftDate(date, -1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Día siguiente"
                onClick={() => setSelectedDate((date) => shiftDate(date, 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedDate(todayISO())}
                disabled={isToday}
              >
                Hoy
              </Button>
              <CardTitle className="ml-1 text-lg capitalize">
                {formatDayTitle(selectedDate)}
              </CardTitle>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="date"
                aria-label="Fecha"
                className="sm:w-44"
                value={selectedDate}
                onChange={(event) => event.target.value && setSelectedDate(event.target.value)}
              />
              {!lockedStaffId ? (
                <Select
                  value={selectedStaffId}
                  onValueChange={setSelectedStaffId}
                  disabled={isDoctor}
                >
                  <SelectTrigger aria-label="Especialista" className="sm:w-56">
                    <SelectValue placeholder="Especialista" />
                  </SelectTrigger>
                  <SelectContent>
                    {!isDoctor ? (
                      <SelectItem value={ALL_STAFF_VALUE}>Todos los especialistas</SelectItem>
                    ) : null}
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.user.firstName} {doctor.user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
          </div>
          {canCreate ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MousePointerClick className="size-3.5" />
              Doble clic en un espacio libre para agendar · arrastra una cita para moverla
            </p>
          ) : null}
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-[480px] items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Cargando calendario…
            </div>
          ) : !visibleStaffMembers.length ? (
            <div className="flex h-[480px] items-center justify-center text-sm text-muted-foreground">
              No hay especialistas para mostrar.
            </div>
          ) : (
            <div className="dialog-scroll max-h-[70vh] overflow-auto">
              <div
                className="grid min-w-[520px] select-none"
                style={{
                  gridTemplateColumns,
                  gridTemplateRows: `auto repeat(${CLINIC_SLOTS.length}, ${ROW_HEIGHT}px)`,
                }}
              >
                <div className="sticky top-0 left-0 z-30 border-r border-b border-border/70 bg-card" />
                {visibleStaffMembers.map((staff) => (
                  <div
                    key={staff.id}
                    className="sticky top-0 z-20 border-b border-border/70 bg-card/95 px-4 py-3 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: getStaffColor(staff.id) }}
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

                {CLINIC_SLOTS.map((slot, rowIndex) => {
                  const isHour = slot.endsWith(":00");
                  const past = isSlotInPast(slot);
                  return (
                    <div key={slot} className="contents">
                      <div
                        className={cn(
                          "sticky left-0 z-10 border-r border-border/70 bg-card px-3 pt-1 text-right text-xs tabular-nums",
                          isHour ? "font-medium text-foreground" : "text-muted-foreground/60",
                        )}
                        style={{ gridColumn: 1, gridRow: rowIndex + 2 }}
                      >
                        {slot}
                      </div>
                      {visibleStaffMembers.map((staff, staffIndex) => {
                        const isDropTarget = canDropOn(staff.id, slot);
                        return (
                          <div
                            key={`${staff.id}-${slot}`}
                            className={cn(
                              "group/cell relative border-border/60",
                              isHour ? "border-t" : "border-t border-dashed border-t-border/40",
                              past ? "bg-muted/40" : canCreate && "cursor-pointer hover:bg-primary/5",
                              isDropTarget && "bg-primary/5 ring-2 ring-primary/30 ring-inset",
                            )}
                            style={{ gridColumn: staffIndex + 2, gridRow: rowIndex + 2 }}
                            onDoubleClick={() => openNewAppointment(staff.id, slot)}
                            onDragOver={(event) => {
                              if (isDropTarget) event.preventDefault();
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              if (isDropTarget) moveAppointment(staff.id, slot);
                            }}
                          >
                            {canCreate && !past && !draggingAppointment ? (
                              <span className="pointer-events-none absolute inset-0 hidden items-center px-3 text-xs text-primary/70 group-hover/cell:flex">
                                + {slot}
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {visibleStaffMembers.flatMap((staff, staffIndex) =>
                  (appointmentsByStaff.get(staff.id) || []).map((appointment) => {
                    if (!appointment.startTime || !appointment.duration) return null;

                    const startIndex = slotIndexMap.get(appointment.startTime);
                    if (startIndex === undefined) return null;

                    const color = getStaffColor(appointment.staffId);
                    const blockSpan = Math.max(Math.ceil(appointment.duration / SLOT_MINUTES), 1);
                    const draggable = canDragAppointment(appointment, currentUser);
                    const attended = appointment.status === AppointmentStatus.ATTENDED;

                    return (
                      <div
                        key={appointment.id}
                        draggable={draggable}
                        onDragStart={() => setDraggingAppointmentId(appointment.id)}
                        onDragEnd={() => setDraggingAppointmentId(null)}
                        onDoubleClick={(event) => event.stopPropagation()}
                        className={cn(
                          "relative z-10 m-0.5 overflow-hidden rounded-lg border px-2.5 py-1.5 shadow-xs transition-opacity",
                          draggable ? "cursor-grab active:cursor-grabbing" : "cursor-default",
                          draggingAppointmentId === appointment.id && "opacity-50",
                          attended && "opacity-70",
                        )}
                        style={{
                          gridColumn: staffIndex + 2,
                          gridRow: `${startIndex + 2} / span ${blockSpan}`,
                          borderColor: hexToRgba(color, 0.4),
                          backgroundColor: hexToRgba(color, 0.14),
                        }}
                      >
                        <div
                          className="absolute inset-y-0 left-0 w-1"
                          style={{ backgroundColor: color }}
                        />
                        <div className="flex items-start justify-between gap-2 pl-1">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {appointment.patient.firstName} {appointment.patient.lastName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground tabular-nums">
                              {appointment.startTime} – {appointment.endTime}
                              {attended ? " · Atendida" : ""}
                            </p>
                          </div>
                          {draggable ? (
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

      {!lockedStaffId ? (
        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Por coordinar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {unscheduledAppointments.length ? (
                unscheduledAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-xl border border-amber-200 bg-amber-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {appointment.patient.firstName} {appointment.patient.lastName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {appointment.staff?.user
                            ? `${appointment.staff.user.firstName} ${appointment.staff.user.lastName}`
                            : "Sin especialista"}
                        </p>
                      </div>
                      <Badge variant="outline">{getStatusLabel(appointment.status)}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                  Nada pendiente para este día.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Cómo usar el calendario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <MousePointerClick className="mt-0.5 size-4 shrink-0 text-primary" />
                <p>Doble clic en un espacio libre para agendar una cita a esa hora.</p>
              </div>
              <div className="flex gap-2">
                <GripVertical className="mt-0.5 size-4 shrink-0 text-primary" />
                <p>Arrastra una cita a otro espacio libre del mismo especialista para moverla.</p>
              </div>
              <div className="flex gap-2">
                <MoveRight className="mt-0.5 size-4 shrink-0 text-primary" />
                <p>
                  Atención de {CLINIC_OPENING_TIME} a {CLINIC_CLOSING_TIME}. Los espacios grises ya
                  pasaron.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Dialog
        open={newAppointment !== null}
        onOpenChange={(open) => !open && setNewAppointment(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva cita</DialogTitle>
            <DialogDescription>
              Ya elegimos el especialista, la fecha y la hora. Solo falta el paciente.
            </DialogDescription>
          </DialogHeader>
          {newAppointment ? (
            <AppointmentForm
              key={`${newAppointment.staffId}-${newAppointment.date}-${newAppointment.startTime}`}
              patients={patients}
              staffMembers={staffMembers}
              defaults={newAppointment}
              onCancel={() => setNewAppointment(null)}
              onSuccess={() => {
                setNewAppointment(null);
                void loadAppointments();
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
