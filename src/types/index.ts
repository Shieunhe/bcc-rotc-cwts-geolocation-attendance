export type NSTProgram = "ROTC" | "CWTS";
export type MSLevel = "1" | "2";
export type Sex = "Male" | "Female";
export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "N/A";
export type YearLevel = "1st Year" | "2nd Year" | "3rd Year" | "4th Year";
export type EnrollmentStatus = "pending" | "approved" | "rejected";
export type CWTSCompany = "Alpha" | "Bravo" | "Charlie" | "Delta" | "Echo" | "Foxtrot";

export const CWTS_COMPANIES: CWTSCompany[] = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot"];
export const CWTS_COMPANY_SLOT_LIMIT = 60;

export interface EnrollmentSchedule {
  program: NSTProgram;
  openDate: string;
  deadline: string;
  updatedAt: string;
}

export interface EnrollmentDocument {
  uid: string;
  // Personal Info
  studentId: string;
  lastName: string;
  firstName: string;
  middleName: string;
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
  // Academic Info
  course: string;
  yearLevel: YearLevel | "";
  nstpComponent: NSTProgram | "";
  msLevel: MSLevel | "";
  // Physical & Health
  height: string;
  weight: string;
  bloodType: BloodType | "";
  complexion: string;
  hasMedicalCondition: boolean | null;
  medicalCondition: string;
  medicalCertificate: string | null;
  xrayFile: string | null;
  // Account Info
  email: string;
  username: string;
  password: string;
  photo: string | null;
  corFile: string | null;
  // Metadata
  createdAt: string;
  updatedAt: string;
  status: EnrollmentStatus;
  rejectionReason?: string;
  company?: CWTSCompany;
  // Assigned by admin
  platoon?: string;
  grades?: number;
  serialNumber?: string;
}
