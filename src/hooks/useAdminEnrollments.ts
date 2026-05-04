import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { NSTProgram, EnrollmentDocument } from "@/types";

const EMPTY: EnrollmentDocument[] = [];

export function useAdminEnrollments(program: NSTProgram) {
  const query_ = useQuery({
    queryKey: ["adminEnrollments", program],
    queryFn: () => adminService.getEnrollmentsByProgram(program),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const enrollments = useMemo(() => query_.data ?? EMPTY, [query_.data]);

  return {
    enrollments,
    isLoading: query_.isPending,
    error: query_.error,
    refetch: query_.refetch,
  };
}
