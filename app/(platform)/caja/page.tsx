import { redirect } from "next/navigation";
import { Wallet, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { getSession } from "@/lib/actions/auth.actions";
import { getCashEntries, getCashSummary } from "@/lib/services/cash";
import { CashEntry, CashSummary } from "@/types/cash";
import { CashEntriesTable } from "@/components/cash/cash-entries-table";
import { CashNewDialog } from "@/components/cash/cash-new-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Caja | Davos Salud",
  description: "Gestión de ingresos y egresos de la clínica",
};

export default async function CajaPage() {
  const token = await getSession();
  if (!token) redirect("/login");

  let entries: CashEntry[] = [];
  let summary: CashSummary = { totalIncome: 0, totalExpense: 0, balance: 0, count: 0 };

  try {
    [entries, summary] = await Promise.all([
      getCashEntries(token),
      getCashSummary(token),
    ]);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }
  }

  const formatMoney = (n: number) =>
    `S/ ${Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Caja</h1>
            <p className="text-muted-foreground text-sm">
              {entries.length} movimiento{entries.length !== 1 ? "s" : ""} registrado
              {entries.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <CashNewDialog />
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Ingresos
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatMoney(summary.totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Egresos
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatMoney(summary.totalExpense)}
            </div>
          </CardContent>
        </Card>

        <Card
          className={
            summary.balance >= 0
              ? "border-blue-200 dark:border-blue-800"
              : "border-orange-200 dark:border-orange-800"
          }
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance
            </CardTitle>
            <Scale className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summary.balance >= 0
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-orange-600 dark:text-orange-400"
              }`}
            >
              {formatMoney(summary.balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <CashEntriesTable data={entries} />
      </div>
    </div>
  );
}
