"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/actions/analytics";

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    trackPageView(pathname, document.referrer || undefined);
  }, [pathname]);

  return null;
}
