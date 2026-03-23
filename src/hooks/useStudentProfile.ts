import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useQuery } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";
import { studentService } from "@/services/student.service";

export function useStudentProfile() {
  const [uid, setUid] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
    });
    return unsubscribe;
  }, []);

  const query = useQuery({
    queryKey: ["studentProfile", uid],
    queryFn: () => studentService.getProfile(uid!),
    enabled: !!uid,
    staleTime: Infinity,      // never considered stale — won't refetch automatically
    refetchOnWindowFocus: false,  // don't refetch when user switches tabs
    refetchOnReconnect: false,    // don't refetch on network reconnect
    refetchOnMount: false,        // don't refetch if data is already cached
    retry: 1,                     // only retry once on failure
  });

  return {
    profile: query.data ?? null,
    authLoading: uid === undefined,
    dataLoading: query.isPending && !!uid,
    error: query.error,
    uid,
  };
}
