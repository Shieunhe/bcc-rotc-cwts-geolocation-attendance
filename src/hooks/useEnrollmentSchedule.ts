import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { EnrollmentSchedule, NSTProgram } from "@/types";

export function useEnrollmentSchedule(program: NSTProgram) {
  const queryClient = useQueryClient();

  const query_ = useQuery({
    queryKey: ["enrollmentSchedule", program],
    queryFn: () => adminService.getEnrollmentSchedule(program),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: (schedule: EnrollmentSchedule) =>
      adminService.saveEnrollmentSchedule(schedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollmentSchedule", program] });
    },
  });

  return {
    schedule: query_.data ?? null,
    isLoading: query_.isPending,
    error: query_.error,
    save: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
