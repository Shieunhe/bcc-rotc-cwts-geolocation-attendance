import { NextRequest, NextResponse } from "next/server";
import { studentServerService } from "@/services/server/student.server";

type ServiceMethod = keyof typeof studentServerService;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { method, params } = body as { method: string; params: Record<string, unknown> };

    if (!method || !(method in studentServerService)) {
      return NextResponse.json({ error: "Invalid method" }, { status: 400 });
    }

    const fn = studentServerService[method as ServiceMethod] as (...args: unknown[]) => Promise<unknown>;
    let result: unknown;

    switch (method) {
      case "getProfile":
        result = await fn.call(studentServerService, params.uid);
        break;
      case "getStudentMsRecords":
        result = await fn.call(studentServerService, params.uid);
        break;
      case "getAttendanceSessions":
        result = await fn.call(studentServerService);
        break;
      case "getAttendanceRecord":
        result = await fn.call(studentServerService, params.studentUid, params.attendanceSessionId);
        break;
      case "markAttendance":
        result = await fn.call(
          studentServerService,
          params.studentUid,
          params.attendanceSessionId,
          params.status,
          params.miNumber,
          params.miType
        );
        break;
      case "getStudentGrades":
        result = await fn.call(studentServerService, params.uid);
        break;
      case "getAttendanceOffense":
        result = await fn.call(studentServerService, params.uid);
        break;
      case "acknowledgeWarning":
        result = await fn.call(studentServerService, params.uid);
        break;
      case "getSerialNumber":
        result = await fn.call(studentServerService, params.uid);
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
