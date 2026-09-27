import { permanentRedirect } from "next/navigation";

export default function LegacyCustomPersonalizedPage() {
  permanentRedirect("/products/keychains");
}
