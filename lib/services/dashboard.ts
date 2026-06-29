const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface DashboardStats {
  totalPatients: number;
  totalStaff: number;
  todayAppointments: number;
  weekAppointments: number;
  todayIncome: number;
  todayExpense: number;
  todayBalance: number;
  upcomingToday: Array<{
    id: string;
    date: string;
    startTime: string | null;
    endTime: string | null;
    status: string;
    patient: { firstName: string; lastName: string };
    staff: {
      specialty?: string;
      user?: { firstName: string; lastName: string };
    };
  }>;
  last7Days: Array<{ date: string; count: number }>;
}

export async function getDashboardStats(token: string): Promise<DashboardStats> {
  const res = await fetch(`${BASE_URL}/dashboard/stats`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    throw new Error("Error al cargar estadisticas");
  }

  return res.json();
}
