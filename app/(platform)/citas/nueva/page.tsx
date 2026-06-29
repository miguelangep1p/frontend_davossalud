import { redirect } from "next/navigation";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { PageErrorState } from "@/components/layout/page-error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/actions/auth.actions";
import { getPatientsList } from "@/lib/services/patient";
import { getStaffList } from "@/lib/services/staff";
import { Patient } from "@/types/patient";
import { Staff } from "@/types/staff";

export default async function NewAppointmentPage() {
  const token = await getSession();
  let patients: Patient[] = [];
  let staffMembers: Staff[] = [];
  let errorMessage: string | null = null;

  if (!token) {
    redirect("/login");
  }

  try {
    patients = await getPatientsList(token);
    staffMembers = await getStaffList(token);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }

    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudieron cargar los datos base de la cita.";
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <PageHeader
        title="Agendar nueva cita"
        description="Completa los datos necesarios para registrar una nueva reserva."
      />

      {errorMessage ? (
        <PageErrorState
          title="No se pudo preparar el formulario"
          description="La interfaz se mantuvo estable, pero faltan datos para registrar la cita."
          detail={errorMessage}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Datos de la cita</CardTitle>
            <CardDescription>
              Verifica la disponibilidad del especialista antes de confirmar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppointmentForm patients={patients} staffMembers={staffMembers} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
