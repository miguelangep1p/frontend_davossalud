"use client";

import { useState } from "react";
import { Eye, MoreHorizontal, PenIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { deleteProductAction } from "@/lib/actions/product.actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { ProductForm } from "./product-form";

interface ProductsTableActionsProps {
  product: Product;
}

export function ProductsTableActions({ product }: ProductsTableActionsProps) {
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    setIsLoading(true);
    try {
      await deleteProductAction(product.id);
      toast.success("Producto eliminado correctamente");
      setDeleteOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar producto");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Opciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={() => setViewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => setEditOpen(true)}>
            <PenIcon className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10 cursor-pointer"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles del Producto</DialogTitle>
            <DialogDescription>{product.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground font-medium">SKU</Label>
              <div className="col-span-3 text-sm pl-4">{product.sku}</div>
            </div>
            {product.laboratory && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-muted-foreground font-medium">Laboratorio</Label>
                <div className="col-span-3 text-sm pl-4">{product.laboratory}</div>
              </div>
            )}
            {product.type && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-muted-foreground font-medium">Tipo</Label>
                <div className="col-span-3 text-sm pl-4">{product.type}</div>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground font-medium">Stock</Label>
              <div className="col-span-3 text-sm pl-4">{product.stock}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground font-medium">P. Compra</Label>
              <div className="col-span-3 text-sm pl-4">S/ {Number(product.purchasePrice ?? 0).toFixed(2)}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground font-medium">P. Venta</Label>
              <div className="col-span-3 text-sm pl-4 font-semibold">S/ {Number(product.salePrice ?? product.price ?? 0).toFixed(2)}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground font-medium">Estado</Label>
              <div className="col-span-3 text-sm pl-4">{product.isActive ? "Activo" : "Inactivo"}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground font-medium">Descripción</Label>
              <div className="col-span-3 text-sm pl-4">{product.description || "Sin descripción"}</div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>
              Modifique los datos del producto y guarde los cambios.
            </DialogDescription>
          </DialogHeader>
          <ProductForm product={product} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el producto "{product.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Eliminando..." : "Eliminar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
