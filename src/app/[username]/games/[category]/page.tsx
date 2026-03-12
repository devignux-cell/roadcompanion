"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function CategoryRedirect() {
  const router = useRouter();
  const { username } = useParams<{ username: string }>();

  useEffect(() => {
    router.replace(`/${username}/games/play`);
  }, [router, username]);

  return null;
}
