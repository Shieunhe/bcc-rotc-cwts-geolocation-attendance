import { NextResponse } from "next/server";
import { enrollmentServer } from "@/services/server/enrollment.server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { method, params } = body as {
      method?: string;
      params?: Record<string, unknown>;
    };

    if (!method || !params) {
      return NextResponse.json(
        { success: false, error: "Missing method or params." },
        { status: 400 }
      );
    }

    switch (method) {
      case "submitEnrollment": {
        const result = await enrollmentServer.submitEnrollment(
          params.formData as Parameters<
            typeof enrollmentServer.submitEnrollment
          >[0]
        );
        return NextResponse.json(result);
      }

      case "submitReEnrollment": {
        const result = await enrollmentServer.submitReEnrollment(
          params.uid as string,
          params.formData as Parameters<
            typeof enrollmentServer.submitReEnrollment
          >[1],
          params.existingDoc as Parameters<
            typeof enrollmentServer.submitReEnrollment
          >[2]
        );
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown method: ${method}` },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("[rpc/enrollment]", err);
    return NextResponse.json(
      { success: false, error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
