"use client";

import Image from "next/image";
import { CUSTOMIZATION_NOTES_MAX_LENGTH, PRINTED_NAME_MAX_LENGTH } from "@/lib/nameKeychain";
import { getWhatsAppLink, getMessengerLink, hasWhatsAppConfigured, hasMessengerConfigured } from "@/lib/utils";
import type { NameKeychainCustomization, Product } from "@/lib/types";

export default function NameKeychainOptions({ product, value, onChange }: {
  product: Product;
  value: NameKeychainCustomization;
  onChange: (value: NameKeychainCustomization) => void;
}) {
  const inputClass = "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-200 dark:bg-dark-100 dark:text-white";
  return (
    <div className="space-y-5 rounded-2xl border border-gray-200 p-4 dark:border-dark-200">
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white">Make it yours</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Choose your colors and design, then enter the name to print.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(["base", "text"] as const).map((part) => {
          const field = `${part}Color` as const;
          const options = product[`${part}ColorOptions`] || [];
          const label = `${part === "base" ? "Base" : "Text"} color`;
          return (
            <label key={part} className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
              {product.colorMode === "OPTIONS" ? (
                <select required aria-label={label} value={value[field]} onChange={(event) => onChange({ ...value, [field]: event.target.value })} className={inputClass}>
                  <option value="">Choose {part} color</option>
                  {options.map((color) => <option key={color} value={color}>{color}</option>)}
                </select>
              ) : <span className="mt-2 block text-sm font-normal">{product[field] || "As shown"}</span>}
            </label>
          );
        })}
      </div>
      {!!product.textDesigns?.length && (
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">Font / text design <span aria-hidden="true">*</span></legend>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Select a sample to choose its lettering style.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {product.textDesigns.map((design) => (
              <label key={design.id} className={`relative cursor-pointer rounded-xl border p-2 transition-colors focus-within:ring-2 focus-within:ring-primary-500 ${value.designId === design.id ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20" : "border-gray-200 dark:border-dark-200"}`}>
                <input required type="radio" name="text-design" value={design.id} checked={value.designId === design.id} onChange={() => onChange({ ...value, designId: design.id, designLabel: design.label })} className="absolute left-2 top-2 z-10 h-4 w-4 accent-primary-500" />
                <span className="relative mb-2 block h-14 overflow-hidden rounded-lg bg-white">
                  <Image src={design.image} alt={design.label} fill sizes="(max-width: 640px) 140px, 160px" className="object-contain px-2" />
                </span>
                <span className="block break-words text-center text-xs font-medium text-gray-700 dark:text-gray-200">{design.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Name to print <span aria-hidden="true">*</span>
        <input required pattern=".*\S.*" maxLength={PRINTED_NAME_MAX_LENGTH} value={value.printedName} onChange={(event) => onChange({ ...value, printedName: event.target.value })} placeholder="Enter your name exactly as it should appear" aria-describedby="print-name-help" className={inputClass} />
        <span id="print-name-help" className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-400">Check spelling and capitalization. Up to {PRINTED_NAME_MAX_LENGTH} characters.</span>
      </label>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Design instructions <span className="font-normal text-gray-400">(optional)</span>
        <textarea rows={3} maxLength={CUSTOMIZATION_NOTES_MAX_LENGTH} value={value.notes || ""} onChange={(event) => onChange({ ...value, notes: event.target.value })} placeholder="Tell us anything else about your design…" className={`${inputClass} resize-y`} />
        <span className="mt-1 block text-right text-xs font-normal text-gray-400">{value.notes?.length || 0}/{CUSTOMIZATION_NOTES_MAX_LENGTH}</span>
      </label>
      <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
        <p>Need more personalization or a custom design? Contact us via WhatsApp or Messenger before ordering.</p>
        <div className="flex flex-wrap gap-4 font-semibold">
          {hasWhatsAppConfigured() && <a href={getWhatsAppLink(product.name)} target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 underline">Chat on WhatsApp</a>}
          {hasMessengerConfigured() && <a href={getMessengerLink()} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">Chat on Messenger</a>}
        </div>
      </div>
    </div>
  );
}
