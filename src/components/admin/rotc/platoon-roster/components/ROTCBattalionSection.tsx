import {
  ROTCCompany, ROTCPlatoon, EnrollmentDocument,
  ROTC_PLATOONS_PER_COMPANY, ROTC_PLATOON_SLOT_LIMIT,
} from "@/types";
import ROTCPlatoonTable from "./ROTCPlatoonTable";

export type BattalionData = Record<ROTCCompany, Record<number, EnrollmentDocument[]>>;

const COMPANY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Alpha:   { bg: "bg-blue-50",    text: "text-blue-700",    bar: "bg-blue-500" },
  Bravo:   { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500" },
  Charlie: { bg: "bg-amber-50",   text: "text-amber-700",   bar: "bg-amber-500" },
  Delta:   { bg: "bg-purple-50",  text: "text-purple-700",  bar: "bg-purple-500" },
  Echo:    { bg: "bg-rose-50",    text: "text-rose-700",    bar: "bg-rose-500" },
  Foxtrot: { bg: "bg-cyan-50",    text: "text-cyan-700",    bar: "bg-cyan-500" },
  Golf:    { bg: "bg-orange-50",  text: "text-orange-700",  bar: "bg-orange-500" },
  Hotel:   { bg: "bg-teal-50",    text: "text-teal-700",    bar: "bg-teal-500" },
};

export function countBattalionMembers(data: BattalionData, companies: ROTCCompany[]): number {
  let count = 0;
  for (const c of companies) {
    for (let p = 1; p <= ROTC_PLATOONS_PER_COMPANY; p++) {
      count += data[c]?.[p]?.length ?? 0;
    }
  }
  return count;
}

interface ROTCBattalionSectionProps {
  battalionNum: number;
  label: string;
  companies: ROTCCompany[];
  data: BattalionData;
  expanded: string | null;
  onToggle: (key: string) => void;
}

export default function ROTCBattalionSection({
  battalionNum,
  label,
  companies,
  data,
  expanded,
  onToggle,
}: ROTCBattalionSectionProps) {
  const total = countBattalionMembers(data, companies);
  const capacity = companies.length * ROTC_PLATOONS_PER_COMPANY * ROTC_PLATOON_SLOT_LIMIT;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-sm font-bold text-gray-800">Battalion {battalionNum} — {label}</h2>
        <span className="text-xs font-semibold text-gray-400 tabular-nums">{total}/{capacity}</span>
      </div>
      <div className="space-y-2">
        {companies.map((company) => {
          const colors = COMPANY_COLORS[company] ?? COMPANY_COLORS.Alpha;
          const companyTotal = Array.from({ length: ROTC_PLATOONS_PER_COMPANY }, (_, i) => data[company]?.[i + 1]?.length ?? 0).reduce((a, b) => a + b, 0);
          const companyCapacity = ROTC_PLATOONS_PER_COMPANY * ROTC_PLATOON_SLOT_LIMIT;
          const isFull = companyTotal >= companyCapacity;

          return (
            <div key={company} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                    <span className={`text-sm font-bold ${colors.text}`}>{company[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-800">{company} Company</h3>
                      {isFull && (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-semibold">FULL</span>
                      )}
                      <span className="text-xs text-gray-400 tabular-nums ml-auto">{companyTotal}/{companyCapacity}</span>
                    </div>
                  </div>
                </div>

                {/* Platoon rows */}
                <div className="space-y-1.5">
                  {Array.from({ length: ROTC_PLATOONS_PER_COMPANY }, (_, i) => {
                    const platoonNum = (i + 1) as ROTCPlatoon;
                    const members = data[company]?.[platoonNum] ?? [];
                    const count = members.length;
                    const pct = Math.round((count / ROTC_PLATOON_SLOT_LIMIT) * 100);
                    const key = `${company}-${platoonNum}`;
                    const isOpen = expanded === key;

                    return (
                      <div key={platoonNum}>
                        <button
                          onClick={() => onToggle(key)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-left"
                        >
                          <span className="text-xs font-semibold text-gray-500 w-16 shrink-0">Platoon {platoonNum}</span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${colors.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <span className="text-[11px] font-semibold text-gray-400 tabular-nums w-10 text-right">{count}/{ROTC_PLATOON_SLOT_LIMIT}</span>
                          <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isOpen && (
                          <div className="border-t border-gray-50 mt-1">
                            <ROTCPlatoonTable members={members} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
