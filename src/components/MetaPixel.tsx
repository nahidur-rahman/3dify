"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import {
  META_PIXEL_ID,
  ensureMetaPixel,
  trackMetaEvent,
  trackMetaPageView,
} from "@/lib/metaPixel";

const CHAT_LINK_PATTERN =
  /^https:\/\/(wa\.me|api\.whatsapp\.com|m\.me|(www\.)?messenger\.com)\//i;

export default function MetaPixel() {
  const pathname = usePathname() || "";
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const lastTrackedPath = useRef<string | null>(null);

  // PageView on first load is queued by ensureMetaPixel(); later client-side
  // navigations are tracked here.
  useEffect(() => {
    if (!META_PIXEL_ID || isAdminRoute) return;

    if (lastTrackedPath.current === null) {
      lastTrackedPath.current = pathname;
      ensureMetaPixel();
      return;
    }

    if (lastTrackedPath.current !== pathname) {
      lastTrackedPath.current = pathname;
      trackMetaPageView();
    }
  }, [pathname, isAdminRoute]);

  // One delegated listener covers every WhatsApp / Messenger link on the site.
  useEffect(() => {
    if (!META_PIXEL_ID || isAdminRoute) return;

    function handleClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const link = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || !CHAT_LINK_PATTERN.test(link.href)) return;

      trackMetaEvent("Contact", {
        content_name: /whatsapp|wa\.me/i.test(link.href) ? "WhatsApp" : "Messenger",
      });
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isAdminRoute]);

  if (!META_PIXEL_ID || isAdminRoute) return null;

  // lazyOnload keeps the library off the critical path; queued events are
  // flushed as soon as it loads.
  return (
    <Script
      id="meta-pixel"
      src="https://connect.facebook.net/en_US/fbevents.js"
      strategy="lazyOnload"
    />
  );
}
