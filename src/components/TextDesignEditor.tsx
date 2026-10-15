"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { TEXT_DESIGN_LIMIT, TEXT_DESIGN_MAX_BYTES, TEXT_DESIGN_IMAGE_TYPES } from "@/lib/nameKeychain";
import type { TextDesign } from "@/lib/types";

export interface EditableTextDesign extends TextDesign { file?: File }

export default function TextDesignEditor({ designs, onChange, disabled }: {
  designs: EditableTextDesign[];
  onChange: (designs: EditableTextDesign[]) => void;
  disabled: boolean;
}) {
  const [error, setError] = useState("");
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function selectFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    setError("");
    if (files.length + designs.length > TEXT_DESIGN_LIMIT) {
      setError("Maximum 10 designs. Remove a design before adding more.");
      return;
    }
    if (files.some((file) => !TEXT_DESIGN_IMAGE_TYPES.includes(file.type) || file.size > TEXT_DESIGN_MAX_BYTES)) {
      setError("Choose PNG, JPEG, WebP or AVIF images up to 1 MB each.");
      return;
    }
    onChange([...designs, ...files.map((file, index) => {
      const image = URL.createObjectURL(file);
      previews.current.add(image);
      return { id: crypto.randomUUID(), label: file.name.replace(/\.[^.]+$/, "").slice(0, 80) || `Design ${designs.length + index + 1}`, image, file };
    })]);
  }

  return (
    <fieldset disabled={disabled} className="space-y-3">
      <legend className="text-sm font-semibold text-gray-900 dark:text-white">Text designs / fonts ({designs.length}/10)</legend>
      <p className="text-xs text-gray-500 dark:text-gray-400">Upload small sample images of each font or design. Recommended: 600 × 200 px, under 100 KB; maximum 1 MB each. Labels help customers identify their choice.</p>
      <input aria-label="Upload text design images" type="file" accept={TEXT_DESIGN_IMAGE_TYPES.join(",")} multiple onChange={selectFiles} disabled={disabled || designs.length >= TEXT_DESIGN_LIMIT} className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-primary-700 dark:text-gray-300" />
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {designs.map((design) => (
          <div key={design.id} className="space-y-2 rounded-xl border border-gray-200 p-2 dark:border-dark-200">
            <div className="relative h-20 overflow-hidden rounded-lg bg-gray-100 dark:bg-dark-200">
              <Image src={design.image} alt={design.label} fill sizes="240px" unoptimized={!!design.file} className="object-contain" />
            </div>
            <label className="block text-xs text-gray-600 dark:text-gray-300">
              Design label
              <input required maxLength={80} value={design.label} onChange={(event) => onChange(designs.map((entry) => entry.id === design.id ? { ...entry, label: event.target.value } : entry))} className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-2 py-1.5 dark:border-dark-200" />
            </label>
            <button type="button" onClick={() => {
              if (design.file) { URL.revokeObjectURL(design.image); previews.current.delete(design.image); }
              onChange(designs.filter((entry) => entry.id !== design.id));
            }} className="text-xs font-medium text-red-600">Remove design</button>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
