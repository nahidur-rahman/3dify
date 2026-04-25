"use client";

import { ReactNode, useEffect } from "react";
import Button from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-dark-200 bg-white dark:bg-dark-100 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-dark-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title || "Dialog"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="px-6 py-5">{children}</div>
        <div className="border-t border-gray-200 dark:border-dark-200 px-6 py-4 flex items-center justify-end gap-2">
          {footer || (
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}