"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChange, getUserProfile } from "../services/authService";

export function useAdminGuard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (!user) {
        router.replace("/login");
        setAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.role !== "admin") {
          router.replace("/");
          setAuthorized(false);
          setLoading(false);
          return;
        }
        setAuthorized(true);
      } catch {
        router.replace("/login");
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return { loading, authorized };
}
