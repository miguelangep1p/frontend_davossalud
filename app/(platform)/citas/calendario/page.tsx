import { redirect } from "next/navigation";
import { AddAppointmentButton } from "@/components/appointments/add-appointment-button";
import { AppointmentsCalendarBoard } from "@/components/appointments/appointments-calendar-board";
import { PageErrorState } from "@/components/layout/page-error-state";
import { PageHeader } from "@/components/layout/page-header";
import { getSession } from "@/lib/actions/auth.actions";
import { getUserProfileAction } from "@/lib/actions/user.actions";
import { getPatientsList } from "@/lib/services/patient";
import { getStaffList } from "@/lib/services/staff";
import { Patient } from "@/types/patient";
import { Staff } from "@/types/staff";

export const metadata = {
  title: "Calendario de Citas | Davos Salud",
  description: "Agenda diaria por especialista.",
};

export default async function AppointmentsCalendarPage() {
  const token = await getSession();
  if (!token) {
    redirect("/login");
  }

  let staffMembers: Staff[] = [];
  let patients: Patient[] = [];
  let errorMessage: string | null = null;

  const currentUser = await getUserProfileAction();
  try {
    [staffMembers, patients] = await Promise.all([
      getStaffList(token),
      getPatientsList(token),
    ]);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    errorMessage =
      error instanceof Error ? error.message : "No se pudo cargar el calendario.";
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Calendario de citas"
        description="Doble clic en un espacio libre para agendar."
        action={<AddAppointmentButton />}
      />
      {errorMessage ? (
        <PageErrorState
          title="No se pudo cargar el calendario"
          description="Intenta recargar la página."
          detail={errorMessage}
        />
      ) : (
        <AppointmentsCalendarBoard
          currentUser={currentUser}
          staffMembers={staffMembers}
          patients={patients}
        />
      )}
    </div>
  );
}
