"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Loader2,
  MousePointerClick,
  Stethoscope,
  UserRound,
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

const ROW_HEIGHT = 40;
const ALL_STAFF_VALUE = "__ALL__";
const MANAGER_ROLES = [Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR];
const STAFF_COLORS = [
  "#EC4899",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#14B8A6",
  "#6366F1",
];

const STATUS_LABELS: Record<string, string> = {
  [AppointmentStatus.CONFIRMED]: "Confirmada",
  [AppointmentStatus.PENDING_CONFIRMATION]: "Por coordinar",
  [AppointmentStatus.ATTENDED]: "Atendida",
  [AppointmentStatus.CANCELLED]: "Cancelada",
  [AppointmentStatus.RESCHEDULED]: "Reprogramada",
};

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

function getStaffColor(staffId: string) {
  let hash = 0;
  for (const char of staffId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return STAFF_COLORS[hash % STAFF_COLORS.length];
}

function withAlpha(hex: string, alpha: number) {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

function overlaps(appointment: Appointment, start: number, end: number) {
  if (!appointment.startTime) return false;
  const bookedStart = timeToMins(appointment.startTime);
  const bookedEnd = appointment.endTime
    ? timeToMins(appointment.endTime)
    : bookedStart + (appointment.duration || 0);
  return bookedStart < end && bookedEnd > start;
}

function isOnCalendar(appointment: Appointment) {
  return (
    Boolean(appointment.startTime && appointment.duration) &&
    appointment.status !== AppointmentStatus.CANCELLED &&
    appointment.status !== AppointmentStatus.RESCHEDULED
  );
}

interface Props {
  currentUser: User | null;
  staffMembers: Staff[];
  patients: Patient[];
  /** Show a single professional's agenda without the specialist picker. */
  lockedStaffId?: string;
  /** View only: no double-click booking and no drag to reschedule. */
  readOnly?: boolean;
}

export function AppointmentsCalendarBoard({
  currentUser,
  staffMembers,
  patients,
  lockedStaffId,
  readOnly = false,
}: Props) {
  const canManage =
    !readOnly &&
    Boolean(currentUser?.roles?.some((role) => MANAGER_ROLES.includes(role)));

  const professionals = useMemo(() => {
    const doctors = staffMembers.filter((staff) => staff.user.roles.includes(Role.DOCTOR));
    const list = doctors.length > 0 ? doctors : staffMembers;
    return [...list].sort((a, b) =>
      `${a.user.firstName} ${a.user.lastName}`.localeCompare(
        `${b.user.firstName} ${b.user.lastName}`,
        "es",
      ),
    );
  }, [staffMembers]);

  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [pickedStaffId, setPickedStaffId] = useState(ALL_STAFF_VALUE);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [newAppointment, setNewAppointment] = useState<AppointmentFormDefaults | null>(null);
  const [viewing, setViewing] = useState<Appointment | null>(null);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedStaffId =
    lockedStaffId ??
    (professionals.some((staff) => staff.id === pickedStaffId) ? pickedStaffId : ALL_STAFF_VALUE);
  const staffFilter = selectedStaffId === ALL_STAFF_VALUE ? undefined : selectedStaffId;

  const visibleStaff = useMemo(() => {
    if (lockedStaffId) return staffMembers.filter((staff) => staff.id === lockedStaffId);
    if (!staffFilter) return professionals;
    return professionals.filter((staff) => staff.id === staffFilter);
  }, [lockedStaffId, professionals, staffFilter, staffMembers]);

  const fetchAppointments = useCallback(async (): Promise<Appointment[]> => {
    const result = await getAppointmentsListAction({ date: selectedDate, staffId: staffFilter });
    if (!result.success) {
      toast.error("No se pudo cargar la agenda", { description: result.error });
      return [];
    }
    return result.data || [];
  }, [selectedDate, staffFilter]);

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

  const visibleIds = useMemo(() => new Set(visibleStaff.map((staff) => staff.id)), [visibleStaff]);

  const byStaff = useMemo(() => {
    const grouped = new Map<string, Appointment[]>();
    appointments.forEach((appointment) => {
      if (!visibleIds.has(appointment.staffId) || !isOnCalendar(appointment)) return;
      grouped.set(appointment.staffId, [...(grouped.get(appointment.staffId) || []), appointment]);
    });
    return grouped;
  }, [appointments, visibleIds]);

  const calendarCount = useMemo(
    () => [...byStaff.values()].reduce((total, list) => total + list.length, 0),
    [byStaff],
  );

  const pendingAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          visibleIds.has(appointment.staffId) &&
          !appointment.startTime &&
          appointment.status === AppointmentStatus.PENDING_CONFIRMATION,
      ),
    [appointments, visibleIds],
  );

  const isToday = selectedDate === todayISO();
  const isPastDay = selectedDate < todayISO();

  // Once a day is loaded, scroll to "now" (today) or to the first appointment.
  useEffect(() => {
    if (isLoading || !scrollRef.current) return;
    const firstStart = Math.min(
      ...[...byStaff.values()].flat().map((appointment) => timeToMins(appointment.startTime!)),
    );
    const now = new Date();
    const target = isToday ? now.getHours() * 60 + now.getMinutes() : firstStart;
    const row = Number.isFinite(target)
      ? Math.floor((target - timeToMins(CLINIC_OPENING_TIME)) / SLOT_MINUTES) - 1
      : 0;
    scrollRef.current.scrollTop = Math.max(row, 0) * ROW_HEIGHT;
    // Only when a new day/filter finishes loading, not on every data refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, loadedKey]);

  function isSlotInPast(slot: string) {
    if (isPastDay) return true;
    if (!isToday) return false;
    const now = new Date();
    return timeToMins(slot) <= now.getHours() * 60 + now.getMinutes();
  }

  function isSlotFree(staffId: string, slot: string, duration: number, excludeId?: string) {
    const start = timeToMins(slot);
    return !(byStaff.get(staffId) || []).some(
      (appointment) =>
        appointment.id !== excludeId &&
        appointment.status === AppointmentStatus.CONFIRMED &&
        overlaps(appointment, start, start + duration),
    );
  }

  const dragging = draggingId ? appointments.find((item) => item.id === draggingId) : undefined;

  function canDropOn(staffId: string, slot: string) {
    if (!dragging?.duration || isPending) return false;
    return (
      dragging.staffId === staffId &&
      fitsClinicDay(slot, dragging.duration) &&
      !isSlotInPast(slot) &&
      isSlotFree(staffId, slot, dragging.duration, dragging.id)
    );
  }

  function openNewAppointment(staffId: string, slot: string) {
    if (!canManage) return;
    if (isSlotInPast(slot)) {
      toast.info("Esa hora ya pasó", { description: "Elige un espacio libre más adelante." });
      return;
    }
    if (!isSlotFree(staffId, slot, SLOT_MINUTES)) return;
    setNewAppointment({ staffId, date: selectedDate, startTime: slot });
  }

  function moveAppointment(staffId: string, startTime: string) {
    const appointment = dragging;
    if (!appointment?.duration || appointment.staffId !== staffId) return;

    startTransition(async () => {
      const result = await rescheduleAppointmentAction(appointment.id, {
        date: selectedDate,
        startTime,
        duration: appointment.duration || undefined,
      });
      if (result.success) {
        toast.success("Cita reprogramada", {
          description: `${appointment.patient.firstName} ${appointment.patient.lastName} · ${startTime}`,
        });
        await loadAppointments();
      } else {
        toast.error("No se pudo mover la cita", { description: result.error });
      }
      setDraggingId(null);
    });
  }

  const columns = Math.max(visibleStaff.length, 1);

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            aria-label="Día anterior"
            onClick={() => setSelectedDate((date) => shiftDate(date, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            className="h-9"
            onClick={() => setSelectedDate(todayISO())}
            disabled={isToday}
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            aria-label="Día siguiente"
            onClick={() => setSelectedDate((date) => shiftDate(date, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
          <h3 className="ml-2 truncate text-base font-semibold capitalize">
            {formatDayTitle(selectedDate)}
          </h3>
          <Badge variant="secondary" className="ml-1 shrink-0">
            {calendarCount} cita{calendarCount !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Input
            type="date"
            aria-label="Ir a fecha"
            className="h-9 w-40"
            value={selectedDate}
            onChange={(event) => event.target.value && setSelectedDate(event.target.value)}
          />
          {!lockedStaffId ? (
            <Select value={selectedStaffId} onValueChange={setPickedStaffId}>
              <SelectTrigger size="sm" aria-label="Especialista" className="h-9 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value={ALL_STAFF_VALUE}>Todos los especialistas</SelectItem>
                {professionals.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.user.firstName} {staff.user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </div>

      {/* Hint + pending */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5">
          {canManage ? (
            <>
              <MousePointerClick className="size-3.5" />
              Doble clic en un espacio libre para agendar · arrastra una cita para moverla
            </>
          ) : (
            <>
              <Eye className="size-3.5" />
              Haz clic en una cita para ver el detalle
            </>
          )}
        </p>
        {pendingAppointments.length ? (
          <p className="font-medium text-amber-700">
            {pendingAppointments.length} por coordinar hora
          </p>
        ) : null}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Cargando agenda…
        </div>
      ) : !visibleStaff.length ? (
        <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
          No hay especialistas registrados.
        </div>
      ) : (
        <div
          ref={scrollRef}
          className={cn(
            "dialog-scroll overflow-auto",
            readOnly ? "max-h-[440px]" : "max-h-[65vh]",
          )}
        >
          <div
            className="grid select-none"
            style={{
              gridTemplateColumns: `56px repeat(${columns}, minmax(150px, 1fr))`,
              gridTemplateRows: `auto repeat(${CLINIC_SLOTS.length}, ${ROW_HEIGHT}px)`,
              minWidth: 56 + columns * 150,
            }}
          >
            <div className="sticky top-0 left-0 z-30 border-r border-b bg-card" />
            {visibleStaff.map((staff) => (
              <div
                key={staff.id}
                className="sticky top-0 z-20 flex min-w-0 items-center justify-center gap-2 border-b border-l bg-card px-3 py-2.5"
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: getStaffColor(staff.id) }}
                />
                <div className="min-w-0 text-center">
                  <p className="truncate text-sm font-semibold">
                    {staff.user.firstName} {staff.user.lastName}
                  </p>
                  {staff.specialty ? (
                    <p className="truncate text-[11px] text-muted-foreground">{staff.specialty}</p>
                  ) : null}
                </div>
              </div>
            ))}

            {CLINIC_SLOTS.map((slot, rowIndex) => {
              const isHour = slot.endsWith(":00");
              const past = isSlotInPast(slot);
              return (
                <div key={slot} className="contents">
                  <div
                    className="sticky left-0 z-10 border-r bg-card pr-2 text-right text-[11px] text-muted-foreground tabular-nums"
                    style={{ gridColumn: 1, gridRow: rowIndex + 2 }}
                  >
                    {isHour ? <span className="relative -top-2 bg-card px-0.5">{slot}</span> : null}
                  </div>
                  {visibleStaff.map((staff, staffIndex) => {
                    const dropTarget = canDropOn(staff.id, slot);
                    return (
                      <div
                        key={`${staff.id}-${slot}`}
                        className={cn(
                          "group/cell relative border-l",
                          isHour ? "border-t" : "border-t border-t-border/40 border-dashed",
                          past && "bg-muted/40",
                          canManage && !past && "cursor-pointer hover:bg-primary/5",
                          dropTarget && "bg-primary/10 ring-2 ring-primary/40 ring-inset",
                        )}
                        style={{ gridColumn: staffIndex + 2, gridRow: rowIndex + 2 }}
                        onDoubleClick={() => openNewAppointment(staff.id, slot)}
                        onDragOver={(event) => dropTarget && event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (dropTarget) moveAppointment(staff.id, slot);
                        }}
                      >
                        {canManage && !past && !dragging ? (
                          <span className="pointer-events-none absolute inset-0 hidden items-center justify-center text-[11px] font-medium text-primary group-hover/cell:flex">
                            + {slot}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {visibleStaff.flatMap((staff, staffIndex) =>
              (byStaff.get(staff.id) || []).map((appointment) => {
                const startIndex = CLINIC_SLOTS.indexOf(appointment.startTime!);
                if (startIndex < 0) return null;

                const color = getStaffColor(appointment.staffId);
                const span = Math.max(Math.ceil(appointment.duration! / SLOT_MINUTES), 1);
                const draggable =
                  canManage && appointment.status !== AppointmentStatus.ATTENDED;
                const attended = appointment.status === AppointmentStatus.ATTENDED;

                return (
                  <button
                    key={appointment.id}
                    type="button"
                    draggable={draggable}
                    onDragStart={() => setDraggingId(appointment.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onDoubleClick={(event) => event.stopPropagation()}
                    onClick={() => setViewing(appointment)}
                    className={cn(
                      "relative z-10 mx-1 my-0.5 min-w-0 overflow-hidden rounded-md px-2 py-1 text-left text-white shadow-sm transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                      draggingId === appointment.id && "opacity-50",
                    )}
                    style={{
                      gridColumn: staffIndex + 2,
                      gridRow: `${startIndex + 2} / span ${span}`,
                      backgroundColor: attended ? withAlpha(color, 0.55) : color,
                    }}
                  >
                    <p className="truncate text-xs font-semibold leading-tight">
                      {appointment.patient.firstName} {appointment.patient.lastName}
                    </p>
                    <p className="truncate text-[11px] leading-tight opacity-90 tabular-nums">
                      {appointment.startTime} – {appointment.endTime}
                      {attended ? " · Atendida" : ""}
                    </p>
                  </button>
                );
              }),
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 border-t px-4 py-2 text-[11px] text-muted-foreground">
        <span className="shrink-0">
          Atención de {CLINIC_OPENING_TIME} a {CLINIC_CLOSING_TIME}
        </span>
        {pendingAppointments.length ? (
          <span className="truncate">
            Por coordinar:{" "}
            {pendingAppointments
              .map((appointment) => `${appointment.patient.firstName} ${appointment.patient.lastName}`)
              .join(", ")}
          </span>
        ) : null}
      </div>

      {/* Appointment detail */}
      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-md">
          {viewing ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {viewing.patient.firstName} {viewing.patient.lastName}
                </DialogTitle>
                <DialogDescription>Documento {viewing.patient.document}</DialogDescription>
              </DialogHeader>
              <dl className="grid gap-2 text-sm">
                <DetailRow icon={Stethoscope} label="Especialista">
                  {viewing.staff?.user
                    ? `${viewing.staff.user.firstName} ${viewing.staff.user.lastName}`
                    : "Sin asignar"}
                  {viewing.staff?.specialty ? ` · ${viewing.staff.specialty}` : ""}
                </DetailRow>
                <DetailRow icon={CalendarDays} label="Fecha">
                  <span className="capitalize">{formatDayTitle(viewing.date)}</span>
                </DetailRow>
                <DetailRow icon={Clock} label="Horario">
                  {viewing.startTime
                    ? `${viewing.startTime} – ${viewing.endTime} (${viewing.duration} min)`
                    : "Por coordinar"}
                </DetailRow>
                <DetailRow icon={UserRound} label="Estado">
                  {STATUS_LABELS[viewing.status] ?? viewing.status}
                </DetailRow>
              </dl>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* New appointment from double-click */}
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

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-medium">{children}</dd>
      </div>
    </div>
  );
}
