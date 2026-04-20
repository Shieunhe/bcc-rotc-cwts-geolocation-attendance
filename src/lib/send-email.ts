import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, code: string) {
    try {
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
            to: email,
            subject: "Password Reset Code",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
                    <p style="color: #666; font-size: 16px;">
                        You have requested to reset your password. Use the code below to proceed:
                    </p>
                    <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${code}</span>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        This code will expire in 15 minutes. If you did not request this, please ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        BCC ROTC/CWTS Attendance System
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error("Failed to send email:", error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error("Email send error:", error);
        return { success: false, error: "Failed to send password reset email" };
    }
}