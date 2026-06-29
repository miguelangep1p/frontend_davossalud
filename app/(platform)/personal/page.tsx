import { AddStaffButton } from "@/components/staff/add-staff-button";
import { StaffTable } from "@/components/staff/staff-table";
import { getStaffList } from "@/lib/services/staff";
import { getSession } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { Staff } from "@/types/staff";
import { PageHeader } from "@/components/layout/page-header";
import { PageErrorState } from "@/components/layout/page-error-state";

export default async function StaffPage() {
  const token = await getSession();
  let staff: Staff[] = [];
  let errorMessage: string | null = null;

  if (!token) redirect("/login");

  try {
    staff = await getStaffList(token);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo cargar la lista de personal.";
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Personal"
        description="Gestiona los perfiles del equipo, su información operativa y sus datos de contacto."
        action={<AddStaffButton />}
      />

      {errorMessage ? (
        <PageErrorState
          title="No se pudo cargar el personal"
          description="El módulo se mantuvo estable, pero no fue posible consultar la lista de miembros del equipo."
          detail={errorMessage}
        />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <StaffTable data={staff} />
        </div>
      )}
    </div>
  );
}
