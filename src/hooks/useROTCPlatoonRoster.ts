import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";

export function useROTCPlatoonRoster(msLevel: "1" | "2" = "2") {
  const query_ = useQuery({
    queryKey: ["rotcPlatoonRoster", msLevel],
    queryFn: () => adminService.getROTCRosterGrouped(msLevel),
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
