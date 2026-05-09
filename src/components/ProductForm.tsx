"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Category, Product, ProductSizeOption, SizeMode } from "@/lib/types";
import { categoryLabels } from "@/lib/utils";

interface ProductFormProps {
  product?: Product;
  mode: "create" | "edit";
}

interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
}

export default function ProductForm({ product, mode }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [uploadFolderKey, setUploadFolderKey] = useState(
    product?.id || `draft-${crypto.randomUUID()}`
  );

  const initialSizeOptions: ProductSizeOption[] =
    product?.sizeOptions && product.sizeOptions.length > 0
      ? product.sizeOptions
      : [{ label: "Standard", price: product?.price || 0 }];

  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    images: product?.images || [] as string[],
    category: product?.category || "FIGURINE",
    color: product?.color || "",
    size: product?.size || "",
    sizeMode: (product?.sizeMode || "FIXED") as SizeMode,
    sizeOptions: initialSizeOptions,
    weight: product?.weight || 0,
    infillPercentage: product?.infillPercentage || 20,
    discountPercent: product?.discountPercent || 0,
    customizable: product?.customizable || false,
    inStock: product?.inStock ?? true,
    featured: product?.featured || false,
  });

  useEffect(() => {
    return () => {
      pendingImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [pendingImages]);

  const updateSizeOption = (
    index: number,
    field: keyof ProductSizeOption,
    value: string | number
  ) => {
    setForm((prev) => ({
      ...prev,
      sizeOptions: prev.sizeOptions.map((option, optionIndex) =>
        optionIndex === index
          ? {
              ...option,
              [field]: field === "price" ? Number(value) || 0 : value,
            }
          : option
      ),
    }));
  };

  const addSizeOption = () => {
    setForm((prev) => ({
      ...prev,
      sizeMode: "OPTIONS",
      sizeOptions: [...prev.sizeOptions, { label: "New size", price: prev.price }],
      size: prev.size || "Multiple sizes available",
    }));
  };

  const removeSizeOption = (index: number) => {
    setForm((prev) => ({
      ...prev,
      sizeOptions: prev.sizeOptions.filter((_, optionIndex) => optionIndex !== index),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const nextFiles = Array.from(files);
    e.target.value = "";

    if (mode === "edit") {
      const stagedImages = nextFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      setPendingImages((prev) => [...prev, ...stagedImages]);
      return;
    }

    setImageUploading(true);
    const formData = new FormData();
    nextFiles.forEach((file) => formData.append("files", file));
    formData.append("folderKey", uploadFolderKey);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        if (typeof data.folderKey === "string" && data.folderKey.length > 0) {
          setUploadFolderKey(data.folderKey);
        }
        setForm((prev) => ({ ...prev, images: [...prev.images, ...data.urls] }));
      } else {
        console.error("Image upload failed:", data);
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Image upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removePendingImage = (pendingImageId: string) => {
    setPendingImages((prev) => {
      const nextPendingImages = prev.filter((image) => image.id !== pendingImageId);
      const removedImage = prev.find((image) => image.id === pendingImageId);
      if (removedImage) {
        URL.revokeObjectURL(removedImage.previewUrl);
      }
      return nextPendingImages;
    });
  };

  const uploadPendingImages = async () => {
    if (pendingImages.length === 0) return [];

    setImageUploading(true);
    const formData = new FormData();
    pendingImages.forEach((image) => formData.append("files", image.file));
    formData.append("folderKey", uploadFolderKey);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      if (typeof data.folderKey === "string" && data.folderKey.length > 0) {
        setUploadFolderKey(data.folderKey);
      }

      return Array.isArray(data.urls) ? (data.urls as string[]) : [];
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url =
        mode === "create" ? "/api/products" : `/api/products/${product?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const images = [...form.images];
      if (mode === "edit" && pendingImages.length > 0) {
        const uploadedImages = await uploadPendingImages();
        images.push(...uploadedImages);
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          images,
          price: Number(form.price),
          weight: Number(form.weight),
          infillPercentage: Number(form.infillPercentage),
          discountPercent: Number(form.discountPercent),
          sizeOptions:
            form.sizeMode === "OPTIONS"
              ? form.sizeOptions.map((option) => ({
                  label: option.label,
                  price: Number(option.price),
                }))
              : [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      pendingImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      setPendingImages([]);

      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"
    >
      {error && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400 xl:col-span-2">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <section className="rounded-2xl border border-gray-200/80 bg-white/90 p-3 shadow-sm dark:border-dark-200 dark:bg-dark-100/90 sm:p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-500 dark:text-primary-300">
                Core Details
              </p>
              <h2 className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                Product information
              </h2>
            </div>
            <span className="rounded-full border border-gray-200/80 bg-gray-50 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-gray-400 dark:border-dark-200 dark:bg-dark-200 dark:text-gray-500">
              Required
            </span>
          </div>

          <div className="grid gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Product Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:border-dark-200 dark:bg-dark dark:text-white"
                placeholder="e.g., Dragon Figurine"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Description *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                rows={2}
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:border-dark-200 dark:bg-dark dark:text-white"
                placeholder="Describe your product..."
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200/80 bg-white/90 p-3 shadow-sm dark:border-dark-200 dark:bg-dark-100/90 sm:p-4">
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-500 dark:text-primary-300">
              Size Details
            </p>
            <h2 className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              Dimensions and options
            </h2>
          </div>

          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Size Mode
                </label>
                <select
                  value={form.sizeMode}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sizeMode: e.target.value as SizeMode,
                      sizeOptions:
                        e.target.value === "OPTIONS"
                          ? prev.sizeOptions.length > 0
                            ? prev.sizeOptions
                            : [{ label: "Standard", price: prev.price }]
                          : prev.sizeOptions,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:border-dark-200 dark:bg-dark dark:text-white"
                >
                  <option value="FIXED">Fixed size</option>
                  <option value="OPTIONS">Size options</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Size Summary *
                </label>
                <input
                  type="text"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:border-dark-200 dark:bg-dark dark:text-white"
                  placeholder={
                    form.sizeMode === "OPTIONS"
                      ? "e.g., Small / Medium / Large"
                      : "e.g., 15x10x8 cm"
                  }
                />
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  {form.sizeMode === "OPTIONS"
                    ? "Shown beside the size choices."
                    : "Use the final finished size for fixed-size products."}
                </p>
              </div>
            </div>

            {form.sizeMode === "OPTIONS" && (
              <div className="space-y-2.5 rounded-xl border border-dashed border-gray-200/80 bg-gray-50/60 p-3">
                <div className="flex items-center justify-between gap-4">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Size Options
                  </label>
                  <button
                    type="button"
                    onClick={addSizeOption}
                    className="text-xs font-medium text-primary-500 hover:text-primary-400"
                  >
                    + Add option
                  </button>
                </div>

                <div className="space-y-2.5">
                  {form.sizeOptions.map((option, index) => (
                    <div
                      key={`${option.label}-${index}`}
                      className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_96px_auto] md:items-end"
                    >
                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-gray-500 dark:text-gray-400">
                          Label
                        </label>
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) => updateSizeOption(index, "label", e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:border-dark-200 dark:bg-dark dark:text-white"
                          placeholder="Small"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-gray-500 dark:text-gray-400">
                          Price
                        </label>
                        <input
                          type="number"
                          value={option.price}
                          onChange={(e) => updateSizeOption(index, "price", e.target.value)}
                          min="0"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:border-dark-200 dark:bg-dark dark:text-white"
                          placeholder="0"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSizeOption(index)}
                        disabled={form.sizeOptions.length === 1}
                        className="h-10 rounded-xl border border-gray-200 px-3 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-200 dark:text-gray-400 dark:hover:bg-dark-200"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="space-y-4">
        <section className="rounded-2xl border border-gray-200/80 bg-white/90 p-3 shadow-sm dark:border-dark-200 dark:bg-dark-100/90 sm:p-4">
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-500 dark:text-primary-300">
              Catalog Setup
            </p>
            <h2 className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              Pricing and product specs
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Price (BDT) *
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                required
                min="0"
                step="0.01"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:border-dark-200 dark:bg-dark dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as Category })
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:border-dark-200 dark:bg-dark dark:text-white"
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Discount Percentage
              </label>
              <input
                type="number"
                value={form.discountPercent}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discountPercent: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
                max="100"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:border-dark-200 dark:bg-dark dark:text-white"
                placeholder="0"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Color *
              </label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:border-dark-200 dark:bg-dark dark:text-white"
                placeholder="e.g., Matte Black"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Weight (grams) *
              </label>
              <input
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: parseFloat(e.target.value) || 0 })}
                required
                min="0"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:border-dark-200 dark:bg-dark dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Infill Percentage *
              </label>
              <input
                type="number"
                value={form.infillPercentage}
                onChange={(e) =>
                  setForm({ ...form, infillPercentage: parseInt(e.target.value) || 0 })
                }
                required
                min="0"
                max="100"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:border-dark-200 dark:bg-dark dark:text-white"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200/80 bg-white/90 p-3 shadow-sm dark:border-dark-200 dark:bg-dark-100/90 sm:p-4">
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-500 dark:text-primary-300">
              Media
            </p>
            <h2 className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              Product images
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-3">
            {form.images.map((url, i) => (
              <div
                key={`existing-${i}`}
                className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-dark-200"
              >
                <Image src={url} alt="" fill sizes="80px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            ))}
            {pendingImages.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-dark-200"
              >
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${image.previewUrl})` }}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => removePendingImage(image.id)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            disabled={imageUploading || loading}
            className="mt-3 block w-full text-xs text-gray-500 file:mr-3 file:rounded-full file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-600 hover:file:bg-primary-100 dark:file:bg-primary-500/10 dark:file:text-primary-400"
          />
          {imageUploading && (
            <p className="mt-1 text-xs text-primary-500">
              {mode === "edit" ? "Uploading images..." : "Uploading..."}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200/80 bg-white/90 p-3 shadow-sm dark:border-dark-200 dark:bg-dark-100/90 sm:p-4">
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-500 dark:text-primary-300">
              Visibility
            </p>
            <h2 className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              Storefront flags
            </h2>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200/80 bg-gray-50/70 px-3 py-2 dark:border-dark-200 dark:bg-dark-200/40">
              <input
                type="checkbox"
                checked={form.customizable}
                onChange={(e) => setForm({ ...form, customizable: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">
                Customizable
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200/80 bg-gray-50/70 px-3 py-2 dark:border-dark-200 dark:bg-dark-200/40">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">
                In Stock
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200/80 bg-gray-50/70 px-3 py-2 dark:border-dark-200 dark:bg-dark-200/40 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">
                Featured (show on homepage)
              </span>
            </label>
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end xl:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2 font-semibold text-sm text-white transition-all hover:from-primary-600 hover:to-primary-700 disabled:opacity-50"
        >
          {loading
            ? mode === "create"
              ? "Creating..."
              : "Updating..."
            : mode === "create"
            ? "Create Product"
            : "Update Product"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-dark-200 dark:text-gray-400 dark:hover:bg-dark-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
