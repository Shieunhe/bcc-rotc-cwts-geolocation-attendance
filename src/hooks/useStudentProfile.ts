import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { studentService } from "@/services/student.service";

export function useStudentProfile() {
  const [uid, setUid] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setUid(data?.user?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setUid(null);
      });
    return () => { cancelled = true; };
  }, []);

  const query = useQuery({
    queryKey: ["studentProfile", uid],
    queryFn: () => studentService.getProfile(String(uid!)),
    enabled: !!uid,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
  });

  return {
    profile: query.data ?? null,
    authLoading: uid === undefined,
    dataLoading: query.isPending && !!uid,
    error: query.error,
    uid: uid ? String(uid) : uid === null ? null : undefined,
  };
}
