import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { MyProfileCard } from "@/components/profile/my-profile-card";
import { getSession } from "@/lib/actions/auth.actions";
import { getUserProfile } from "@/lib/services/user";

export const metadata = {
  title: "Mi Perfil | Davos Salud",
  description: "Datos del usuario autenticado y foto operativa del sistema.",
};

export default async function ProfilePage() {
  const token = await getSession();
  if (!token) {
    redirect("/login");
  }

  let user;
  try {
    user = await getUserProfile(token);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    throw error;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Mi perfil"
        description="Administra la foto operativa del sistema y revisa los datos vinculados a tu usuario."
      />
      <MyProfileCard user={user} />
    </div>
  );
}
