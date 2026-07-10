import { query, execute } from "@/lib/db";
import type { RowDataPacket } from "@/lib/db";
import type {
  EnrollmentDocument,
  EnrollmentWithMs,
  StudentMsRecord,
  AttendanceSession,
  AttendanceRecord,
  AttendanceRecordStatus,
  StudentGrade,
  AttendanceOffense,
} from "@/types";

interface StudentRow extends RowDataPacket {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  suffix: string | null;
  email: string;
  username: string;
  password: string;
  sex: string;
  contact_number: string;
  religion: string;
  birthdate: string;
  place_of_birth: string;
  temporary_barangay: string;
  temporary_municipality: string;
  temporary_province: string;
  permanent_barangay: string;
  permanent_municipality: string;
  permanent_province: string;
  father_name: string;
  father_occupation: string;
  mother_name: string;
  mother_occupation: string;
  emergency_contact_name: string;
  emergency_contact_address: string;
  emergency_contact_relationship: string;
  emergency_contact_contact_number: string;
  willing_to_take_advance_course: number;
  course: string;
  year_level: string;
  nstp_component: string;
  height: string;
  weight: string;
  blood_type: string;
  complexion: string;
  has_medical_condition: number | null;
  medical_condition: string;
  medical_certificate: string | null;
  xray_file: string | null;
  photo: string | null;
  cor_file: string | null;
  company: string | null;
  battalion: number | null;
  rotc_company: string | null;
  rotc_platoon: number | null;
  special_unit: string | null;
  platoon: string | null;
  grades: number | null;
  serial_number: string | null;
  created_at: string;
  updated_at: string;
}

interface MsRecordRow extends RowDataPacket {
  id: number;
  student_id: number;
  schedule_id: string;
  ms_level: string;
  status: string;
  rejection_reason: string | null;
  program: string;
  created_at: string;
  updated_at: string;
}

interface AttendanceSessionRow extends RowDataPacket {
  id: number;
  program: string;
  ms_level: string | null;
  is_advance_course: number | null;
  school_year: string | null;
  mi_number: number | null;
  mi_type: string | null;
  open_date: string;
  close_date: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  status: string;
  created_by: string;
  created_at: string;
}

interface AttendanceRecordRow extends RowDataPacket {
  id: number;
  student_id: number;
  attendance_session_id: number;
  status: string;
  mi_number: number | null;
  mi_type: string | null;
  created_at: string;
  updated_at: string;
}

interface StudentGradeRow extends RowDataPacket {
  id: number;
  student_id: number;
  ms_level: string;
  midterm: number | null;
  final_term: number | null;
  grade: number;
  status: string;
  program: string;
  created_at: string;
  updated_at: string;
}

interface AttendanceOffenseRow extends RowDataPacket {
  id: number;
  student_id: number;
  offend: number;
  settled: number;
  warning_acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SerialNumberRow extends RowDataPacket {
  id: number;
  student_id: number;
  serial_number: string;
  program: string;
  signatory_1_name: string | null;
  signatory_1_position: string | null;
  signatory_2_name: string | null;
  signatory_2_position: string | null;
  signatory_3_name: string | null;
  signatory_3_position: string | null;
  created_at: string;
}

interface SignatorySettingsRow extends RowDataPacket {
  id: number;
  program: string;
  signatory_1_name: string | null;
  signatory_1_position: string | null;
  signatory_2_name: string | null;
  signatory_2_position: string | null;
  signatory_3_name: string | null;
  signatory_3_position: string | null;
  updated_at: string;
}

function mapStudentRow(row: StudentRow): EnrollmentDocument {
  return {
    uid: String(row.id),
    studentId: row.student_id ?? "",
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    middleName: row.middle_name ?? "",
    suffix: row.suffix ?? undefined,
    email: row.email ?? "",
    username: row.username ?? "",
    password: row.password ?? "",
    sex: (row.sex as EnrollmentDocument["sex"]) || "",
    contactNumber: row.contact_number ?? "",
    religion: row.religion ?? "",
    birthdate: row.birthdate ?? "",
    placeOfBirth: row.place_of_birth ?? "",
    temporaryBarangay: row.temporary_barangay ?? "",
    temporaryMunicipality: row.temporary_municipality ?? "",
    temporaryProvince: row.temporary_province ?? "",
    permanentBarangay: row.permanent_barangay ?? "",
    permanentMunicipality: row.permanent_municipality ?? "",
    permanentProvince: row.permanent_province ?? "",
    fatherName: row.father_name ?? "",
    fatherOccupation: row.father_occupation ?? "",
    motherName: row.mother_name ?? "",
    motherOccupation: row.mother_occupation ?? "",
    emergencyContactName: row.emergency_contact_name ?? "",
    emergencyContactAddress: row.emergency_contact_address ?? "",
    emergencyContactRelationship: row.emergency_contact_relationship ?? "",
    emergencyContactContactNumber: row.emergency_contact_contact_number ?? "",
    willingToTakeAdvanceCourse: !!row.willing_to_take_advance_course,
    course: row.course ?? "",
    yearLevel: (row.year_level as EnrollmentDocument["yearLevel"]) || "",
    nstpComponent: (row.nstp_component as EnrollmentDocument["nstpComponent"]) || "",
    height: row.height ?? "",
    weight: row.weight ?? "",
    bloodType: (row.blood_type as EnrollmentDocument["bloodType"]) || "",
    complexion: row.complexion ?? "",
    hasMedicalCondition: row.has_medical_condition == null ? null : !!row.has_medical_condition,
    medicalCondition: row.medical_condition ?? "",
    medicalCertificate: row.medical_certificate ?? null,
    xrayFile: row.xray_file ?? null,
    photo: row.photo ?? null,
    corFile: row.cor_file ?? null,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
    company: row.company as EnrollmentDocument["company"],
    battalion: row.battalion as EnrollmentDocument["battalion"],
    rotcCompany: row.rotc_company as EnrollmentDocument["rotcCompany"],
    rotcPlatoon: row.rotc_platoon as EnrollmentDocument["rotcPlatoon"],
    specialUnit: row.special_unit as EnrollmentDocument["specialUnit"],
    platoon: row.platoon ?? undefined,
    grades: row.grades ?? undefined,
    serialNumber: row.serial_number ?? undefined,
  };
}

function mapMsRecordRow(row: MsRecordRow): StudentMsRecord {
  return {
    uid: String(row.student_id),
    scheduleId: row.schedule_id ?? "",
    msLevel: row.ms_level as StudentMsRecord["msLevel"],
    status: row.status as StudentMsRecord["status"],
    rejectionReason: row.rejection_reason ?? undefined,
    program: row.program as StudentMsRecord["program"],
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

function mapAttendanceSessionRow(row: AttendanceSessionRow): AttendanceSession {
  return {
    id: String(row.id),
    program: row.program as AttendanceSession["program"],
    msLevel: row.ms_level as AttendanceSession["msLevel"],
    isAdvanceCourse: row.is_advance_course == null ? undefined : !!row.is_advance_course,
    schoolYear: row.school_year ?? undefined,
    miNumber: row.mi_number ?? undefined,
    miType: row.mi_type as AttendanceSession["miType"],
    openDate: row.open_date ?? "",
    closeDate: row.close_date ?? "",
    location: { latitude: row.latitude, longitude: row.longitude },
    radiusMeters: row.radius_meters,
    status: row.status as AttendanceSession["status"],
    createdAt: row.created_at ?? "",
    createdBy: row.created_by ?? "",
  };
}

function mapAttendanceRecordRow(row: AttendanceRecordRow): AttendanceRecord {
  return {
    id: String(row.id),
    studentUid: String(row.student_id),
    attendanceSessionId: String(row.attendance_session_id),
    status: row.status as AttendanceRecord["status"],
    miNumber: row.mi_number ?? undefined,
    miType: row.mi_type as AttendanceRecord["miType"],
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

function mergeWithMsRecords(enrollment: EnrollmentDocument, msRecords: StudentMsRecord[]): EnrollmentWithMs {
  const records = msRecords.filter((r) => r.uid === enrollment.uid);
  const msLevelOne = records.some((r) => r.msLevel === "1");
  const msLevelTwo = records.some((r) => r.msLevel === "2");
  const latest = [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  return {
    ...enrollment,
    status: latest?.status ?? "pending",
    msLevelOne,
    msLevelTwo,
    rejectionReason: latest?.rejectionReason,
    msRecords: records,
  };
}

export const studentServerService = {
  async getProfile(uid: string): Promise<EnrollmentWithMs | null> {
    const rows = await query<StudentRow[]>(
      "SELECT * FROM students WHERE id = ?",
      [uid]
    );
    if (rows.length === 0) return null;
    const enrollment = mapStudentRow(rows[0]);

    const msRows = await query<MsRecordRow[]>(
      "SELECT * FROM student_ms_records WHERE student_id = ?",
      [uid]
    );
    const msRecords = msRows.map(mapMsRecordRow);
    return mergeWithMsRecords(enrollment, msRecords);
  },

  async getStudentMsRecords(uid: string): Promise<StudentMsRecord[]> {
    const rows = await query<MsRecordRow[]>(
      "SELECT * FROM student_ms_records WHERE student_id = ?",
      [uid]
    );
    return rows.map(mapMsRecordRow);
  },

  async getAttendanceSessions(): Promise<AttendanceSession[]> {
    const rows = await query<AttendanceSessionRow[]>(
      "SELECT * FROM attendance_sessions ORDER BY created_at DESC"
    );
    return rows.map(mapAttendanceSessionRow);
  },

  async getAttendanceRecord(studentUid: string, attendanceSessionId: string): Promise<AttendanceRecord | null> {
    const rows = await query<AttendanceRecordRow[]>(
      "SELECT * FROM attendance_records WHERE student_id = ? AND attendance_session_id = ?",
      [studentUid, attendanceSessionId]
    );
    if (rows.length === 0) return null;
    return mapAttendanceRecordRow(rows[0]);
  },

  async markAttendance(
    studentUid: string,
    attendanceSessionId: string,
    status: AttendanceRecordStatus,
    miNumber?: number,
    miType?: "in" | "out"
  ): Promise<void> {
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO attendance_records (student_id, attendance_session_id, status, mi_number, mi_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), mi_number = VALUES(mi_number), mi_type = VALUES(mi_type), updated_at = VALUES(updated_at)`,
      [studentUid, attendanceSessionId, status, miNumber ?? null, miType ?? null, now, now]
    );
  },

  async getStudentGrades(uid: string): Promise<{ ms1: StudentGrade | null; ms2: StudentGrade | null }> {
    const rows = await query<StudentGradeRow[]>(
      "SELECT * FROM student_grades WHERE student_id = ? AND ms_level IN ('1', '2')",
      [uid]
    );

    let ms1: StudentGrade | null = null;
    let ms2: StudentGrade | null = null;

    for (const row of rows) {
      const grade: StudentGrade = {
        student_uid: String(row.student_id),
        midterm: row.midterm ?? undefined,
        finalTerm: row.final_term ?? undefined,
        grade: row.grade,
        status: row.status as StudentGrade["status"],
        program: row.program as StudentGrade["program"],
        createdAt: row.created_at ?? "",
        updatedAt: row.updated_at ?? "",
      };
      if (row.ms_level === "1") ms1 = grade;
      if (row.ms_level === "2") ms2 = grade;
    }

    return { ms1, ms2 };
  },

  async getAttendanceOffense(uid: string): Promise<AttendanceOffense | null> {
    const rows = await query<AttendanceOffenseRow[]>(
      "SELECT * FROM attendance_offenses WHERE student_id = ?",
      [uid]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      student_uid: String(row.student_id),
      offend: row.offend,
      settled: !!row.settled,
      createdAt: row.created_at ?? "",
      updatedAt: row.updated_at ?? "",
      warningAcknowledgedAt: row.warning_acknowledged_at ?? undefined,
    };
  },

  async acknowledgeWarning(uid: string): Promise<void> {
    await execute(
      "UPDATE attendance_offenses SET warning_acknowledged_at = ? WHERE student_id = ?",
      [new Date().toISOString(), uid]
    );
  },

  async getSerialNumber(uid: string): Promise<Record<string, string> | null> {
    const rows = await query<SerialNumberRow[]>(
      "SELECT * FROM serial_numbers WHERE student_id = ?",
      [uid]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      serialNumber: row.serial_number ?? "",
      program: row.program ?? "",
      signatory1Name: row.signatory_1_name ?? "",
      signatory1Position: row.signatory_1_position ?? "",
      signatory2Name: row.signatory_2_name ?? "",
      signatory2Position: row.signatory_2_position ?? "",
      signatory3Name: row.signatory_3_name ?? "",
      signatory3Position: row.signatory_3_position ?? "",
      createdAt: row.created_at ?? "",
    };
  },

  async getSignatorySettings(program: string): Promise<Record<string, string> | null> {
    const rows = await query<SignatorySettingsRow[]>(
      "SELECT * FROM serial_number_settings WHERE program = ?",
      [program]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      program: row.program ?? "",
      signatory1Name: row.signatory_1_name ?? "",
      signatory1Position: row.signatory_1_position ?? "",
      signatory2Name: row.signatory_2_name ?? "",
      signatory2Position: row.signatory_2_position ?? "",
      signatory3Name: row.signatory_3_name ?? "",
      signatory3Position: row.signatory_3_position ?? "",
      updatedAt: row.updated_at ?? "",
    };
  },
};
