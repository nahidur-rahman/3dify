"use client";

import { FaWhatsapp, FaFacebookMessenger } from "react-icons/fa";
import {
  getWhatsAppLink,
  getMessengerLink,
  hasWhatsAppConfigured,
  hasMessengerConfigured,
} from "@/lib/utils";

interface ContactButtonsProps {
  productName?: string;
  price?: number;
  size?: "sm" | "lg";
}

export default function ContactButtons({
  productName,
  price,
  size = "lg",
}: ContactButtonsProps) {
  const whatsappLink = getWhatsAppLink(productName, price);
  const messengerLink = getMessengerLink();
  const whatsappReady = hasWhatsAppConfigured();
  const messengerReady = hasMessengerConfigured();

  const baseClasses =
    size === "lg"
      ? "flex-1 flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      : "flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium text-white text-sm transition-all duration-200 hover:shadow-md";

  return (
    <div>
      <div className={`flex gap-3 ${size === "lg" ? "flex-col sm:flex-row" : ""}`}>
        {whatsappReady ? (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`${baseClasses} bg-green-500 hover:bg-green-600 hover:shadow-green-500/25`}
          >
            <FaWhatsapp className={size === "lg" ? "w-6 h-6" : "w-4 h-4"} />
            Order via WhatsApp
          </a>
        ) : (
          <button
            type="button"
            disabled
            className={`${baseClasses} bg-gray-300 dark:bg-dark-300 text-gray-600 dark:text-gray-400 cursor-not-allowed`}
          >
            <FaWhatsapp className={size === "lg" ? "w-6 h-6" : "w-4 h-4"} />
            WhatsApp Unavailable
          </button>
        )}

        {messengerReady ? (
          <a
            href={messengerLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`${baseClasses} bg-blue-500 hover:bg-blue-600 hover:shadow-blue-500/25`}
          >
            <FaFacebookMessenger className={size === "lg" ? "w-6 h-6" : "w-4 h-4"} />
            Message on Messenger
          </a>
        ) : (
          <button
            type="button"
            disabled
            className={`${baseClasses} bg-gray-300 dark:bg-dark-300 text-gray-600 dark:text-gray-400 cursor-not-allowed`}
          >
            <FaFacebookMessenger className={size === "lg" ? "w-6 h-6" : "w-4 h-4"} />
            Messenger Unavailable
          </button>
        )}
      </div>

      {(!whatsappReady || !messengerReady) && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          One or more contact channels are being configured.
        </p>
      )}
    </div>
  );
}
