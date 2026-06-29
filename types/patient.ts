export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export enum BloodType {
  A_POSITIVE = "A+",
  A_NEGATIVE = "A-",
  B_POSITIVE = "B+",
  B_NEGATIVE = "B-",
  AB_POSITIVE = "AB+",
  AB_NEGATIVE = "AB-",
  O_POSITIVE = "O+",
  O_NEGATIVE = "O-",
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  document: string;
  birthDate: string;
  gender: Gender;
  phone: string;
  address?: string;
  profilePhoto?: string;
  additionalNote?: string;
  bloodType?: BloodType;
  allergies?: string;
  chronicDiseases?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  document: string;
  birthDate: string;
  gender: Gender;
  phone: string;
  address?: string;
  profilePhoto?: string;
  additionalNote?: string;
  bloodType?: BloodType;
  allergies?: string;
  chronicDiseases?: string;
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {}
