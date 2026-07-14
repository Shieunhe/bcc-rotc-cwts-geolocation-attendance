import { NextRequest, NextResponse } from "next/server";
import { studentServerService } from "@/services/server/student.server";
import { getSessionToken, verifyToken } from "@/lib/auth";

type ServiceMethod = keyof typeof studentServerService;

export async function POST(req: NextRequest) {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const uid = String(payload.userId);

    const body = await req.json();
    const { method, params } = body as { method: string; params: Record<string, unknown> };

    if (!method || !(method in studentServerService)) {
      return NextResponse.json({ error: "Invalid method" }, { status: 400 });
    }

    const fn = studentServerService[method as ServiceMethod] as (...args: unknown[]) => Promise<unknown>;
    let result: unknown;

    switch (method) {
      case "getProfile":
        result = await fn.call(studentServerService, uid);
        break;
      case "getStudentMsRecords":
        result = await fn.call(studentServerService, uid);
        break;
      case "getAttendanceSessions":
        result = await fn.call(studentServerService);
        break;
      case "getAttendanceRecord":
        result = await fn.call(studentServerService, uid, params.attendanceSessionId);
        break;
      case "markAttendance":
        result = await fn.call(
          studentServerService,
          uid,
          params.attendanceSessionId,
          params.status,
          params.miNumber,
          params.miType
        );
        break;
      case "getStudentGrades":
        result = await fn.call(studentServerService, uid);
        break;
      case "getAttendanceOffense":
        result = await fn.call(studentServerService, uid);
        break;
      case "acknowledgeWarning":
        result = await fn.call(studentServerService, uid);
        break;
      case "getSerialNumber":
        result = await fn.call(studentServerService, uid);
        break;
      case "getSignatorySettings":
        result = await fn.call(studentServerService, params.program);
        break;
      default:
        return NextResponse.json({ error: "Unknown method" }, { status: 400 });
    }

    return NextResponse.json({ result: result ?? null });
  } catch (error) {
    console.error("[RPC student]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
