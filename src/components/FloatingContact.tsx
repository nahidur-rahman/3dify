"use client";

import { useState } from "react";
import { FaWhatsapp, FaFacebookMessenger } from "react-icons/fa";
import { HiChat, HiX } from "react-icons/hi";
import { hasMessengerConfigured, hasWhatsAppConfigured } from "@/lib/utils";

export default function FloatingContact() {
  const [isOpen, setIsOpen] = useState(false);
  const whatsappReady = hasWhatsAppConfigured();
  const messengerReady = hasMessengerConfigured();

  const whatsappLink = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || ""}?text=${encodeURIComponent("Hi! I'm interested in your 3D printed products.")}`;
  const messengerLink = `https://m.me/${process.env.NEXT_PUBLIC_MESSENGER || ""}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded buttons */}
      {isOpen && (
        <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-2">
          {whatsappReady ? (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-500 text-white pl-4 pr-5 py-3 rounded-full shadow-lg hover:bg-green-600 hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <FaWhatsapp className="w-5 h-5" />
              <span className="font-medium text-sm">WhatsApp</span>
            </a>
          ) : (
            <div className="flex items-center gap-3 bg-gray-300 dark:bg-dark-300 text-gray-700 dark:text-gray-400 pl-4 pr-5 py-3 rounded-full shadow-lg cursor-not-allowed">
              <FaWhatsapp className="w-5 h-5" />
              <span className="font-medium text-sm">WhatsApp Unavailable</span>
            </div>
          )}

          {messengerReady ? (
            <a
              href={messengerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-blue-500 text-white pl-4 pr-5 py-3 rounded-full shadow-lg hover:bg-blue-600 hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <FaFacebookMessenger className="w-5 h-5" />
              <span className="font-medium text-sm">Messenger</span>
            </a>
          ) : (
            <div className="flex items-center gap-3 bg-gray-300 dark:bg-dark-300 text-gray-700 dark:text-gray-400 pl-4 pr-5 py-3 rounded-full shadow-lg cursor-not-allowed">
              <FaFacebookMessenger className="w-5 h-5" />
              <span className="font-medium text-sm">Messenger Unavailable</span>
            </div>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 ${
          isOpen
            ? "bg-gray-600 hover:bg-gray-700 rotate-0"
            : "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 animate-bounce"
        }`}
        style={{ animationDuration: isOpen ? "0s" : "2s" }}
      >
        {isOpen ? (
          <HiX className="w-6 h-6 text-white" />
        ) : (
          <HiChat className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
}
