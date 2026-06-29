import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CashEntry, CashEntryType } from "@/types/cash";
import { CashEntryTableActions } from "./cash-entry-table-actions";
import { cn } from "@/lib/utils";

interface Props {
  data: CashEntry[];
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  YAPE: "Yape",
  PLIN: "Plin",
  OTHER: "Otro",
};

export function CashEntriesTable({ data }: Props) {
  return (
    <div className="bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px] font-semibold text-muted-foreground">#</TableHead>
            <TableHead className="font-semibold">Fecha</TableHead>
            <TableHead className="font-semibold">Tipo</TableHead>
            <TableHead className="font-semibold">Concepto</TableHead>
            <TableHead className="font-semibold">Método</TableHead>
            <TableHead className="text-right font-semibold">Monto</TableHead>
            <TableHead className="text-right font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((entry, index) => (
              <TableRow key={entry.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="text-muted-foreground font-mono">
                  {String(index + 1).padStart(2, "0")}
                </TableCell>
                <TableCell className="font-mono text-sm">{entry.date}</TableCell>
                <TableCell>
                  <Badge
                    variant={entry.type === CashEntryType.INCOME ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {entry.type === CashEntryType.INCOME ? "↑ Ingreso" : "↓ Egreso"}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {entry.concept}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {PAYMENT_LABELS[entry.paymentMethod] || entry.paymentMethod}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-semibold tabular-nums",
                    entry.type === CashEntryType.INCOME
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {entry.type === CashEntryType.EXPENSE ? "- " : "+ "}
                  S/ {Number(entry.amount).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <CashEntryTableActions entry={entry} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No se encontraron movimientos registrados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
