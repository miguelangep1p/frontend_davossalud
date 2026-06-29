import { User } from "./auth";

export interface Staff {
  id: string;
  document: string;
  phone?: string;
  address?: string;
  profilePhoto?: string;
  specialty?: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffDto {
  userId: string;
  document: string;
  phone?: string;
  address?: string;
  profilePhoto?: string;
  specialty?: string;
}

export type UpdateStaffDto = Partial<CreateStaffDto>;
