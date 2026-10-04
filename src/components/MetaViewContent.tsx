"use client";

import { useEffect } from "react";
import { META_CURRENCY, trackMetaEvent } from "@/lib/metaPixel";

interface MetaViewContentProps {
  productId: string;
  name: string;
  category: string;
  value: number;
}

export default function MetaViewContent({
  productId,
  name,
  category,
  value,
}: MetaViewContentProps) {
  useEffect(() => {
    trackMetaEvent("ViewContent", {
      content_ids: [productId],
      content_type: "product",
      content_name: name,
      content_category: category,
      value,
      currency: META_CURRENCY,
    });
  }, [productId, name, category, value]);

  return null;
}
