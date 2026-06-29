import { AddScheduleButton } from "./add-schedule-button";
import { ScheduleTable } from "./schedule-table";
import { getSession } from "@/lib/actions/auth.actions";
import { getSchedulesByStaffId } from "@/lib/services/schedules";
import { Schedule } from "@/types/schedule";

export async function ScheduleSection({ staffId }: { staffId: string }) {
  const token = await getSession();
  let schedules: Schedule[] = [];

  if (token) {
    try {
      schedules = await getSchedulesByStaffId(staffId, token);
    } catch {
      schedules = [];
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-foreground">
            Registro de turnos
          </h3>
          <p className="text-sm text-muted-foreground">
            Gestiona los horarios y la disponibilidad del especialista.
          </p>
        </div>
        <AddScheduleButton staffId={staffId} />
      </div>

      <ScheduleTable data={schedules} />
    </div>
  );
}
