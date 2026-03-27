import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";

export function useROTCPlatoonRoster() {
  const query_ = useQuery({
    queryKey: ["rotcPlatoonRoster"],
    queryFn: () => adminService.getROTCRosterGrouped(),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  return {
    roster: query_.data ?? null,
    isLoading: query_.isPending,
    error: query_.error,
    refetch: query_.refetch,
  };
}
