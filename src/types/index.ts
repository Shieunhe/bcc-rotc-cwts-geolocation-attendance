export type NSTProgram = "ROTC" | "CWTS";
export type MSLevel = "1" | "2";
export type Sex = "Male" | "Female";
export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "N/A";
export type YearLevel = "1st Year" | "2nd Year" | "3rd Year" | "4th Year";
export type EnrollmentStatus = "pending" | "approved" | "rejected";
export type CWTSCompany = "Alpha" | "Bravo" | "Charlie" | "Delta" | "Echo" | "Foxtrot";

export const CWTS_COMPANIES: CWTSCompany[] = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot"];
export const CWTS_COMPANY_SLOT_LIMIT = 60;

// ROTC
export type ROTCBattalion = 1 | 2;
export type ROTCCompany = "Alpha" | "Bravo" | "Charlie" | "Delta" | "Echo" | "Foxtrot" | "Golf" | "Hotel";
export type ROTCPlatoon = 1 | 2 | 3 | 4;

export const ROTC_BATTALION_1_COMPANIES: ROTCCompany[] = ["Alpha", "Bravo", "Charlie", "Delta"];
export const ROTC_BATTALION_2_COMPANIES: ROTCCompany[] = ["Echo", "Foxtrot", "Golf", "Hotel"];
export const ROTC_PLATOONS_PER_COMPANY = 4;
export const ROTC_PLATOON_SLOT_LIMIT = 38;

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
  // ROTC assignment
  battalion?: ROTCBattalion;
  rotcCompany?: ROTCCompany;
  rotcPlatoon?: ROTCPlatoon;
  // Assigned by admin
  platoon?: string;
  grades?: number;
  serialNumber?: string;
}

// Attendance
export type AttendanceStatus = "open" | "closed" | "scheduled";

export interface AttendanceLocation {
  latitude: number;
  longitude: number;
}

export const ATTENDANCE_RADIUS_METERS = 100;

export interface AttendanceSession {
  id: string;
  program: NSTProgram;
  openDate: string;
  closeDate: string;
  location: AttendanceLocation;
  radiusMeters: number;
  status: AttendanceStatus;
  createdAt: string;
  createdBy: string;
}
