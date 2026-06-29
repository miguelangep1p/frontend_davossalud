import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth.actions";
import { getMedicalRecordsList } from "@/lib/services/medical-record";
import { MedicalRecord } from "@/types/medical-record";
import { MedicalRecordsTable } from "@/components/medical-records/medical-records-table";
import { MedicalRecordNewDialog } from "@/components/medical-records/medical-record-new-dialog";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Historia Clínica | Davos Salud",
  description: "Gestión de historias clínicas y consultas médicas",
};

export default async function MedicalRecordsPage() {
  const token = await getSession();
  if (!token) redirect("/login");

  let records: MedicalRecord[] = [];
  try {
    records = await getMedicalRecordsList(token);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Historia Clínica"
        description={`Consulta, registra y edita la evolución clínica de tus pacientes. ${records.length} consulta${records.length !== 1 ? "s" : ""} registrada${records.length !== 1 ? "s" : ""}.`}
        action={<MedicalRecordNewDialog />}
      />

      <div className="rounded-xl border bg-card overflow-hidden">
        <MedicalRecordsTable data={records} />
      </div>
    </div>
  );
}
