"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsLoggedIn } from "@dynamic-labs/sdk-react-core";

export default function ProtectedRoute({
  children
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const isLoggedIn = useIsLoggedIn();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/');
    }
  }, [isLoggedIn, router]);

  return <>{children}</>;
}
