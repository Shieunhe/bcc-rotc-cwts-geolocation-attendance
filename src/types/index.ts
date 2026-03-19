export type NSTProgram = "ROTC" | "CWTS";
export type NSTLevel = "NSTP 1" | "NSTP 2";
export type Sex = "Male" | "Female";
export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type YearLevel = "1st Year" | "2nd Year" | "3rd Year" | "4th Year";
export type ActivityLevel = "Sedentary" | "Lightly Active" | "Moderately Active" | "Very Active";

export interface StudentProfile {
  uid: string;
  // Personal
  studentId: string;
  fullName: string;
  birthdate: string;
  sex: Sex;
  contactNumber: string;
  address: string;
  // Academic
  course: string;
  yearLevel: YearLevel;
  nstpComponent: NSTProgram;
  nstpLevel: NSTLevel;
  // Physical & Health
  height: string;
  weight: string;
  bloodType: BloodType;
  activityLevel: ActivityLevel;
  trainingCapability: string;
  medicalCondition: string;
  // Account
  email: string;
  username: string;
  password: string;
  photoUrl?: string;
  createdAt: string;
}
