import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { NSTProgram } from "@/types";

export function useAdminEnrollments(program: NSTProgram) {
  const query_ = useQuery({
    queryKey: ["adminEnrollments", program],
    queryFn: () => adminService.getEnrollmentsByProgram(program),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return {
    enrollments: query_.data ?? [],
    isLoading: query_.isPending,
    error: query_.error,
    refetch: query_.refetch,
  };
}
