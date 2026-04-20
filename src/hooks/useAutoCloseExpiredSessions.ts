"use client";

import { useEffect, useRef } from "react";
import { adminService } from "@/services/admin.service";

const CHECK_INTERVAL_MS = 60_000;

export function useAutoCloseExpiredSessions() {
  const runningRef = useRef(false);

  useEffect(() => {
    async function check() {
      if (runningRef.current) return;
      runningRef.current = true;
      try {
        const closed = await adminService.autoCloseExpiredSessions();
        if (closed > 0) console.log(`[AutoClose] Closed ${closed} expired session(s)`);
      } catch (err) {
        console.error("[AutoClose] Error:", err);
      } finally {
        runningRef.current = false;
      }
    }

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
}
