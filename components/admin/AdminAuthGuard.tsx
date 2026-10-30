"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifyAdminAuth() {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) {
          throw new Error("Unauthorized");
        }
        const data = await res.json();
        if (
          !data?.user ||
          data.user.status === "inactive" ||
          data.user.role?.slug === "student" ||
          !data.user.role
        ) {
          throw new Error("Unauthorized role");
        }

        if (isMounted) {
          setAuthorized(true);
          setChecking(false);
        }
      } catch {
        if (isMounted) {
          router.replace("/?error=unauthorized");
        }
      }
    }

    void verifyAdminAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (checking || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Verifying staff credentials…
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
