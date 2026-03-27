import { EnrollmentDocument } from "@/types";

export default function ROTCPlatoonTable({ members }: { members: EnrollmentDocument[] }) {
  if (members.length === 0) {
    return <p className="px-5 py-4 text-sm text-gray-400 text-center">No cadets assigned.</p>;
  }
  return (
    <>
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">#</th>
              <th className="px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Student ID</th>
              <th className="px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Name</th>
              <th className="px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Course</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m, i) => (
              <tr key={m.uid} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition">
                <td className="px-5 py-2.5 text-xs text-gray-400">{i + 1}</td>
                <td className="px-5 py-2.5 text-xs font-medium text-gray-700">{m.studentId}</td>
                <td className="px-5 py-2.5 text-xs font-medium text-gray-800">
                  {m.lastName}, {m.firstName} {m.middleName?.[0] ? `${m.middleName[0]}.` : ""}
                </td>
                <td className="px-5 py-2.5 text-xs text-gray-600">{m.course}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sm:hidden divide-y divide-gray-50">
        {members.map((m, i) => (
          <div key={m.uid} className="px-4 py-2.5 flex items-center gap-3">
            <span className="text-[11px] text-gray-400 w-5 shrink-0">{i + 1}</span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{m.lastName}, {m.firstName}</p>
              <p className="text-[11px] text-gray-400">{m.studentId} • {m.course}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
