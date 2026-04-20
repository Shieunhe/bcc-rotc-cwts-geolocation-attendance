import AdminPageLayout from "@/components/layout/AdminPageLayout";
import AdminViewRecords from "@/components/admin/shared/view-records/AdminViewRecords";

export default function RotcViewRecordsPage() {
  return (
    <AdminPageLayout program="ROTC">
      <AdminViewRecords program="ROTC" />
    </AdminPageLayout>
  );
}
