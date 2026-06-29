import { redirect } from "next/navigation";
import { AddAppointmentButton } from "@/components/appointments/add-appointment-button";
import { AppointmentsCalendarBoard } from "@/components/appointments/appointments-calendar-board";
import { PageHeader } from "@/components/layout/page-header";
import { getSession } from "@/lib/actions/auth.actions";
import { getStaffListAction } from "@/lib/actions/staff.actions";
import { getUserProfileAction } from "@/lib/actions/user.actions";

export const metadata = {
  title: "Calendario de Citas | Davos Salud",
  description: "Agenda diaria visual con reprogramación por arrastre.",
};

export default async function AppointmentsCalendarPage() {
  const token = await getSession();
  if (!token) {
    redirect("/login");
  }

  const [currentUser, staffMembers] = await Promise.all([
    getUserProfileAction(),
    getStaffListAction(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Calendario de citas"
        description="Visualiza la agenda diaria por especialista y reprograma citas arrastrando bloques válidos."
        action={<AddAppointmentButton />}
      />
      <AppointmentsCalendarBoard
        currentUser={currentUser}
        staffMembers={staffMembers}
      />
    </div>
  );
}
