"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeDisabled?: boolean;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  closeDisabled = false,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const firstInput = dialog?.querySelector<HTMLInputElement>('input:not([disabled]):not([hidden]):not([type="hidden"])');
    (firstInput || dialog)?.focus();
    return () => previousFocus?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closeDisabled) onClose();
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      const focusable = dialog?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]):not([hidden]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]'
      );
      if (!focusable?.length) {
        event.preventDefault();
        dialog?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialog?.contains(document.activeElement) || document.activeElement === dialog) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose, closeDisabled]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => { if (!closeDisabled) onClose(); }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-gray-200 dark:border-dark-200 bg-white dark:bg-dark-100 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-dark-200 px-6 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-white">
            {title || "Dialog"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={closeDisabled}>
            Close
          </Button>
        </div>
        <div className="px-6 py-5">{children}</div>
        <div className="border-t border-gray-200 dark:border-dark-200 px-6 py-4 flex items-center justify-end gap-2">
          {footer || (
            <Button variant="outline" onClick={onClose} disabled={closeDisabled}>
              Done
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
