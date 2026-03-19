import { NSTProgram, NSTLevel, Sex, BloodType, YearLevel, ActivityLevel } from "@/types";

export interface EnrollmentFormData {
  // Step 1 — Personal Info
  studentId: string;
  fullName: string;
  birthdate: string;
  sex: Sex | "";
  contactNumber: string;
  address: string;
  // Step 2 — Academic Info
  course: string;
  yearLevel: YearLevel | "";
  nstpComponent: NSTProgram | "";
  nstpLevel: NSTLevel | "";
  // Step 3 — Physical & Health
  height: string;
  weight: string;
  bloodType: BloodType | "";
  activityLevel: ActivityLevel | "";
  trainingCapability: string;
  hasMedicalCondition: boolean;
  medicalCondition: string;
  medicalCertificate: File | null;
  // Step 4 — Account Setup
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  photo: File | null;
}

export const defaultEnrollmentForm: EnrollmentFormData = {
  studentId: "", fullName: "", birthdate: "", sex: "",
  contactNumber: "", address: "", course: "", yearLevel: "",
  nstpComponent: "", nstpLevel: "", height: "", weight: "",
  bloodType: "", activityLevel: "", trainingCapability: "",
  hasMedicalCondition: false, medicalCondition: "", medicalCertificate: null,
  email: "", username: "", password: "",
  confirmPassword: "", photo: null,
};

export interface EnrollmentStepProps {
  form: EnrollmentFormData;
  updateField: (field: keyof EnrollmentFormData, value: string) => void;
  updateBoolean: (field: keyof EnrollmentFormData, value: boolean) => void;
  updateFile: (field: keyof EnrollmentFormData, value: File | null) => void;
}


