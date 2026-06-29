import { getSession } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { User } from "@/types/auth";
import { getUsers } from "@/lib/services/user";
import { AddUserButton } from "@/components/users/add-user-button";
import { UserTable } from "@/components/users/user-table";
import { PageHeader } from "@/components/layout/page-header";
import { PageErrorState } from "@/components/layout/page-error-state";

export default async function UserPage() {
  const token = await getSession();
  let users: User[] = [];
  let errorMessage: string | null = null;

  if (!token) redirect("/login");

  try {
    users = await getUsers(token);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo cargar la lista de usuarios.";
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Usuarios"
        description="Administra accesos, roles y estado operativo de los usuarios del sistema."
        action={<AddUserButton />}
      />

      {errorMessage ? (
        <PageErrorState
          title="No se pudieron cargar los usuarios"
          description="La vista se mantuvo estable, pero el backend no devolvió correctamente la lista de accesos."
          detail={errorMessage}
        />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <UserTable data={users} />
        </div>
      )}
    </div>
  );
}
