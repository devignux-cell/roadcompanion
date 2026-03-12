"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CategoryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/games/play");
  }, [router]);

  return null;
}
