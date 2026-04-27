import AdminPageLayout from "@/components/layout/AdminPageLayout";
import AdminSerialNumber from "@/components/admin/shared/serial-number/AdminSerialNumber";

export default function CwtsSerialNumberPage() {
  return (
    <AdminPageLayout program="CWTS">
      <AdminSerialNumber program="CWTS" />
    </AdminPageLayout>
  );
}
