import { redirect } from "next/navigation";
import {
  CalendarCheck,
  Stethoscope,
  TrendingUp,
  Users,
} from "lucide-react";
import { AppointmentsCalendarBoard } from "@/components/appointments/appointments-calendar-board";
import { PageErrorState } from "@/components/layout/page-error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/actions/auth.actions";
import { getUserProfileAction } from "@/lib/actions/user.actions";
import { DashboardStats, getDashboardStats } from "@/lib/services/dashboard";
import { getStaffList } from "@/lib/services/staff";
import { Staff } from "@/types/staff";

export const metadata = {
  title: "Dashboard | Davos Salud",
  description: "Panel de control del sistema de gestión clínica",
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
  let staffMembers: Staff[] = [];
  let errorMessage: string | null = null;

  const currentUser = await getUserProfileAction();
  try {
    [stats, staffMembers] = await Promise.all([
      getDashboardStats(token),
      getStaffList(token),
    ]);
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

  const maxAppointments = Math.max(
    ...stats.last7Days.map((item) => item.count),
    1,
  );
  const weeklyTotal = stats.last7Days.reduce((total, day) => total + day.count, 0);
  const dailyAverage = stats.last7Days.length
    ? weeklyTotal / stats.last7Days.length
    : 0;

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
                className="group relative overflow-hidden border-border/60 bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(190,24,93,0.10)]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-400 via-pink-500 to-fuchsia-500 opacity-70" />
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <div className="text-2xl font-bold tracking-tight text-foreground">
                      {card.value}
                    </div>
                  </div>
                  <div className={`rounded-2xl p-3 transition-transform duration-300 group-hover:scale-110 ${card.accent}`}>
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

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">
              Agenda de citas
            </h2>
            <AppointmentsCalendarBoard
              currentUser={currentUser}
              staffMembers={staffMembers}
              patients={[]}
              readOnly
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-sm">
            <div className="flex flex-wrap items-center gap-4 border-b px-6 py-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Actividad de citas
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">Comportamiento de los últimos 7 días</p>
              </div>
              <div className="ml-auto flex gap-6 text-right">
                <div>
                  <p className="text-xl font-bold text-foreground">{weeklyTotal}</p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-rose-600">{dailyAverage.toFixed(1)}</p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Promedio/día</p>
                </div>
              </div>
            </div>

            {stats.last7Days.length > 0 ? (
              <div className="relative px-6 py-6">
                <div className="pointer-events-none absolute inset-x-6 top-6 bottom-12 flex flex-col justify-between">
                  {[100, 75, 50, 25, 0].map((line) => (
                    <div key={line} className="border-t border-dashed border-border/60" />
                  ))}
                </div>
                <div className="relative flex h-48 items-end gap-2 sm:gap-4">
                {stats.last7Days.map((day) => {
                  const heightPct = (day.count / maxAppointments) * 100;
                  const label = new Date(`${day.date}T12:00:00`).toLocaleDateString(
                    "es-PE",
                    {
                      weekday: "short",
                    },
                  );

                  return (
                    <div
                      key={day.date}
                      className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 opacity-80 transition group-hover:opacity-100">
                        {day.count}
                      </span>
                      <div className="flex h-36 w-full max-w-16 items-end overflow-hidden rounded-t-xl bg-rose-50/70">
                        <div
                          title={`${day.count} citas`}
                          className="w-full rounded-t-xl bg-gradient-to-t from-rose-600 via-pink-500 to-fuchsia-400 shadow-[0_-8px_20px_rgba(236,72,153,0.18)] transition-all duration-500 group-hover:brightness-110"
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
