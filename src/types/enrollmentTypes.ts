import { NSTProgram, MSLevel, Sex, BloodType, YearLevel } from "@/types";

export interface EnrollmentFormData {
  // Step 1 — Personal Info
  studentId: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  religion: string;
  birthdate: string;
  sex: Sex | "";
  contactNumber: string;
  placeOfBirth: string;
  temporaryBarangay: string;
  temporaryMunicipality: string;
  temporaryProvince: string;
  permanentBarangay: string;
  permanentMunicipality: string;
  permanentProvince: string;
  fatherName: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  emergencyContactName: string;
  emergencyContactAddress: string;
  emergencyContactRelationship: string;
  emergencyContactContactNumber: string;
  willingToTakeAdvanceCourse: boolean;
  // Step 2 — Academic Info
  course: string;
  yearLevel: YearLevel | "";
  nstpComponent: NSTProgram | "";
  msLevel: MSLevel | "";
  // Step 3 — Physical & Health
  height: string;
  weight: string;
  bloodType: BloodType | "";
  hasMedicalCondition: boolean | null;
  medicalCondition: string;
  medicalCertificate: File | null;
  xrayFile: File | null;
  complexion: string;
  // Step 4 — Account Setup
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  photo: File | null;
  corFile: File | null;
}

export const defaultEnrollmentForm: EnrollmentFormData = {
  studentId: "",
  lastName: "",
  firstName: "",
  middleName: "",
  birthdate: "",
  sex: "",
  contactNumber: "",
  religion: "",
  placeOfBirth: "",
  temporaryBarangay: "",
  temporaryMunicipality: "",
  temporaryProvince: "",
  permanentBarangay: "",
  permanentMunicipality: "",
  permanentProvince: "",
  fatherName: "",
  fatherOccupation: "",
  motherName: "",
  motherOccupation: "",
  emergencyContactName: "",
  emergencyContactAddress: "",
  emergencyContactRelationship: "",
  emergencyContactContactNumber: "",
  willingToTakeAdvanceCourse: false,
  course: "",
  yearLevel: "",
  nstpComponent: "",
  msLevel: "",
  height: "",
  weight: "",
  bloodType: "",
  hasMedicalCondition: null,
  medicalCondition: "",
  medicalCertificate: null,
  xrayFile: null,
  complexion: "",
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
  photo: null,
  corFile: null,
};

export interface EnrollmentStepProps {
  form: EnrollmentFormData;
  updateField: (field: keyof EnrollmentFormData, value: string) => void;
  updateBoolean: (field: keyof EnrollmentFormData, value: boolean) => void;
  updateFile: (field: keyof EnrollmentFormData, value: File | null) => void;
}


