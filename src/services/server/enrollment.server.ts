import { query, getConnection } from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "@/lib/db";
import type { EnrollmentDocument, EnrollmentSchedule } from "@/types";
import {
  buildScheduleId,
  compareSchedulesDesc,
  isScheduleOpenAt,
} from "@/utils/enrollmentSchedule";

export interface EnrollmentResult {
  success: boolean;
  uid?: string;
  error?: string;
}

export interface ServerEnrollmentFormData {
  studentId: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  suffix?: string;
  religion: string;
  birthdate: string;
  sex: string;
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
  course: string;
  yearLevel: string;
  nstpComponent: string;
  msLevel: string;
  height: string;
  weight: string;
  bloodType: string;
  hasMedicalCondition: boolean | null;
  medicalCondition: string;
  medicalCertificate: string | null;
  xrayFile: string | null;
  complexion: string;
  email: string;
  username: string;
  password: string;
  photo: string | null;
  corFile: string | null;
}

interface ScheduleRow extends RowDataPacket {
  program: string;
  msLevel: string;
  year: string;
  openDate: string;
  deadline: string;
  updatedAt: string;
}

function mysqlNow(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function boolToTinyint(val: boolean | null | undefined): number | null {
  if (val == null) return null;
  return val ? 1 : 0;
}

export const enrollmentServer = {
  async submitEnrollment(
    formData: ServerEnrollmentFormData
  ): Promise<EnrollmentResult> {
    try {
      if (formData.nstpComponent === "CWTS" && formData.msLevel !== "1") {
        return {
          success: false,
          error:
            "First-time CWTS enrollment is only allowed for CWTS 1. Please use re-enrollment to proceed to CWTS 2.",
        };
      }
      if (formData.nstpComponent === "ROTC" && formData.msLevel !== "1") {
        return {
          success: false,
          error:
            "First-time ROTC enrollment is only allowed for MS 1. Please use re-enrollment to proceed to MS 2.",
        };
      }

      const now = mysqlNow();

      const conn = await getConnection();
      try {
        await conn.beginTransaction();

        const [studentResult] = await conn.execute<ResultSetHeader>(
          `INSERT INTO students (
            student_id, first_name, last_name, middle_name, suffix,
            religion, birthdate, sex, contact_number, place_of_birth,
            temporary_barangay, temporary_municipality, temporary_province,
            permanent_barangay, permanent_municipality, permanent_province,
            father_name, father_occupation, mother_name, mother_occupation,
            emergency_contact_name, emergency_contact_address,
            emergency_contact_relationship, emergency_contact_contact_number,
            willing_to_take_advance_course,
            course, year_level, nstp_component,
            height, weight, blood_type, complexion,
            has_medical_condition, medical_condition, medical_certificate, xray_file,
            email, username, password,
            photo, cor_file,
            role, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?,
            ?, ?,
            ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            'student', ?, ?
          )`,
          [
            formData.studentId,
            formData.firstName,
            formData.lastName,
            formData.middleName || "",
            formData.suffix || null,
            formData.religion,
            formData.birthdate,
            formData.sex || null,
            formData.contactNumber,
            formData.placeOfBirth,
            formData.temporaryBarangay,
            formData.temporaryMunicipality,
            formData.temporaryProvince,
            formData.permanentBarangay,
            formData.permanentMunicipality,
            formData.permanentProvince,
            formData.fatherName,
            formData.fatherOccupation,
            formData.motherName,
            formData.motherOccupation,
            formData.emergencyContactName,
            formData.emergencyContactAddress,
            formData.emergencyContactRelationship,
            formData.emergencyContactContactNumber,
            boolToTinyint(formData.willingToTakeAdvanceCourse),
            formData.course,
            formData.yearLevel || null,
            formData.nstpComponent || null,
            formData.height,
            formData.weight,
            formData.bloodType || null,
            formData.complexion,
            boolToTinyint(formData.hasMedicalCondition),
            formData.medicalCondition || "",
            formData.medicalCertificate,
            formData.xrayFile,
            formData.email,
            formData.username,
            formData.password,
            formData.photo,
            formData.corFile,
            now,
            now,
          ]
        );

        const uid = String(studentResult.insertId);

        const scheduleId = await this._findOpenScheduleId(
          formData.nstpComponent,
          formData.msLevel
        );

        await conn.execute<ResultSetHeader>(
          `INSERT INTO student_ms_records
            (student_id, schedule_id, ms_level, status, program, created_at, updated_at)
           VALUES (?, ?, ?, 'pending', ?, ?, ?)`,
          [
            studentResult.insertId,
            scheduleId,
            formData.msLevel,
            formData.nstpComponent,
            now,
            now,
          ]
        );

        await conn.commit();
        return { success: true, uid };
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (err: unknown) {
      console.error("Enrollment error:", err);
      let errorMessage = "Enrollment failed.";

      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes("Duplicate entry") && msg.includes("email")) {
          errorMessage =
            "This email is already registered. Please use a different email.";
        } else if (
          msg.includes("Duplicate entry") &&
          msg.includes("username")
        ) {
          errorMessage =
            "This username is already taken. Please choose a different username.";
        } else {
          errorMessage = msg;
        }
      }

      return { success: false, error: errorMessage };
    }
  },

  async submitReEnrollment(
    uid: string,
    formData: ServerEnrollmentFormData,
    existingDoc: EnrollmentDocument
  ): Promise<EnrollmentResult> {
    try {
      const studentId = parseInt(uid, 10);
      const now = mysqlNow();
      const isROTC = formData.nstpComponent === "ROTC";

      const conn = await getConnection();
      try {
        await conn.beginTransaction();

        await conn.execute<ResultSetHeader>(
          `UPDATE students SET
            student_id = ?, first_name = ?, last_name = ?, middle_name = ?, suffix = ?,
            religion = ?, birthdate = ?, sex = ?, contact_number = ?, place_of_birth = ?,
            temporary_barangay = ?, temporary_municipality = ?, temporary_province = ?,
            permanent_barangay = ?, permanent_municipality = ?, permanent_province = ?,
            father_name = ?, father_occupation = ?, mother_name = ?, mother_occupation = ?,
            emergency_contact_name = ?, emergency_contact_address = ?,
            emergency_contact_relationship = ?, emergency_contact_contact_number = ?,
            willing_to_take_advance_course = ?,
            course = ?, year_level = ?,
            height = ?, weight = ?, blood_type = ?, complexion = ?,
            has_medical_condition = ?, medical_condition = ?,
            photo = ?, cor_file = ?,
            medical_certificate = ?, xray_file = ?,
            ${isROTC ? "battalion = NULL, rotc_company = NULL, rotc_platoon = NULL, special_unit = NULL," : ""}
            updated_at = ?
          WHERE id = ?`,
          [
            formData.studentId,
            formData.firstName,
            formData.lastName,
            formData.middleName || "",
            formData.suffix || "",
            formData.religion,
            formData.birthdate,
            formData.sex || null,
            formData.contactNumber,
            formData.placeOfBirth,
            formData.temporaryBarangay,
            formData.temporaryMunicipality,
            formData.temporaryProvince,
            formData.permanentBarangay,
            formData.permanentMunicipality,
            formData.permanentProvince,
            formData.fatherName,
            formData.fatherOccupation,
            formData.motherName,
            formData.motherOccupation,
            formData.emergencyContactName,
            formData.emergencyContactAddress,
            formData.emergencyContactRelationship,
            formData.emergencyContactContactNumber,
            boolToTinyint(formData.willingToTakeAdvanceCourse),
            formData.course,
            formData.yearLevel || null,
            formData.height,
            formData.weight,
            formData.bloodType || null,
            formData.complexion,
            boolToTinyint(formData.hasMedicalCondition),
            formData.medicalCondition || "",
            formData.photo || existingDoc.photo,
            formData.corFile || existingDoc.corFile,
            formData.medicalCertificate || existingDoc.medicalCertificate,
            formData.xrayFile || existingDoc.xrayFile,
            now,
            studentId,
          ]
        );

        const scheduleId = await this._findOpenScheduleId(
          formData.nstpComponent,
          formData.msLevel
        );

        await conn.execute<ResultSetHeader>(
          `INSERT INTO student_ms_records
            (student_id, schedule_id, ms_level, status, program, created_at, updated_at)
           VALUES (?, ?, ?, 'pending', ?, ?, ?)`,
          [
            studentId,
            scheduleId,
            formData.msLevel,
            formData.nstpComponent,
            now,
            now,
          ]
        );

        await conn.commit();
        return { success: true, uid };
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (err: unknown) {
      console.error("Re-enrollment error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Re-enrollment failed.";
      return { success: false, error: errorMessage };
    }
  },

  async _findOpenScheduleId(
    program: string,
    msLevel: string
  ): Promise<string> {
    const rows = await query<ScheduleRow[]>(
      `SELECT program, ms_level AS msLevel, year,
              open_date AS openDate, deadline, updated_at AS updatedAt
       FROM enrollment_schedules
       WHERE program = ? AND ms_level = ?`,
      [program, msLevel]
    );

    const schedules = (rows as unknown as EnrollmentSchedule[]).sort(
      compareSchedulesDesc
    );

    const open = schedules.find((s) => isScheduleOpenAt(s));
    if (open) return buildScheduleId(open);

    const latestStarted = schedules.find(
      (s) => new Date() >= new Date(s.openDate)
    );
    if (latestStarted) return buildScheduleId(latestStarted);

    if (schedules[0]) return buildScheduleId(schedules[0]);
    return "";
  },
};
