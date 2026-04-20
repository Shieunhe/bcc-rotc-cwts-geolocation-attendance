import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendPasswordResetEmail } from "@/lib/send-email";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Check if user exists in Firebase
        try {
            await adminAuth.getUserByEmail(email);
        } catch {
            return NextResponse.json(
                { error: "No account found with this email" },
                { status: 404 }
            );
        }

        // Generate 6-digit verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

        // Store verification code in Firestore
        await adminDb.collection("passwordResetCodes").doc(email).set({
            code,
            expiresAt,
            createdAt: Date.now(),
        });

        // Send email with verification code
        const emailResult = await sendPasswordResetEmail(email, code);

        if (!emailResult.success) {
            return NextResponse.json(
                { error: "Failed to send verification email" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Verification code sent to your email",
        });
    } catch (error) {
        console.error("Send code error:", error);
        return NextResponse.json(
            { error: "Failed to send verification code" },
            { status: 500 }
        );
    }
}
