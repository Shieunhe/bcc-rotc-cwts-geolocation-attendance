export type NSTProgram = "ROTC" | "CWTS";
export type MSLevel = "1" | "2";
export type Sex = "Male" | "Female";
export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "N/A";
export type YearLevel = "1st Year" | "2nd Year" | "3rd Year" | "4th Year";

export interface StudentProfile {
  uid: string;
  // Personal
  studentId: string;
  lastName: string;
  firstName: string;
  religion: string;
  birthdate: string;
  middleName: string;
  sex: Sex;
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
  // Academic
  course: string;
  yearLevel: YearLevel;
  nstpProgram: NSTProgram;
  msLevel: MSLevel;
  // Physical & Health
  height: string;
  weight: string;
  bloodType: BloodType;
  hasMedicalCondition: boolean | null;
  medicalCondition: string;
  medicalCertificate: File | null;
  xrayFile: File | null;
  complexion: string;
  // Account
  email: string;
  username: string;
  password: string;
  photoUrl?: string;
  createdAt: string;
}
