"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Schedule } from "@/types/schedule";
import { ScheduleTableActions } from "./schedule-table-actions";
import { formatDate } from "@/lib/utils";

interface ScheduleTableProps {
  data: Schedule[];
}

export function ScheduleTable({ data }: ScheduleTableProps) {
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}:00`);
    const dateB = new Date(`${b.date}T${b.startTime}:00`);
    return dateA.getTime() - dateB.getTime();
  });

  if (sortedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border rounded-lg border-dashed bg-card/50">
        <p className="text-muted-foreground font-medium">
          Este miembro del personal no tiene turnos registrados.
        </p>
      </div>
    );
  }

  return (
    <div className="">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold ">Fecha</TableHead>
            <TableHead className="font-semibold ">Hora Inicio</TableHead>
            <TableHead className="font-semibold ">Hora Fin</TableHead>
            <TableHead className="font-semibold ">Color</TableHead>
            <TableHead className="text-right font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((schedule) => (
            <TableRow
              key={schedule.id}
              className="hover:bg-muted/30 transition-colors"
            >
              <TableCell className="font-medium text-foreground capitalize">
                {formatDate(schedule.date)}
              </TableCell>
              <TableCell>{schedule.startTime}</TableCell>
              <TableCell>{schedule.endTime}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 rounded-full border border-border"
                    style={{ backgroundColor: schedule.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {schedule.color}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <ScheduleTableActions schedule={schedule} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
