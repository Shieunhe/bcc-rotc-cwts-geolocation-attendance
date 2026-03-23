import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface UseAuthGuardOptions {
  authLoading: boolean;
  uid: string | null | undefined;
  redirectTo?: string;
}

export function useAuthGuard({ authLoading, uid, redirectTo = "/login" }: UseAuthGuardOptions) {
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && uid === null) {
      router.replace(redirectTo);
    }
  }, [authLoading, uid, redirectTo, router]);
}
