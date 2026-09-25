import { redirect } from "next/navigation";

// Prescriptions are written from each consultation in the medical record.
export default function RecipesPage() {
  redirect("/historia-clinica");
}
