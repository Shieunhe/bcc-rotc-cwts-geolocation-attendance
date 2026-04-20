import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
    try {
        const { email, code, newPassword } = await req.json();

        if (!email || !code || !newPassword) {
            return NextResponse.json(
                { error: "Email, code, and new password are required" },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Get stored verification code from Firestore
        const codeDoc = await adminDb
            .collection("passwordResetCodes")
            .doc(email)
            .get();

        if (!codeDoc.exists) {
            return NextResponse.json(
                { error: "No verification code found. Please request a new one." },
                { status: 400 }
            );
        }

        const codeData = codeDoc.data();

        // Check if code is expired
        if (codeData?.expiresAt < Date.now()) {
            await adminDb.collection("passwordResetCodes").doc(email).delete();
            return NextResponse.json(
                { error: "Verification code has expired. Please request a new one." },
                { status: 400 }
            );
        }

        // Verify the code
        if (codeData?.code !== code) {
            return NextResponse.json(
                { error: "Invalid verification code" },
                { status: 400 }
            );
        }

        // Get user by email and update password
        const user = await adminAuth.getUserByEmail(email);
        await adminAuth.updateUser(user.uid, {
            password: newPassword,
        });

        // Delete the verification code after successful reset
        await adminDb.collection("passwordResetCodes").doc(email).delete();

        return NextResponse.json({
            success: true,
            message: "Password reset successfully",
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { error: "Failed to reset password" },
            { status: 500 }
        );
    }
}
