import { Resend } from "resend";

const resend = new Resend(process.env.RESENT_API_KEY);

export async function POST(req: Request) {
    try {
        const { email, code} = await req.json();
        const data = await.resend.emails.send({
            from: "email@admin.com",
            to: email,
            subject: "Password Reset Code",
            html: `<>`
        }
        )
    }
    
}