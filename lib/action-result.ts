// Server actions must return errors instead of throwing them: in production
// Next.js replaces thrown messages with a generic "Server Components render"
// error, so the user never sees what the backend actually said.

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const KNOWN_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Tu sesión expiró. Vuelve a iniciar sesión.",
  "Forbidden resource": "No tienes permisos para realizar esta acción.",
};

export function toErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  return KNOWN_MESSAGES[message] ?? (message || fallback);
}

export async function runAction<T>(
  fn: () => Promise<T>,
  fallback: string,
): Promise<ActionResult<T>> {
  try {
    return { success: true, data: await fn() };
  } catch (error: unknown) {
    return { success: false, error: toErrorMessage(error, fallback) };
  }
}

/** Client-side: turn a failed result back into a thrown Error with the real message. */
export function unwrapAction<T>(result: ActionResult<T>): T {
  if (!result.success) throw new Error(result.error);
  return result.data;
}
