import Link from "next/link";
import { redirect } from "next/navigation";
import { IdCard, Mail, MapPin, MoveLeft, Phone } from "lucide-react";
import { PageErrorState } from "@/components/layout/page-error-state";
import { PageHeader } from "@/components/layout/page-header";
import { ScheduleSection } from "@/components/schedules/schedule-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfoItem } from "@/components/ui/info-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getSession } from "@/lib/actions/auth.actions";
import { getStaffById } from "@/lib/services/staff";
import { Staff } from "@/types/staff";
import { Role } from "@/types/user";

export async function generateMetadata() {
  return { title: "Perfil del Personal | Davos Salud" };
}

export default async function PersonalProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await getSession();
  const { id } = await params;

  if (!token) {
    redirect("/login");
  }

  let staff: Staff | null = null;
  let errorMessage: string | null = null;

  try {
    staff = await getStaffById(id, token);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }

    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo cargar el perfil del personal.";
  }

  if (!staff) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader
          title="Perfil del personal"
          description="Resumen del especialista, sus datos de contacto y sus horarios."
          action={
            <Button asChild variant="outline">
              <Link href="/personal">
                <MoveLeft className="mr-2 h-4 w-4" />
                Volver a personal
              </Link>
            </Button>
          }
        />
        <PageErrorState
          title="No se pudo cargar el perfil"
          description="La interfaz se mantuvo estable, pero no fue posible recuperar la ficha del personal."
          detail={errorMessage ?? "Perfil no disponible."}
        />
      </div>
    );
  }

  const { user, profilePhoto, specialty, document, phone, address } = staff;
  const initials =
    `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Perfil del personal"
        description="Resumen del especialista, sus datos de contacto y sus horarios."
        action={
          <Button asChild variant="outline">
            <Link href="/personal">
              <MoveLeft className="mr-2 h-4 w-4" />
              Volver a personal
            </Link>
          </Button>
        }
      />

      <section className="rounded-2xl border bg-card p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <Avatar className="h-24 w-24 ring-2 ring-border">
            <AvatarImage
              src={profilePhoto || "/avatars/default.png"}
              alt={`${user.firstName} ${user.lastName}`}
              className="object-cover"
            />
            <AvatarFallback className="text-2xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {user.firstName} {user.lastName}
              </h2>
              <div className="flex flex-wrap gap-2">
                {user.roles?.map((role: Role) => (
                  <Badge key={role} variant="secondary" className="font-medium">
                    {role}
                  </Badge>
                ))}
                {specialty ? (
                  <Badge variant="outline" className="font-medium">
                    {specialty}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <InfoItem
                icon={Mail}
                label="Correo electronico"
                value={user.email}
              />
              <InfoItem
                icon={IdCard}
                label="Documento"
                value={document || "No registrado"}
              />
              <InfoItem
                icon={Phone}
                label="Telefono"
                value={phone || "No registrado"}
              />
              <InfoItem
                icon={MapPin}
                label="Direccion"
                value={address || "No registrada"}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <ScheduleSection staffId={staff.id} />
      </section>
    </div>
  );
}
