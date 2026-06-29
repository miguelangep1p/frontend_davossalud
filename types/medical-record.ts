export interface MedicalRecord {
  id: string;
  patientId: string;
  staffId: string;
  date: string;
  reason?: string;
  anamnesis?: string;
  physicalExam?: string;
  cie10?: string;
  diagnosis?: string;
  treatment?: string;
  observations?: string;
  imageUrls?: string[];
  weight?: number;
  height?: number;
  bloodPressure?: string;
  temperature?: number;
  heartRate?: number;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    document: string;
  };
  staff?: {
    id: string;
    specialty?: string;
    user?: { firstName: string; lastName: string };
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicalRecordDto {
  patientId: string;
  staffId: string;
  date: string;
  reason?: string;
  anamnesis?: string;
  physicalExam?: string;
  cie10?: string;
  diagnosis?: string;
  treatment?: string;
  observations?: string;
  imageUrls?: string[];
  weight?: number;
  height?: number;
  bloodPressure?: string;
  temperature?: number;
  heartRate?: number;
}

export type UpdateMedicalRecordDto = Partial<CreateMedicalRecordDto>;
