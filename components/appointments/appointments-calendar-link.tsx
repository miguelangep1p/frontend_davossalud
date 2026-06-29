import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppointmentsCalendarLink() {
  return (
    <Button asChild variant="outline">
      <Link href="/citas/calendario">
        <CalendarDays className="mr-2 h-4 w-4" />
        Ver calendario
      </Link>
    </Button>
  );
}
