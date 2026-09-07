"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlineTrash } from "react-icons/hi";

interface DeleteProductButtonProps {
  productId: string;
  productName: string;
}

export default function DeleteProductButton({
  productId,
  productName,
}: DeleteProductButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete product");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50 sm:p-2"
      title="Delete"
      aria-label={`Delete ${productName}`}
    >
      <HiOutlineTrash className="w-4 h-4" />
    </button>
  );
}
