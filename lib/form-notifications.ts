import { toast } from "sonner";

type FormErrorLike = {
  message?: unknown;
  root?: FormErrorLike;
  [key: string]: unknown;
};

function findFirstMessage(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const error = value as FormErrorLike;
  if (typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }

  for (const child of Object.values(error)) {
    const message = findFirstMessage(child);
    if (message) return message;
  }

  return undefined;
}

export function showFormErrors(errors: unknown): void {
  toast.error("Revisa los datos ingresados", {
    id: "form-validation-error",
    description:
      findFirstMessage(errors) ?? "Hay campos incompletos o con un formato incorrecto.",
  });
}
