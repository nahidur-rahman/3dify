"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlineTrash } from "react-icons/hi";
import Button from "@/components/ui/Button";

interface DeleteAdminButtonProps {
  adminId: string;
  adminUsername: string;
}

export default function DeleteAdminButton({
  adminId,
  adminUsername,
}: DeleteAdminButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete admin "${adminUsername}"?`)) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/admins/${adminId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        router.push("/admin/login");
        router.refresh();
        return;
      }

      if (!res.ok) {
        alert(data?.error || "Failed to delete admin");
        return;
      }

      router.refresh();
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      title={`Delete ${adminUsername}`}
      className="px-3"
    >
      <HiOutlineTrash className="h-4 w-4" />
      {/* <span>{loading ? "Deleting..." : "Delete"}</span> */}
    </Button>
  );
}