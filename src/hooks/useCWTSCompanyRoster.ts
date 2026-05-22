import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { CWTSCompany, EnrollmentWithMs } from "@/types";

export function useCWTSCompanyRoster() {
  const query_ = useQuery({
    queryKey: ["cwtsCompanyRoster"],
    queryFn: () => adminService.getCWTSCompanyCounts(),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  return {
    companies: query_.data ?? null,
    isLoading: query_.isPending,
    error: query_.error,
    refetch: query_.refetch,
  } as {
    companies: Record<CWTSCompany, EnrollmentWithMs[]> | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}
