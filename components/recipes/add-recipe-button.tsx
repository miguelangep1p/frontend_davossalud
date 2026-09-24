"use client";

import { useState } from "react";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Patient } from "@/types/patient";
import { Staff } from "@/types/staff";
import { RecipeForm } from "./recipe-form";

interface AddRecipeButtonProps {
  patients: Patient[];
  staffMembers: Staff[];
}

export function AddRecipeButton({
  patients,
  staffMembers,
}: AddRecipeButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-semibold shadow-sm p-4">
          <FilePlus2 className="mr-2 h-4 w-4" />
          Nueva Receta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Receta guiada</DialogTitle>
          <DialogDescription>
            Capture la receta paso a paso y luego ábrala en PDF clínico a media hoja.
          </DialogDescription>
        </DialogHeader>
        <RecipeForm
          patients={patients}
          staffMembers={staffMembers}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
