import { Staff } from "./staff";

export interface Schedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  staffId: string;
  staff?: Staff;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleDto {
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
}

export interface UpdateScheduleDto extends Partial<CreateScheduleDto> {}
