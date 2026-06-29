import { getSession } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { getTreatmentsList } from "@/lib/services/treatment";
import { AddTreatmentButton } from "@/components/treatments/add-treatment-button";
import { TreatmentsTable } from "@/components/treatments/treatments-table";
import { Treatment } from "@/types/treatment";
import { PageHeader } from "@/components/layout/page-header";
import { PageErrorState } from "@/components/layout/page-error-state";

export default async function TreatmentsPage() {
  const token = await getSession();
  let treatments: Treatment[] = [];
  let errorMessage: string | null = null;

  if (!token) redirect("/login");

  try {
    treatments = await getTreatmentsList(token);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo cargar la lista de tratamientos.";
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Gestión de Tratamientos"
        description="Administra los tratamientos disponibles y mantén una oferta clínica consistente para el equipo."
        action={<AddTreatmentButton />}
      />

      {errorMessage ? (
        <PageErrorState
          title="No se pudieron cargar los tratamientos"
          description="La vista siguió estable, pero el backend devolvió un error al consultar los tratamientos."
          detail={errorMessage}
        />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <TreatmentsTable data={treatments} />
        </div>
      )}
    </div>
  );
}
