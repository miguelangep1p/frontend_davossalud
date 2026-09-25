"use client";

import { useCallback, useEffect, useState } from "react";
import { FilePlus2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getMedicalRecordRecipesAction } from "@/lib/actions/recipe.actions";
import { MedicalRecord } from "@/types/medical-record";
import { Recipe } from "@/types/recipe";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { Button } from "@/components/ui/button";

interface Props {
  record: MedicalRecord;
  /** Open straight into the "new prescription" form. */
  startCreating?: boolean;
}

/** Prescriptions written during one consultation, plus the form to add another. */
export function MedicalRecordRecipes({ record, startCreating = false }: Props) {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [creating, setCreating] = useState(startCreating);

  const fetchRecipes = useCallback(async () => {
    const result = await getMedicalRecordRecipesAction(record.id);
    if (!result.success) {
      toast.error("No se pudieron cargar las recetas", { description: result.error });
      return [];
    }
    return result.data;
  }, [record.id]);

  const reload = useCallback(async () => {
    setRecipes(await fetchRecipes());
  }, [fetchRecipes]);

  useEffect(() => {
    let cancelled = false;
    fetchRecipes().then((data) => {
      if (!cancelled) setRecipes(data);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchRecipes]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold">
          Recetas de esta consulta
          {recipes?.length ? (
            <span className="ml-1.5 font-normal text-muted-foreground">({recipes.length})</span>
          ) : null}
        </h4>
        {!creating ? (
          <Button size="sm" onClick={() => setCreating(true)}>
            <FilePlus2 className="size-3.5" />
            Nueva receta
          </Button>
        ) : null}
      </div>

      {creating ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <RecipeForm
            record={record}
            onCancel={() => setCreating(false)}
            onSuccess={() => {
              setCreating(false);
              void reload();
            }}
          />
        </div>
      ) : null}

      {recipes === null ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando recetas…
        </p>
      ) : recipes.length ? (
        <div className="space-y-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onDeleted={() => void reload()} />
          ))}
        </div>
      ) : !creating ? (
        <p className="rounded-xl border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
          Aún no hay recetas en esta consulta.
        </p>
      ) : null}
    </section>
  );
}
