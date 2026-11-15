"use client";

import { usePathname } from "next/navigation";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const MARKETING_ROUTES = new Set(["/landing-v2"]);

function isMarketingRoute(pathname: string | null) {
  return pathname !== null && MARKETING_ROUTES.has(pathname);
}

export function SiteHeaderGate() {
  const pathname = usePathname();
  if (isMarketingRoute(pathname)) return null;
  return <SiteHeader />;
}

export function SiteFooterGate() {
  const pathname = usePathname();
  if (isMarketingRoute(pathname)) return null;
  return <SiteFooter />;
}
