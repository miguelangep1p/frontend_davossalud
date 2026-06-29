import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth.actions";
import { getAppointmentsList } from "@/lib/services/appointment";
import { AddAppointmentButton } from "@/components/appointments/add-appointment-button";
import { AppointmentsCalendarLink } from "@/components/appointments/appointments-calendar-link";
import { AppointmentsTable } from "@/components/appointments/appointments-table";
import { PageErrorState } from "@/components/layout/page-error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Appointment } from "@/types/appointment";

export default async function AppointmentsPage(props: {
  searchParams: Promise<{ date?: string; staffId?: string; status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const token = await getSession();
  let appointments: Appointment[] = [];
  let errorMessage: string | null = null;

  if (!token) {
    redirect("/login");
  }

  try {
    appointments = await getAppointmentsList(token, searchParams);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo cargar la lista de citas.";
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Gestión de citas"
        description="Administra la agenda, coordina horarios y gestiona el ciclo completo de las citas clínicas."
        action={
          <div className="flex flex-wrap gap-3">
            <AppointmentsCalendarLink />
            <AddAppointmentButton />
          </div>
        }
      />

      {errorMessage ? (
        <PageErrorState
          title="No se pudieron cargar las citas"
          description="La página se mantuvo estable, pero el backend devolvió un error al consultar la agenda."
          detail={errorMessage}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <AppointmentsTable data={appointments} />
        </div>
      )}
    </div>
  );
}
