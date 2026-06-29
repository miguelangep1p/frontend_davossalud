"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCashEntryAction, updateCashEntryAction } from "@/lib/actions/cash.actions";
import { CashEntry, CashEntryType, CashPaymentMethod } from "@/types/cash";
import { showFormErrors } from "@/lib/form-notifications";

const schema = z.object({
  type: z.enum([CashEntryType.INCOME, CashEntryType.EXPENSE]),
  concept: z.string().min(1, "El concepto es requerido"),
  description: z.string().optional(),
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  paymentMethod: z.enum([
    CashPaymentMethod.CASH,
    CashPaymentMethod.CARD,
    CashPaymentMethod.TRANSFER,
    CashPaymentMethod.YAPE,
    CashPaymentMethod.PLIN,
    CashPaymentMethod.OTHER,
  ]),
  referenceNumber: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  entry?: CashEntry;
  onSuccess?: () => void;
}

const PAYMENT_METHOD_LABELS: Record<CashPaymentMethod, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  YAPE: "Yape",
  PLIN: "Plin",
  OTHER: "Otro",
};

export function CashEntryForm({ entry, onSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      type: entry?.type || CashEntryType.INCOME,
      concept: entry?.concept || "",
      description: entry?.description || "",
      amount: Number(entry?.amount || 0),
      paymentMethod: entry?.paymentMethod || CashPaymentMethod.CASH,
      referenceNumber: entry?.referenceNumber || "",
      date: entry?.date || today,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        description: values.description || undefined,
        referenceNumber: values.referenceNumber || undefined,
      };
      if (entry) {
        await updateCashEntryAction(entry.id, payload);
        toast.success("Movimiento actualizado");
      } else {
        await createCashEntryAction(payload);
        toast.success("Movimiento registrado");
      }
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Error al procesar el movimiento");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit, showFormErrors)} className="space-y-5">
      <FieldGroup>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipo */}
          <Controller
            name="type"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Tipo</FieldLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CashEntryType.INCOME}>
                      <span className="text-green-600 font-semibold">↑ Ingreso</span>
                    </SelectItem>
                    <SelectItem value={CashEntryType.EXPENSE}>
                      <span className="text-red-600 font-semibold">↓ Egreso</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Fecha */}
          <Controller
            name="date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Fecha</FieldLabel>
                <Input {...field} id={field.name} type="date" />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* Concepto */}
        <Controller
          name="concept"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Concepto</FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder="Pago de consulta, compra de insumos..."
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Monto */}
          <Controller
            name="amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Monto (S/)</FieldLabel>
                <Input
                  id={field.name}
                  type="number"
                  step="0.01"
                  min={0}
                  value={field.value}
                  onChange={field.onChange}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Método de pago */}
          <Controller
            name="paymentMethod"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Método de pago</FieldLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(CashPaymentMethod).map((method) => (
                      <SelectItem key={method} value={method}>
                        {PAYMENT_METHOD_LABELS[method]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* N° de referencia */}
        <Controller
          name="referenceNumber"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>N° de Referencia (opcional)</FieldLabel>
              <Input {...field} id={field.name} placeholder="Número de operación, voucher..." />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Descripción */}
        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Descripción (opcional)</FieldLabel>
              <Textarea
                {...field}
                id={field.name}
                placeholder="Detalle adicional del movimiento..."
                rows={2}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : entry ? "Guardar Cambios" : "Registrar Movimiento"}
        </Button>
      </div>
    </form>
  );
}
