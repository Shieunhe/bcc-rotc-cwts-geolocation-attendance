"use client";

import { useMemo, useState } from "react";
import { saveAs } from "file-saver";
import { useAdminEnrollments } from "@/hooks/useAdminEnrollments";
import { adminService } from "@/services/admin.service";
import { EnrollmentWithMs, NSTProgram, StudentMsRecord, StudentGrade } from "@/types";
import PageIntroPanel from "@/components/common/PageIntroPanel";
import StudentRecordModal from "./StudentRecordModal";

interface AdminViewRecordsProps {
  program: NSTProgram;
}

function extractSY(scheduleId: string): string {
  const parts = scheduleId.split("_");
  return parts.length >= 3 ? parts.slice(2).join("_") : "";
}

interface FlatStudentRow {
  enrollment: EnrollmentWithMs;
  msRecord: StudentMsRecord;
  msLabel: string;
  sy: string;
}

interface ExportRow {
  no: number;
  surname: string;
  firstName: string;
  middleName: string;
  suffix: string;
  course: string;
  company: string;
  platoon: string;
  studentId: string;
  birthdate: string;
  sex: string;
  address: string;
  msLevel: string;
  midterm: string;
  finalTerm: string;
  average: string;
}

function flattenApproved(enrollments: EnrollmentWithMs[]): FlatStudentRow[] {
  const rows: FlatStudentRow[] = [];
  for (const enrollment of enrollments) {
    for (const record of enrollment.msRecords) {
      if (record.status !== "approved") continue;
      rows.push({
        enrollment,
        msRecord: record,
        msLabel: record.msLevel,
        sy: extractSY(record.scheduleId),
      });
    }
  }
  return rows;
}

const COURSE_ACRONYMS: Record<string, string> = {
  "BS Criminology": "BSCRIM",
  "BS Hospitality Management": "BSHM",
  "BS Information Technology": "BSIT",
  "BS Tourism Management": "BSTM",
  "BEED - Bachelor of Elementary Education": "BEED",
  "BSED - Major in English": "BSED-English",
  "BSED - Major in Mathematics": "BSED-Mathematics",
};

function getCourseAcronym(course: string): string {
  return COURSE_ACRONYMS[course] || course;
}

function formatBirthdate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatGradeValue(value: number | undefined): string {
  return value != null ? value.toFixed(1) : "—";
}

function getRotcAssignment(enrollment: EnrollmentWithMs): { company: string; platoon: string } {
  if (enrollment.willingToTakeAdvanceCourse) {
    return { company: "Advance Course", platoon: "—" };
  }
  if (enrollment.specialUnit) {
    return { company: enrollment.specialUnit, platoon: "—" };
  }
  return {
    company: enrollment.rotcCompany || "—",
    platoon: enrollment.rotcPlatoon ? String(enrollment.rotcPlatoon) : "—",
  };
}

function getGradeForRow(
  row: FlatStudentRow,
  ms1Grades: Map<string, StudentGrade>,
  ms2Grades: Map<string, StudentGrade>,
): StudentGrade | undefined {
  return row.msRecord.msLevel === "1"
    ? ms1Grades.get(row.enrollment.uid)
    : ms2Grades.get(row.enrollment.uid);
}

export default function AdminViewRecords({ program }: AdminViewRecordsProps) {
  const levelLabel = program === "CWTS" ? "CWTS Level" : "MS Level";
  const levelPrefix = program === "CWTS" ? "CWTS" : "MS";
  const { enrollments, isLoading } = useAdminEnrollments(program);
  const [search, setSearch] = useState("");
  const [msFilter, setMsFilter] = useState("All");
  const [syFilter, setSyFilter] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState<EnrollmentWithMs | null>(null);
  const [selectedMsLevel, setSelectedMsLevel] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const allRows = useMemo(() => flattenApproved(enrollments), [enrollments]);

  const availableSYs = useMemo(() => {
    const sySet = new Set<string>();
    for (const row of allRows) {
      if (row.sy) sySet.add(row.sy);
    }
    return Array.from(sySet).sort().reverse();
  }, [allRows]);

  const filtered = useMemo(() => {
    return allRows
      .filter((row) => {
        if (msFilter !== "All" && row.msRecord.msLevel !== msFilter) return false;
        if (syFilter !== "All" && row.sy !== syFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          const haystack = `${row.enrollment.firstName} ${row.enrollment.lastName} ${row.enrollment.studentId} ${row.enrollment.course}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (program === "CWTS") {
          const compA = a.enrollment.company ?? "";
          const compB = b.enrollment.company ?? "";
          if (compA !== compB) return compA.localeCompare(compB);
          return a.enrollment.lastName.localeCompare(b.enrollment.lastName);
        }
        const batA = a.enrollment.battalion ?? 0;
        const batB = b.enrollment.battalion ?? 0;
        if (batA !== batB) return batA - batB;
        const compA = a.enrollment.rotcCompany ?? "";
        const compB = b.enrollment.rotcCompany ?? "";
        if (compA !== compB) return compA.localeCompare(compB);
        const platA = a.enrollment.rotcPlatoon ?? 0;
        const platB = b.enrollment.rotcPlatoon ?? 0;
        if (platA !== platB) return platA - platB;
        return a.enrollment.lastName.localeCompare(b.enrollment.lastName);
      });
  }, [allRows, msFilter, syFilter, search, program]);

  async function downloadExcel() {
    if (filtered.length === 0 || isExporting) return;

    setIsExporting(true);
    try {
      const ExcelJS = await import("exceljs");
      const [ms1Grades, ms2Grades, logoResponse] = await Promise.all([
        adminService.getStudentGradesByMs("ms1", program),
        adminService.getStudentGradesByMs("ms2", program),
        fetch("/image/bcclogo-removebg-preview.png"),
      ]);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Records", {
        views: [{ state: "frozen", ySplit: 6 }],
      });

      const exportRows: ExportRow[] = filtered.map((row, idx) => {
        const address = [
          row.enrollment.permanentBarangay,
          row.enrollment.permanentMunicipality,
          row.enrollment.permanentProvince,
        ].filter(Boolean).join(", ") || "—";

        const gradeData = getGradeForRow(row, ms1Grades, ms2Grades);
        const rotcAssignment = getRotcAssignment(row.enrollment);

        return {
          no: idx + 1,
          surname: row.enrollment.lastName,
          firstName: row.enrollment.firstName,
          middleName: row.enrollment.middleName || "",
          suffix: row.enrollment.suffix || "N/A",
          course: getCourseAcronym(row.enrollment.course) || row.enrollment.course,
          company: program === "ROTC" ? rotcAssignment.company : (row.enrollment.company || "—"),
          platoon: program === "ROTC" ? rotcAssignment.platoon : "—",
          studentId: row.enrollment.studentId,
          birthdate: formatBirthdate(row.enrollment.birthdate),
          sex: row.enrollment.sex || "—",
          address,
          msLevel: `${levelPrefix} ${row.msLabel}`,
          midterm: formatGradeValue(gradeData?.midterm),
          finalTerm: formatGradeValue(gradeData?.finalTerm),
          average: formatGradeValue(gradeData?.grade),
        };
      });

      const tableHeaders = [
        "#",
        "SURNAME",
        "FIRST NAME",
        "MIDDLE NAME",
        "SUFFIX",
        "COURSE",
        "COMPANY",
        "PLATOON",
        "ID NUMBER",
        "BIRTHDATE",
        "SEX",
        "ADDRESS",
        program === "CWTS" ? "CWTS LEVEL" : "MS LEVEL",
        "MIDTERM",
        "FINAL",
        "AVERAGE",
      ];

      worksheet.columns = [
        { key: "no", width: 6 },
        { key: "surname", width: 18 },
        { key: "firstName", width: 18 },
        { key: "middleName", width: 18 },
        { key: "suffix", width: 10 },
        { key: "course", width: 14 },
        { key: "company", width: 16 },
        { key: "platoon", width: 12 },
        { key: "studentId", width: 18 },
        { key: "birthdate", width: 14 },
        { key: "sex", width: 12 },
        { key: "address", width: 30 },
        { key: "msLevel", width: 12 },
        { key: "midterm", width: 12 },
        { key: "finalTerm", width: 12 },
        { key: "average", width: 12 },
      ];

      worksheet.mergeCells("A1:D1");
      worksheet.mergeCells("A2:D2");
      worksheet.mergeCells("E1:L1");
      worksheet.mergeCells("E2:L2");
      worksheet.mergeCells("E3:L3");
      worksheet.mergeCells("N1:P1");
      worksheet.mergeCells("N2:P2");

      worksheet.getCell("A1").value = "Region: VII";
      worksheet.getCell("A2").value = `NSTP Component: ${program}`;
      worksheet.getCell("E2").value = "BUENAVISTA COMMUNITY COLLEGE";
      worksheet.getCell("E3").value = "Cangawa, Buenavista, Bohol";
      worksheet.getCell("N1").value = `School Year: ${syFilter !== "All" ? `SY ${syFilter}` : "All"}`;
      worksheet.getCell("N2").value = `${levelLabel}: ${msFilter !== "All" ? `${levelPrefix} ${msFilter}` : "All"}`;

      worksheet.getRow(1).height = 42;
      worksheet.getRow(2).height = 28;
      worksheet.getRow(3).height = 22;
      worksheet.getRow(5).height = 24;

      for (const ref of ["A1", "A2", "N1", "N2"]) {
        const cell = worksheet.getCell(ref);
        cell.font = { name: "Arial", size: 11, bold: true };
        cell.alignment = {
          vertical: "middle",
          horizontal: ref.startsWith("N") ? "right" : "left",
        };
      }

      worksheet.getCell("E2").font = { name: "Arial", size: 16, bold: true };
      worksheet.getCell("E2").alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getCell("E3").font = { name: "Arial", size: 11 };
      worksheet.getCell("E3").alignment = { vertical: "middle", horizontal: "center" };

      if (logoResponse.ok) {
        const buffer = await logoResponse.arrayBuffer();
        const imageId = workbook.addImage({
          buffer,
          extension: "png",
        });
        worksheet.addImage(imageId, {
          tl: { col: 8.82, row: 0.1 },
          ext: { width: 48, height: 48 },
        });
      }

      const headerRow = worksheet.getRow(5);
      tableHeaders.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: program === "ROTC" ? "FF1D4ED8" : "FF059669" },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFD1D5DB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      });

      let rowNumber = 6;
      for (const exportRow of exportRows) {
        const row = worksheet.getRow(rowNumber);
        row.values = [
          exportRow.no,
          exportRow.surname,
          exportRow.firstName,
          exportRow.middleName,
          exportRow.suffix,
          exportRow.course,
          exportRow.company,
          exportRow.platoon,
          exportRow.studentId,
          exportRow.birthdate,
          exportRow.sex,
          exportRow.address,
          exportRow.msLevel,
          exportRow.midterm,
          exportRow.finalTerm,
          exportRow.average,
        ];

        for (let col = 1; col <= tableHeaders.length; col++) {
          const cell = row.getCell(col);
          cell.font = { name: "Arial", size: 10 };
          cell.alignment = {
            vertical: "middle",
            horizontal: col === 1 || col >= 12 ? "center" : "left",
            wrapText: col === 11,
          };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE5E7EB" } },
            left: { style: "thin", color: { argb: "FFE5E7EB" } },
            bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
            right: { style: "thin", color: { argb: "FFE5E7EB" } },
          };
        }

        row.height = 20;
        rowNumber++;
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const filterParts: string[] = [program];
      if (msFilter !== "All") filterParts.push(`${levelPrefix}${msFilter}`);
      if (syFilter !== "All") filterParts.push(`SY${syFilter}`);
      const filename = `${filterParts.join("_")}_Records.xlsx`;

      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        filename,
      );
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageIntroPanel
        title="View Records"
        subtitle={`View complete records of all ${program} students.`}
        variant={program === "CWTS" ? "emerald" : "sky"}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, student ID, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={msFilter}
          onChange={(e) => setMsFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">{`All ${levelLabel}s`}</option>
          <option value="1">{`${levelPrefix} 1`}</option>
          <option value="2">{`${levelPrefix} 2`}</option>
        </select>
        <select
          value={syFilter}
          onChange={(e) => setSyFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All SY</option>
          {availableSYs.map((sy) => (
            <option key={sy} value={sy}>SY {sy}</option>
          ))}
        </select>
        <button
          onClick={downloadExcel}
          disabled={filtered.length === 0 || isExporting}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {isExporting ? "Preparing Excel..." : "Download Excel"}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Student ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Course</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">{levelLabel}</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">SY</th>
                {program === "ROTC" && (
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Battalion</th>
                )}
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={program === "ROTC" ? 8 : 7} className="py-10 text-center text-gray-400">
                    No students found.
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr key={`${row.enrollment.uid}-${row.msRecord.msLevel}-${row.sy || "nosy"}`} className="transition hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{row.enrollment.studentId}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.enrollment.lastName}, {row.enrollment.firstName}
                      {row.enrollment.suffix ? ` ${row.enrollment.suffix}` : ""}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{row.enrollment.course}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                        {`${levelPrefix} ${row.msLabel}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{row.sy ? `SY ${row.sy}` : "—"}</td>
                    {program === "ROTC" && (
                      <td className="px-4 py-3 text-gray-500">
                        {row.enrollment.willingToTakeAdvanceCourse
                          ? "Advance Course"
                          : row.enrollment.battalion
                            ? `Battalion ${row.enrollment.battalion}`
                            : row.enrollment.specialUnit
                              ? "Special Platoon"
                              : "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedStudent(row.enrollment);
                          setSelectedMsLevel(row.msRecord.msLevel);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
          Showing {filtered.length} of {allRows.length} record(s)
        </div>
      </div>

      {selectedStudent && selectedMsLevel && (
        <StudentRecordModal
          student={selectedStudent}
          program={program}
          msLevel={selectedMsLevel}
          onClose={() => {
            setSelectedStudent(null);
            setSelectedMsLevel(null);
          }}
        />
      )}
    </div>
  );
}
