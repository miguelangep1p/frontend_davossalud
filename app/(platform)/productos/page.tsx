import { getSession } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { getProductsList } from "@/lib/services/product";
import { AddProductButton } from "@/components/products/add-product-button";
import { ProductsTable } from "@/components/products/products-table";
import { Product } from "@/types/product";
import { PageErrorState } from "@/components/layout/page-error-state";
import { PageHeader } from "@/components/layout/page-header";

export default async function ProductsPage() {
  const token = await getSession();
  let products: Product[] = [];
  let errorMessage: string | null = null;

  if (!token) redirect("/login");

  try {
    products = await getProductsList(token);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo cargar la lista de productos.";
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Gestión de Productos"
        description="Administra los productos, el stock y la disponibilidad comercial de la clínica."
        action={<AddProductButton />}
      />

      {errorMessage ? (
        <PageErrorState
          title="No se pudieron cargar los productos"
          description="El módulo se mantuvo estable, pero el backend devolvió un error al consultar el inventario."
          detail={errorMessage}
        />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <ProductsTable data={products} />
        </div>
      )}
    </div>
  );
}
