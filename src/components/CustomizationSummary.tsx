import { customizationDetails } from "@/lib/nameKeychain";

export default function CustomizationSummary({ customization }: { customization?: unknown }) {
  const details = customizationDetails(customization);
  if (!details.length) return null;
  return (
    <div className="mt-1 space-y-0.5 text-xs text-gray-600 dark:text-gray-400">
      {details.map((detail, index) => <p key={index} className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{detail}</p>)}
    </div>
  );
}
