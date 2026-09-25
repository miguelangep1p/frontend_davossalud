import { Patient } from "./patient";
import { Staff } from "./staff";
import { Schedule } from "./schedule";

export enum AppointmentStatus {
  PENDING_CONFIRMATION = "PENDING_CONFIRMATION",
  CONFIRMED = "CONFIRMED",
  ATTENDED = "ATTENDED",
  CANCELLED = "CANCELLED",
  RESCHEDULED = "RESCHEDULED",
}

export interface Appointment {
  id: string;
  patient: Patient;
  patientId: string;
  staff: Staff;
  staffId: string;
  schedule: Schedule | null;
  scheduleId: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  duration: number | null;
  status: AppointmentStatus;
  rescheduledToId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  patientId: string;
  staffId: string;
  date: string;
  startTime?: string;
  duration?: number;
}

export interface UpdateAppointmentStatusDto {
  status: AppointmentStatus;
  startTime?: string;
  duration?: number;
}

export interface RescheduleAppointmentDto {
  date: string;
  startTime?: string;
  duration?: number;
}
