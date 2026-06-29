import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  Calendar,
  CalendarCheck,
  ClipboardList,
  FileText,
  HeartPulse,
  IdCard,
  MapPin,
  MoveLeft,
  Phone,
  ShieldAlert,
  StickyNote,
  Stethoscope,
} from "lucide-react";
import { PageErrorState } from "@/components/layout/page-error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { InfoItem } from "@/components/ui/info-item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/actions/auth.actions";
import { getMedicalRecordsByPatient } from "@/lib/services/medical-record";
import { getPatientById } from "@/lib/services/patient";
import { Gender, Patient } from "@/types/patient";
import { MedicalRecord } from "@/types/medical-record";

export async function generateMetadata() {
  return { title: "Perfil de Paciente | Davos Salud" };
}

function getGenderLabel(gender: Gender) {
  switch (gender) {
    case Gender.FEMALE:
      return "Femenino";
    case Gender.MALE:
      return "Masculino";
    default:
      return "Otro";
  }
}

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await getSession();
  const { id } = await params;

  if (!token) {
    redirect("/login");
  }

  let patient: Patient | null = null;
  let errorMessage: string | null = null;

  try {
    patient = await getPatientById(id, token);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }

    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo cargar el perfil del paciente.";
  }

  let medicalRecords: MedicalRecord[] = [];
  if (patient) {
    try {
      medicalRecords = await getMedicalRecordsByPatient(id, token);
    } catch {
      medicalRecords = [];
    }
  }

  if (!patient) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader
          title="Perfil del paciente"
          description="Resumen clínico y antecedentes relevantes del paciente."
          action={
            <Button asChild variant="outline">
              <Link href="/pacientes">
                <MoveLeft className="mr-2 h-4 w-4" />
                Volver a pacientes
              </Link>
            </Button>
          }
        />
        <PageErrorState
          title="No se pudo cargar el perfil"
          description="El sistema se mantuvo estable, pero la información del paciente no pudo recuperarse."
          detail={errorMessage ?? "Paciente no disponible."}
        />
      </div>
    );
  }

  const initials =
    `${patient.firstName?.[0] || ""}${patient.lastName?.[0] || ""}`.toUpperCase();

  const hasAllergyAlert =
    Boolean(patient.allergies) &&
    patient.allergies?.toLowerCase() !== "ninguna";
  const hasChronicAlert =
    Boolean(patient.chronicDiseases) &&
    patient.chronicDiseases?.toLowerCase() !== "ninguna";

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Perfil del paciente"
        description="Resumen clínico, alertas y consultas registradas."
        action={
          <Button asChild variant="outline">
            <Link href="/pacientes">
              <MoveLeft className="mr-2 h-4 w-4" />
              Volver a pacientes
            </Link>
          </Button>
        }
      />

      <section className="rounded-2xl border bg-card p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Avatar className="h-24 w-24 ring-2 ring-border">
            {patient.profilePhoto ? (
              <AvatarImage src={patient.profilePhoto} alt={`${patient.firstName} ${patient.lastName}`} />
            ) : null}
            <AvatarFallback className="text-2xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {patient.firstName} {patient.lastName}
              </h2>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="font-medium">
                  {getGenderLabel(patient.gender)}
                </Badge>
                {patient.bloodType ? (
                  <Badge variant="outline" className="font-medium">
                    <HeartPulse className="mr-1 h-3 w-3" />
                    {patient.bloodType}
                  </Badge>
                ) : null}
                <Badge variant="outline" className="font-medium">
                  {patient.document}
                </Badge>
              </div>
            </div>

            {hasAllergyAlert || hasChronicAlert ? (
              <div className="flex flex-wrap gap-2">
                {hasAllergyAlert ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                    <ShieldAlert className="h-3 w-3" />
                    Alergias: {patient.allergies}
                  </span>
                ) : null}
                {hasChronicAlert ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                    <Activity className="h-3 w-3" />
                    Condiciones crónicas: {patient.chronicDiseases}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="info" className="gap-2">
            <IdCard className="h-4 w-4" />
            <span className="hidden sm:inline">Información</span>
          </TabsTrigger>
          <TabsTrigger value="historia" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Historia clínica</span>
          </TabsTrigger>
          <TabsTrigger value="recetas" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Recetas</span>
          </TabsTrigger>
          <TabsTrigger value="citas" className="gap-2">
            <CalendarCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Citas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
                <IdCard className="h-4 w-4 text-primary" />
                Información personal
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoItem icon={IdCard} label="Documento" value={patient.document} />
                <InfoItem icon={Calendar} label="Nacimiento" value={patient.birthDate} />
                <InfoItem icon={Phone} label="Teléfono" value={patient.phone} />
                <div className="sm:col-span-2">
                  <InfoItem
                    icon={MapPin}
                    label="Dirección"
                    value={patient.address || "No registrada"}
                  />
                </div>
                {patient.additionalNote ? (
                  <div className="sm:col-span-2">
                    <InfoItem
                      icon={StickyNote}
                      label="Nota adicional"
                      value={patient.additionalNote}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
                <Stethoscope className="h-4 w-4 text-primary" />
                Alertas clínicas
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-300">
                    <ShieldAlert className="h-4 w-4" />
                    Alergias
                  </div>
                  <p
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      hasAllergyAlert
                        ? "border-rose-200 bg-rose-50 font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                        : "border-border bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {patient.allergies || "Sin registros de alergias."}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300">
                    <Activity className="h-4 w-4" />
                    Condiciones crónicas
                  </div>
                  <p
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      hasChronicAlert
                        ? "border-amber-200 bg-amber-50 font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                        : "border-border bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {patient.chronicDiseases || "Sin registros de enfermedades crónicas."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historia" className="mt-6">
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <ClipboardList className="h-4 w-4 text-primary" />
                Consultas registradas
              </h3>
              <span className="text-xs font-medium text-muted-foreground">
                {medicalRecords.length} consulta
                {medicalRecords.length !== 1 ? "s" : ""}
              </span>
            </div>

            {medicalRecords.length > 0 ? (
              <div className="divide-y">
                {medicalRecords.map((record) => (
                  <div
                    key={record.id}
                    className="space-y-4 px-6 py-4 transition-colors hover:bg-muted/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            {record.date}
                          </span>
                          {record.cie10 ? (
                            <Badge variant="outline" className="font-medium">
                              {record.cie10}
                            </Badge>
                          ) : null}
                        </div>
                        {record.reason ? (
                          <p className="text-sm font-semibold text-foreground">
                            {record.reason}
                          </p>
                        ) : null}
                        {record.diagnosis ? (
                          <p className="text-sm text-muted-foreground">
                            {record.diagnosis}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {record.staff?.user
                          ? `Dr. ${record.staff.user.firstName} ${record.staff.user.lastName}`
                          : "Sin especialista"}
                      </div>
                    </div>

                    {record.weight ||
                    record.height ||
                    record.bloodPressure ||
                    record.temperature ||
                    record.heartRate ? (
                      <div className="flex flex-wrap gap-2 border-t border-dashed pt-3">
                        {record.weight ? (
                          <Badge variant="secondary" className="font-medium">
                            Peso: {record.weight} kg
                          </Badge>
                        ) : null}
                        {record.height ? (
                          <Badge variant="secondary" className="font-medium">
                            Talla: {record.height} cm
                          </Badge>
                        ) : null}
                        {record.bloodPressure ? (
                          <Badge variant="secondary" className="font-medium">
                            Presión: {record.bloodPressure}
                          </Badge>
                        ) : null}
                        {record.temperature ? (
                          <Badge variant="secondary" className="font-medium">
                            Temperatura: {record.temperature} °C
                          </Badge>
                        ) : null}
                        {record.heartRate ? (
                          <Badge variant="secondary" className="font-medium">
                            FC: {record.heartRate} lpm
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}

                    {record.imageUrls?.length ? (
                      <div className="space-y-3 border-t border-dashed pt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Imágenes de la consulta
                        </p>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          {record.imageUrls.map((imageUrl, index) => (
                            <a
                              key={`${record.id}-${index}`}
                              href={imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="group overflow-hidden rounded-2xl border bg-card"
                            >
                              <div className="relative aspect-[4/3]">
                                <Image
                                  src={imageUrl}
                                  alt={`Imagen clínica ${index + 1}`}
                                  fill
                                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                                  unoptimized
                                />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No hay consultas registradas para este paciente.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recetas" className="mt-6">
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border bg-card text-muted-foreground">
            <FileText className="h-8 w-8 opacity-40" />
            <p className="text-sm">
              Revisa las recetas desde{" "}
              <Link
                href="/recetas"
                className="font-medium text-primary underline underline-offset-2"
              >
                Recetas médicas
              </Link>
              .
            </p>
          </div>
        </TabsContent>

        <TabsContent value="citas" className="mt-6">
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border bg-card text-muted-foreground">
            <CalendarCheck className="h-8 w-8 opacity-40" />
            <p className="text-sm">
              Revisa las citas desde{" "}
              <Link
                href="/citas"
                className="font-medium text-primary underline underline-offset-2"
              >
                Citas
              </Link>
              .
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
