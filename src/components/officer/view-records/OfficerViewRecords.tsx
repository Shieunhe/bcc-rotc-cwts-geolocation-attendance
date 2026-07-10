"use client";

import { useState } from "react";
import AdminViewRecords from "@/components/admin/shared/view-records/AdminViewRecords";
import PageIntroPanel from "@/components/common/PageIntroPanel";
import { NSTProgram } from "@/types";

const TABS: { label: string; program: NSTProgram }[] = [
  { label: "ROTC", program: "ROTC" },
  { label: "CWTS", program: "CWTS" },
];

export default function OfficerViewRecords() {
  const [activeTab, setActiveTab] = useState<NSTProgram>("ROTC");

  return (
    <div className="space-y-5">
      <PageIntroPanel
        title="View Student Records"
        subtitle="View complete student records of all ROTC and CWTS students."
        variant="sky"
      />

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.program}
            onClick={() => setActiveTab(tab.program)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              activeTab === tab.program
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AdminViewRecords program={activeTab} />
    </div>
  );
}
