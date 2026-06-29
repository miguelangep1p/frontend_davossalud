"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { showFormErrors } from "@/lib/form-notifications";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { createProductAction, updateProductAction } from "@/lib/actions/product.actions";
import { Product } from "@/types/product";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  sku: z.string().min(1, "El SKU es requerido"),
  laboratory: z.string().optional().or(z.literal("")),
  type: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  stock: z.coerce.number().min(0),
  purchasePrice: z.coerce.number().min(0, "El precio de compra debe ser positivo"),
  salePrice: z.coerce.number().min(0, "El precio de venta debe ser positivo"),
  isActive: z.boolean(),
});

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<
    z.input<typeof formSchema>,
    unknown,
    z.output<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || "",
      sku: product?.sku || "",
      laboratory: product?.laboratory || "",
      type: product?.type || "",
      description: product?.description || "",
      stock: product?.stock ?? 0,
      purchasePrice: Number(product?.purchasePrice || 0),
      salePrice: Number(product?.salePrice ?? product?.price ?? 0),
      isActive: product?.isActive ?? true,
    },
  });

  async function onSubmit(values: z.output<typeof formSchema>) {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        laboratory: values.laboratory || undefined,
        type: values.type || undefined,
        description: values.description || undefined,
        // sync legacy price field with salePrice
        price: values.salePrice,
      };

      if (product) {
        await updateProductAction(product.id, payload);
        toast.success("Producto actualizado correctamente");
      } else {
        await createProductAction(payload);
        toast.success("Producto registrado correctamente");
      }

      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Error al procesar el producto");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit, showFormErrors)} className="space-y-6">
      <FieldGroup>
        {/* Nombre y SKU */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Nombre</FieldLabel>
                <Input {...field} id={field.name} placeholder="Paracetamol 500mg" />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="sku"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>SKU</FieldLabel>
                <Input {...field} id={field.name} placeholder="PROD-001" />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* Laboratorio y Tipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="laboratory"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Laboratorio</FieldLabel>
                <Input {...field} id={field.name} placeholder="Bayer, Pfizer..." />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="type"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Tipo</FieldLabel>
                <Input {...field} id={field.name} placeholder="Medicamento, insumo, cosmético..." />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* Descripción */}
        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Descripción</FieldLabel>
              <Input {...field} id={field.name} placeholder="Detalle del producto" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Stock y Precios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Controller
            name="stock"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Stock</FieldLabel>
                <Input
                  id={field.name}
                  type="number"
                  min={0}
                  value={Number(field.value ?? 0)}
                  onChange={field.onChange}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="purchasePrice"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Precio Compra (S/)</FieldLabel>
                <Input
                  id={field.name}
                  type="number"
                  min={0}
                  step="0.01"
                  value={Number(field.value ?? 0)}
                  onChange={field.onChange}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="salePrice"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Precio Venta (S/)</FieldLabel>
                <Input
                  id={field.name}
                  type="number"
                  min={0}
                  step="0.01"
                  value={Number(field.value ?? 0)}
                  onChange={field.onChange}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <Controller
          name="isActive"
          control={form.control}
          render={({ field }) => (
            <div className="flex items-center space-x-2">
              <Switch id={field.name} checked={field.value} onCheckedChange={field.onChange} />
              <FieldLabel htmlFor={field.name} className="mb-0 cursor-pointer">
                Producto activo
              </FieldLabel>
            </div>
          )}
        />
      </FieldGroup>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Procesando..." : product ? "Guardar Cambios" : "Registrar Producto"}
        </Button>
      </div>
    </form>
  );
}
