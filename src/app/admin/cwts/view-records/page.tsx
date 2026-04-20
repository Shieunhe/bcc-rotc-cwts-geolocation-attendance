import AdminPageLayout from "@/components/layout/AdminPageLayout";
import AdminViewRecords from "@/components/admin/shared/view-records/AdminViewRecords";

export default function CwtsViewRecordsPage() {
  return (
    <AdminPageLayout program="CWTS">
      <AdminViewRecords program="CWTS" />
    </AdminPageLayout>
  );
}
