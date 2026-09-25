"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getMedicalRecordRecipesAction } from "@/lib/actions/recipe.actions";
import { MedicalRecord } from "@/types/medical-record";
import { Recipe } from "@/types/recipe";
import { RecipeCard } from "@/components/recipes/recipe-card";

interface Props {
  record: MedicalRecord;
  /** Text shown when the consultation has no prescriptions yet. */
  emptyText?: string;
}

/** Prescriptions already saved for one consultation (PDF, WhatsApp, delete). */
export function MedicalRecordRecipes({ record, emptyText }: Props) {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);

  const fetchRecipes = useCallback(async () => {
    const result = await getMedicalRecordRecipesAction(record.id);
    if (!result.success) {
      toast.error("No se pudieron cargar las recetas", { description: result.error });
      return [];
    }
    return result.data;
  }, [record.id]);

  useEffect(() => {
    let cancelled = false;
    fetchRecipes().then((data) => {
      if (!cancelled) setRecipes(data);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchRecipes]);

  if (recipes === null) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando recetas…
      </p>
    );
  }

  if (!recipes.length) {
    return emptyText ? (
      <p className="rounded-xl border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    ) : null;
  }

  return (
    <div className="space-y-3">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onDeleted={() => setRecipes((current) => current?.filter((r) => r.id !== recipe.id) ?? null)}
        />
      ))}
    </div>
  );
}
