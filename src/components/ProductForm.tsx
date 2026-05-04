"use client";

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
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Product Name *
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-200 bg-white dark:bg-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          placeholder="e.g., Dragon Figurine"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Description *
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-200 bg-white dark:bg-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 resize-none"
          placeholder="Describe your product..."
        />
      </div>

      {/* Price & Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Price (BDT) *
          </label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
            required
            min="0"
            step="0.01"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-200 bg-white dark:bg-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Category *
          </label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value as Category })
            }
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-200 bg-white dark:bg-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          >
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-200 bg-white dark:bg-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          >
            <option value="FIXED">Fixed size</option>
            <option value="OPTIONS">Size options</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-200 bg-white dark:bg-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Size Summary *
        </label>
        <input
          type="text"
          value={form.size}
          onChange={(e) => setForm({ ...form, size: e.target.value })}
          required
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-200 bg-white dark:bg-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          placeholder={
            form.sizeMode === "OPTIONS"
              ? "e.g., Small / Medium / Large"
              : "e.g., 15x10x8 cm"
          }
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {form.sizeMode === "OPTIONS"
            ? "This summary appears next to the size choices."
            : "Use the final finished size for fixed-size products."}
        </p>
      </div>

      {form.sizeMode === "OPTIONS" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Size Options
            </label>
            <button
              type="button"
              onClick={addSizeOption}
              className="text-sm font-medium text-primary-500 hover:text-primary-400"
            >
              + Add option
            </button>
          </div>

          {form.sizeOptions.map((option, index) => (
            <div
              key={`${option.label}-${index}`}
              className="grid grid-cols-[1fr_140px_auto] gap-3 items-end"
            >
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={option.label}
                  onChange={(e) => updateSizeOption(index, "label", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-200 bg-white dark:bg-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                  placeholder="Small"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  value={option.price}
                  onChange={(e) => updateSizeOption(index, "price", e.target.value)}
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-200 bg-white dark:bg-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                  placeholder="0"
                />
              </div>
              <button
                type="button"
                onClick={() => removeSizeOption(index)}
                disabled={form.sizeOptions.length === 1}
                className="h-12 px-4 rounded-xl border border-gray-200 dark:border-dark-200 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Color *
        </label>
        <input
          type="text"
          value={form.color}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
          required
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-200 bg-white dark:bg-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          placeholder="e.g., Matte Black"
        />
      </div>

      {/* Weight & Infill */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Weight (grams) *
          </label>
          <input
            type="number"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: parseFloat(e.target.value) || 0 })}
            required
            min="0"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-200 bg-white dark:bg-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-200 bg-white dark:bg-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Product Images
        </label>
        <div className="flex flex-wrap gap-3 mb-3">
          {form.images.map((url, i) => (
            <div
              key={`existing-${i}`}
              className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-dark-200 group"
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs"
              >
                Remove
              </button>
            </div>
          ))}
          {pendingImages.map((image) => (
            <div
              key={image.id}
              className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-dark-200 group"
            >
              <img src={image.previewUrl} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePendingImage(image.id)}
                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs"
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
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 dark:file:bg-primary-500/10 file:text-primary-600 dark:file:text-primary-400 hover:file:bg-primary-100"
        />
        {imageUploading && (
          <p className="text-sm text-primary-500 mt-1">
            {mode === "edit" ? "Uploading images..." : "Uploading..."}
          </p>
        )}
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.customizable}
            onChange={(e) => setForm({ ...form, customizable: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Customizable
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.inStock}
            onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            In Stock
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Featured (show on homepage)
          </span>
        </label>
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50"
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
          className="px-8 py-3 rounded-xl font-semibold border border-gray-200 dark:border-dark-200 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
