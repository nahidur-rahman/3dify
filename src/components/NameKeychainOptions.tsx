"use client";

import Image from "next/image";
import { productImageVariant } from "@/lib/imageVariants";
import { CUSTOMIZATION_NOTES_MAX_LENGTH, PRINTED_NAME_MAX_LENGTH } from "@/lib/nameKeychain";
import { getWhatsAppLink, getMessengerLink, hasWhatsAppConfigured, hasMessengerConfigured } from "@/lib/utils";
import type { NameKeychainCustomization, Product } from "@/lib/types";

export default function NameKeychainOptions({ product, value, onChange, showValidation = false }: {
  product: Product;
  value: NameKeychainCustomization;
  onChange: (value: NameKeychainCustomization) => void;
  showValidation?: boolean;
}) {
  const nameInvalid = showValidation && !value.printedName.trim();
  const designInvalid = showValidation && !!product.textDesigns?.length &&
    !product.textDesigns.some((design) => design.id === value.designId);
  const idPrefix = `keychain-${product.id}`;
  const labelClass = "block text-xs font-medium text-gray-700 dark:text-gray-300";
  const errorClass = "mt-1 block text-[11px] font-normal text-red-600 dark:text-red-400";
  const inputClass = (invalid = false) =>
    `mt-1 w-full rounded-lg border bg-white px-2.5 py-1.5 text-[13px] leading-5 text-gray-900 focus:outline-none focus:ring-2 dark:bg-dark-100 dark:text-white ${invalid
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-400"
      : "border-gray-200 focus:border-primary-500 focus:ring-primary-500/30 dark:border-dark-200"}`;

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 p-3 dark:border-dark-200">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Make it yours</h3>

      <label className={labelClass}>
        Name to print <span aria-hidden="true">*</span>
        <input
          required
          pattern=".*\S.*"
          maxLength={PRINTED_NAME_MAX_LENGTH}
          value={value.printedName}
          onChange={(event) => onChange({ ...value, printedName: event.target.value })}
          placeholder="Enter the name exactly as it should appear"
          aria-invalid={nameInvalid || undefined}
          aria-describedby={`${idPrefix}-name-help`}
          className={inputClass(nameInvalid)}
        />
        <span id={`${idPrefix}-name-help`} className={nameInvalid ? errorClass : "mt-1 block text-[11px] font-normal text-gray-500 dark:text-gray-400"}>
          {nameInvalid ? "Enter a name to print." : `Check spelling and capitalization · ${PRINTED_NAME_MAX_LENGTH} characters max.`}
        </span>
      </label>

      <div className="grid grid-cols-2 gap-2">
        {(["base", "text"] as const).map((part) => {
          const field = `${part}Color` as const;
          const options = product[`${part}ColorOptions`] || [];
          const label = `${part === "base" ? "Base" : "Text"} color`;
          const invalid = showValidation && product.colorMode === "OPTIONS" && !options.includes(value[field]);
          return (
            <label key={part} className={labelClass}>
              {label}{product.colorMode === "OPTIONS" && <span aria-hidden="true"> *</span>}
              {product.colorMode === "OPTIONS" ? (
                <>
                  <select
                    required
                    aria-label={label}
                    value={value[field]}
                    onChange={(event) => onChange({ ...value, [field]: event.target.value })}
                    aria-invalid={invalid || undefined}
                    aria-describedby={invalid ? `${idPrefix}-${part}-error` : undefined}
                    className={inputClass(invalid)}
                  >
                    <option value="">Choose {part} color</option>
                    {options.map((color) => <option key={color} value={color}>{color}</option>)}
                  </select>
                  {invalid && <span id={`${idPrefix}-${part}-error`} className={errorClass}>Choose a {part} color.</span>}
                </>
              ) : <span className="mt-1 block break-words text-xs font-normal">{product[field] || "As shown"}</span>}
            </label>
          );
        })}
      </div>

      {!!product.textDesigns?.length && (
        <fieldset aria-invalid={designInvalid || undefined} aria-describedby={designInvalid ? `${idPrefix}-design-error` : undefined}>
          <legend className={labelClass}>Font / text design <span aria-hidden="true">*</span></legend>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
            {product.textDesigns.map((design) => (
              <label
                key={design.id}
                title={design.label}
                className={`relative min-w-0 cursor-pointer rounded-lg border p-1.5 transition-colors focus-within:ring-2 focus-within:ring-primary-500 ${designInvalid
                  ? "border-red-500 bg-red-50/40 dark:border-red-400 dark:bg-red-500/5"
                  : value.designId === design.id
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-200 dark:border-dark-200"}`}
              >
                <input
                  required
                  type="radio"
                  name="text-design"
                  value={design.id}
                  checked={value.designId === design.id}
                  onChange={() => onChange({ ...value, designId: design.id, designLabel: design.label })}
                  aria-label={design.label}
                  aria-describedby={designInvalid ? `${idPrefix}-design-error` : undefined}
                  className="absolute left-1.5 top-1.5 z-10 h-3 w-3 accent-primary-500"
                />
                <span className="relative mb-1 block h-10 overflow-hidden rounded bg-white">
                  <Image src={productImageVariant(design.image, "card")} alt={design.label} fill sizes="(max-width: 640px) 100px, 120px" className="object-contain px-1" />
                </span>
                <span className="block truncate text-center text-[11px] font-medium text-gray-700 dark:text-gray-200">{design.label}</span>
              </label>
            ))}
          </div>
          {designInvalid && <p id={`${idPrefix}-design-error`} className={errorClass}>Choose a font / text design.</p>}
        </fieldset>
      )}

      <label className={labelClass}>
        <span className="flex items-center justify-between gap-2">
          <span>Design instructions <span className="font-normal text-gray-400">(optional)</span></span>
          <span className="text-[10px] font-normal text-gray-400">{value.notes?.length || 0}/{CUSTOMIZATION_NOTES_MAX_LENGTH}</span>
        </span>
        <textarea
          rows={2}
          maxLength={CUSTOMIZATION_NOTES_MAX_LENGTH}
          value={value.notes || ""}
          onChange={(event) => onChange({ ...value, notes: event.target.value })}
          placeholder="Any special design instructions?"
          className={`${inputClass()} resize-y`}
        />
      </label>

      <div className="border-t border-gray-100 text-[11px] leading-5 text-gray-500 dark:border-dark-200 dark:text-gray-400">
        Need more customization? Or anything you have in mind? Contact us before ordering via WhatsApp or Messenger.
        {hasWhatsAppConfigured() && <a href={getWhatsAppLink(product.name)} target="_blank" rel="noopener noreferrer" className="ml-2 font-semibold text-green-600 underline dark:text-green-400">WhatsApp</a>}
        {hasMessengerConfigured() && <a href={getMessengerLink()} target="_blank" rel="noopener noreferrer" className="ml-2 font-semibold text-blue-600 underline dark:text-blue-400">Messenger</a>}
      </div>
    </div>
  );
}
