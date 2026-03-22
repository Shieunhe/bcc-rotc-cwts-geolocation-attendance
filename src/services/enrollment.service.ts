import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { EnrollmentDocument } from "@/types";
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

export const enrollmentService = {
  async submitEnrollment(formData: EnrollmentFormData): Promise<EnrollmentResult> {
    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const uid = userCredential.user.uid;

      // 2. Convert files to base64 blobs
      const [photoBase64, corBase64, medicalCertBase64, xrayBase64] = await Promise.all([
        fileToBase64(formData.photo),
        fileToBase64(formData.corFile),
        fileToBase64(formData.medicalCertificate),
        fileToBase64(formData.xrayFile),
      ]);

      // 3. Prepare data for Firestore
      const firestoreData: EnrollmentDocument = {
        uid,
        // Personal Info
        studentId: formData.studentId,
        lastName: formData.lastName,
        firstName: formData.firstName,
        middleName: formData.middleName || "",
        religion: formData.religion,
        birthdate: formData.birthdate,
        sex: formData.sex,
        contactNumber: formData.contactNumber,
        placeOfBirth: formData.placeOfBirth,
        temporaryBarangay: formData.temporaryBarangay,
        temporaryMunicipality: formData.temporaryMunicipality,
        temporaryProvince: formData.temporaryProvince,
        permanentBarangay: formData.permanentBarangay,
        permanentMunicipality: formData.permanentMunicipality,
        permanentProvince: formData.permanentProvince,
        fatherName: formData.fatherName,
        fatherOccupation: formData.fatherOccupation,
        motherName: formData.motherName,
        motherOccupation: formData.motherOccupation,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactAddress: formData.emergencyContactAddress,
        emergencyContactRelationship: formData.emergencyContactRelationship,
        emergencyContactContactNumber: formData.emergencyContactContactNumber,
        willingToTakeAdvanceCourse: formData.willingToTakeAdvanceCourse,
        // Academic Info
        course: formData.course,
        yearLevel: formData.yearLevel,
        nstpComponent: formData.nstpComponent,
        msLevel: formData.msLevel,
        // Physical & Health
        height: formData.height,
        weight: formData.weight,
        bloodType: formData.bloodType,
        complexion: formData.complexion,
        hasMedicalCondition: formData.hasMedicalCondition,
        medicalCondition: formData.medicalCondition || "",
        medicalCertificate: medicalCertBase64,
        xrayFile: xrayBase64,
        // Account Info
        email: formData.email,
        username: formData.username,
        password: formData.password,
        photo: photoBase64,
        corFile: corBase64,
        // Metadata
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "pending",
      };

      // 4. Save to Firestore with UID as document ID
      await setDoc(doc(db, "account_reservations", uid), firestoreData);

      return { success: true, uid };
    } catch (err: unknown) {
      console.error("Enrollment error:", err);
      let errorMessage = "Enrollment failed.";
      
      if (err instanceof Error) {
        if (err.message.includes("email-already-in-use")) {
          errorMessage = "This email is already registered. Please use a different email.";
        } else if (err.message.includes("weak-password")) {
          errorMessage = "Password is too weak. Please use a stronger password.";
        } else if (err.message.includes("invalid-email")) {
          errorMessage = "Invalid email address.";
        } else {
          errorMessage = err.message;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  },
};
