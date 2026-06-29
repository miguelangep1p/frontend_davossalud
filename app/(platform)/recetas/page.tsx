import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth.actions";
import { getRecipesList } from "@/lib/services/recipe";
import { getPatientsList } from "@/lib/services/patient";
import { getStaffList } from "@/lib/services/staff";
import { Recipe } from "@/types/recipe";
import { Patient } from "@/types/patient";
import { Staff } from "@/types/staff";
import { AddRecipeButton } from "@/components/recipes/add-recipe-button";
import { RecipesTable } from "@/components/recipes/recipes-table";
import { PageHeader } from "@/components/layout/page-header";
import { PageErrorState } from "@/components/layout/page-error-state";

export default async function RecipesPage() {
  const token = await getSession();
  let recipes: Recipe[] = [];
  let patients: Patient[] = [];
  let staffMembers: Staff[] = [];
  let errorMessage: string | null = null;

  if (!token) redirect("/login");

  try {
    [recipes, patients, staffMembers] = await Promise.all([
      getRecipesList(token),
      getPatientsList(token),
      getStaffList(token),
    ]);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo cargar el módulo de recetas.";
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Recetas"
        description="Registra recetas médicas de forma guiada y genera documentos PDF listos para atención clínica."
        action={
          <AddRecipeButton patients={patients} staffMembers={staffMembers} />
        }
      />

      {errorMessage ? (
        <PageErrorState
          title="No se pudieron cargar las recetas"
          description="La vista se mantuvo estable, pero el backend devolvió un error al consultar el módulo."
          detail={errorMessage}
        />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <RecipesTable data={recipes} />
        </div>
      )}
    </div>
  );
}
