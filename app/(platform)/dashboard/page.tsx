import { redirect } from "next/navigation";
import {
  CalendarCheck,
  Clock,
  Stethoscope,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageErrorState } from "@/components/layout/page-error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/actions/auth.actions";
import { DashboardStats, getDashboardStats } from "@/lib/services/dashboard";

export const metadata = {
  title: "Dashboard | Davos Salud",
  description: "Panel de control del sistema de gestión clínica",
};

const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  PENDING_CONFIRMATION: "Por confirmar",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

const APPOINTMENT_STATUS_STYLES: Record<string, string> = {
  COMPLETED:
    "bg-fuchsia-100 text-fuchsia-700 ring-1 ring-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:ring-fuchsia-900",
  CANCELLED:
    "bg-rose-100 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900",
  CONFIRMED:
    "bg-violet-100 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900",
  DEFAULT:
    "bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
};

export default async function DashboardPage() {
  const token = await getSession();
  if (!token) {
    redirect("/login");
  }

  let stats: DashboardStats = {
    totalPatients: 0,
    totalStaff: 0,
    todayAppointments: 0,
    weekAppointments: 0,
    todayIncome: 0,
    todayExpense: 0,
    todayBalance: 0,
    upcomingToday: [],
    last7Days: [],
  };
  let errorMessage: string | null = null;

  try {
    stats = await getDashboardStats(token);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }

    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo cargar el dashboard.";
  }

  const formatCurrency = (value: number) =>
    `S/ ${Number(value).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

  const formattedDate = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statCards = [
    {
      title: "Total de pacientes",
      value: String(stats.totalPatients),
      icon: Users,
      description: "Registrados en el sistema.",
      accent:
        "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    },
    {
      title: "Personal médico",
      value: String(stats.totalStaff),
      icon: Stethoscope,
      description: "Especialistas activos.",
      accent:
        "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300",
    },
    {
      title: "Citas de hoy",
      value: String(stats.todayAppointments),
      icon: CalendarCheck,
      description: `${stats.weekAppointments} programadas esta semana.`,
      accent:
        "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300",
    },
    {
      title: "Ingresos de hoy",
      value: formatCurrency(stats.todayIncome),
      icon: TrendingUp,
      description: `Balance actual: ${formatCurrency(stats.todayBalance)}.`,
      accent:
        "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Dashboard"
        description={`Resumen operativo del día. ${formattedDate}.`}
      />

      {errorMessage ? (
        <PageErrorState
          title="No se pudo cargar el dashboard"
          description="La interfaz se mantuvo estable, pero hubo un problema al consultar el resumen general."
          detail={errorMessage}
        />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <Card
                key={card.title}
                className="overflow-hidden border-border/70 bg-white/90 shadow-sm"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <div className="text-2xl font-bold tracking-tight text-foreground">
                      {card.value}
                    </div>
                  </div>
                  <div className={`rounded-2xl p-3 ${card.accent}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="overflow-hidden rounded-xl border bg-card">
            <div className="flex items-center gap-2 border-b px-6 py-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold text-foreground">
                Citas de hoy
              </h2>
              <span className="ml-auto text-xs text-muted-foreground">
                {stats.upcomingToday.length} cita
                {stats.upcomingToday.length !== 1 ? "s" : ""}
              </span>
            </div>

            {stats.upcomingToday.length > 0 ? (
              <div className="divide-y">
                {stats.upcomingToday.map((appointment) => {
                  const statusClass =
                    APPOINTMENT_STATUS_STYLES[appointment.status] ??
                    APPOINTMENT_STATUS_STYLES.DEFAULT;

                  return (
                    <div
                      key={appointment.id}
                      className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="min-w-[64px] text-sm font-medium text-muted-foreground">
                        {appointment.startTime || "--"}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {appointment.patient.firstName}{" "}
                          {appointment.patient.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {appointment.staff?.user
                            ? `Dr. ${appointment.staff.user.firstName} ${appointment.staff.user.lastName}`
                            : "Especialista por asignar"}
                          {appointment.staff?.specialty
                            ? ` · ${appointment.staff.specialty}`
                            : ""}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                      >
                        {APPOINTMENT_STATUS_LABELS[appointment.status] ??
                          appointment.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                No hay citas programadas para hoy.
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border bg-card">
            <div className="border-b px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">
                Citas de los últimos 7 días
              </h2>
            </div>

            {stats.last7Days.length > 0 ? (
              <div className="flex h-36 items-end gap-2 px-6 py-6">
                {stats.last7Days.map((day) => {
                  const maxCount = Math.max(
                    ...stats.last7Days.map((item) => item.count),
                    1,
                  );
                  const heightPct = (day.count / maxCount) * 100;
                  const label = new Date(`${day.date}T12:00:00`).toLocaleDateString(
                    "es-PE",
                    {
                      weekday: "short",
                    },
                  );

                  return (
                    <div
                      key={day.date}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <span className="text-xs font-semibold text-muted-foreground">
                        {day.count}
                      </span>
                      <div className="flex h-20 w-full items-end rounded-md bg-muted/30 px-1">
                        <div
                          className="w-full rounded-t-md bg-primary/75 transition-all"
                          style={{ height: `${Math.max(heightPct, 6)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium capitalize text-muted-foreground">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                No hay historial suficiente para graficar esta semana.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
