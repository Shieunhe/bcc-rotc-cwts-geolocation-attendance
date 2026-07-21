import { EnrollmentDocument, EnrollmentSchedule, NSTProgram } from "@/types";
import { EnrollmentFormData } from "@/types/enrollmentTypes";

const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const QUALITY = 0.7;

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL("image/jpeg", QUALITY);
        resolve(base64);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

async function fileToBase64(file: File | null): Promise<string | null> {
  if (!file) return null;
  
  if (file.type.startsWith("image/")) {
    return compressImage(file);
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export interface EnrollmentResult {
  success: boolean;
  uid?: string;
  error?: string;
}

async function rpc(method: string, params: Record<string, unknown>): Promise<EnrollmentResult> {
  const res = await fetch("/api/rpc/enrollment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params }),
  });
  return res.json();
}

async function serializeFiles(formData: EnrollmentFormData) {
  const [photoBase64, corBase64, medicalCertBase64, xrayBase64] =
    await Promise.all([
      fileToBase64(formData.photo),
      fileToBase64(formData.corFile),
      fileToBase64(formData.medicalCertificate),
      fileToBase64(formData.xrayFile),
    ]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { photo, corFile, medicalCertificate, xrayFile, confirmPassword, ...fields } = formData;

  return {
    ...fields,
    photo: photoBase64,
    corFile: corBase64,
    medicalCertificate: medicalCertBase64,
    xrayFile: xrayBase64,
  };
}

export const enrollmentService = {
  async getEnrollmentSchedule(program: NSTProgram, msLevel: string): Promise<EnrollmentSchedule | null> {
    const res = await rpc("getEnrollmentSchedule", { program, msLevel });
    return (res as unknown as { result: EnrollmentSchedule | null }).result;
  },

  async getEnrollmentSchedules(program: NSTProgram): Promise<EnrollmentSchedule[]> {
    const res = await rpc("getEnrollmentSchedules", { program });
    return (res as unknown as { result: EnrollmentSchedule[] }).result;
  },

  async checkStudentIdExists(studentId: string): Promise<boolean> {
    try {
      const result = await rpc("checkStudentIdExists", { studentId });
      return !!(result as unknown as { exists: boolean }).exists;
    } catch {
      return false;
    }
  },

  async submitEnrollment(formData: EnrollmentFormData): Promise<EnrollmentResult> {
    try {
      const serialized = await serializeFiles(formData);
      return await rpc("submitEnrollment", { formData: serialized });
    } catch (err: unknown) {
      console.error("Enrollment error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Enrollment failed.",
      };
    }
  },

  async submitReEnrollment(
    uid: string,
    formData: EnrollmentFormData,
    existingDoc: EnrollmentDocument
  ): Promise<EnrollmentResult> {
    try {
      const serialized = await serializeFiles(formData);
      return await rpc("submitReEnrollment", {
        uid,
        formData: serialized,
        existingDoc,
      });
    } catch (err: unknown) {
      console.error("Re-enrollment error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Re-enrollment failed.",
      };
    }
  },
};
