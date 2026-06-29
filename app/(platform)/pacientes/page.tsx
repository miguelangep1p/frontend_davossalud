import { getSession } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { getPatientsList } from "@/lib/services/patient";
import { PatientsTable } from "@/components/patients/patients-table";
import { AddPatientButton } from "@/components/patients/add-patient-button";
import { Patient } from "@/types/patient";
import { PageErrorState } from "@/components/layout/page-error-state";
import { PageHeader } from "@/components/layout/page-header";

export default async function PatientsPage() {
  const token = await getSession();
  let patients: Patient[] = [];
  let errorMessage: string | null = null;

  if (!token) redirect("/login");

  try {
    patients = await getPatientsList(token);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo cargar la lista de pacientes.";
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Gestión de Pacientes"
        description="Administra la información general, alertas y trazabilidad clínica básica de tus pacientes."
        action={<AddPatientButton />}
      />

      {errorMessage ? (
        <PageErrorState
          title="No se pudieron cargar los pacientes"
          description="La página siguió operativa, pero el backend no respondió correctamente al consultar el padrón de pacientes."
          detail={errorMessage}
        />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <PatientsTable data={patients} />
        </div>
      )}
    </div>
  );
}
