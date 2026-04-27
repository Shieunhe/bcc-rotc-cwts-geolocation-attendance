import AdminPageLayout from "@/components/layout/AdminPageLayout";
import AdminSerialNumber from "@/components/admin/shared/serial-number/AdminSerialNumber";

export default function RotcSerialNumberPage() {
  return (
    <AdminPageLayout program="ROTC">
      <AdminSerialNumber program="ROTC" />
    </AdminPageLayout>
  );
}
