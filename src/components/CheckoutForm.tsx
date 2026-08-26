"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/contexts/CartContext";
import { createOrder, type CreateOrderInput } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import {
  HiOutlineShoppingCart,
  HiOutlineTruck,
  HiOutlineCash,
  HiOutlinePhone,
  HiOutlineUser,
  HiOutlineLocationMarker,
  HiOutlineMail,
} from "react-icons/hi";

// --- Client-side validation constants (mirrors server-side) ---

const ALLOWED_EMAIL_DOMAINS = [
  "gmail.com", "yahoo.com", "yahoo.co.uk", "outlook.com", "hotmail.com",
  "live.com", "icloud.com", "me.com", "mac.com", "protonmail.com",
  "proton.me", "aol.com", "zoho.com", "yandex.com", "mail.com",
  "gmx.com", "fastmail.com",
];

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (!cleaned) return "Phone number is required";
  if (!BD_PHONE_REGEX.test(cleaned)) return "Enter a valid Bangladeshi phone number (e.g. 01712345678)";
  return null;
}

function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required";
  if (!EMAIL_REGEX.test(email)) return "Enter a valid email address";
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain || !ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    return "Please use a popular email provider (Gmail, Yahoo, Outlook, etc.)";
  }
  return null;
}

interface ShippingOption {
  method: "INSIDE_DHAKA" | "OUTSIDE_DHAKA";
  label: string;
  price: number;
}

export default function CheckoutForm() {
  const router = useRouter();
  const { items, cartTotal, clearCart } = useCart();

  const [shippingRates, setShippingRates] = useState<ShippingOption[]>([
    { method: "INSIDE_DHAKA", label: "Inside Dhaka", price: 70 },
    { method: "OUTSIDE_DHAKA", label: "Outside Dhaka", price: 130 },
  ]);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    address: "",
    apartment: "",
    city: "Dhaka",
    postalCode: "",
    shippingMethod: "INSIDE_DHAKA" as "INSIDE_DHAKA" | "OUTSIDE_DHAKA",
    notes: "",
  });

  const [clearedForOutsideDhaka, setClearedForOutsideDhaka] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch shipping rates
  useEffect(() => {
    fetch("/api/shipping")
      .then((r) => r.json())
      .then((data: ShippingOption[]) => {
        if (data && data.length > 0) setShippingRates(data);
      })
      .catch(() => {
        // Use defaults
      });
  }, []);

  const shippingCost =
    shippingRates.find((r) => r.method === form.shippingMethod)?.price ?? 70;
  const total = cartTotal + shippingCost;

  function updateField(field: string, value: string) {
    if (field === "shippingMethod" && value === "OUTSIDE_DHAKA" && !clearedForOutsideDhaka) {
      setClearedForOutsideDhaka(true);
      setForm((prev) => ({ ...prev, [field]: value, city: "" }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handleBlur(field: "customerPhone" | "customerEmail") {
    const validator = field === "customerPhone" ? validatePhone : validateEmail;
    const errorMsg = validator(form[field]);
    if (errorMsg) {
      setErrors((prev) => ({ ...prev, [field]: [errorMsg] }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;

    // Client-side validation before submitting
    const clientErrors: Record<string, string[]> = {};
    const phoneErr = validatePhone(form.customerPhone);
    if (phoneErr) clientErrors.customerPhone = [phoneErr];
    const emailErr = validateEmail(form.customerEmail);
    if (emailErr) clientErrors.customerEmail = [emailErr];
    if (!form.customerName.trim()) clientErrors.customerName = ["Name is required"];
    if (!form.address.trim()) clientErrors.address = ["Address is required"];
    if (!form.city.trim()) {
      clientErrors.city = ["City is required"];
    } else if (
      form.shippingMethod === "INSIDE_DHAKA" &&
      form.city.trim().toLowerCase() !== "dhaka"
    ) {
      clientErrors.city = ["City must be 'Dhaka' for Inside Dhaka delivery"];
    }

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setGlobalError("Please fix the errors below.");
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setGlobalError("");

    const orderInput: CreateOrderInput = {
      ...form,
      apartment: form.apartment || undefined,
      postalCode: form.postalCode || undefined,
      notes: form.notes || undefined,
      items: items.map((item: CartItem) => ({
        productId: item.productId,
        productName: item.name,
        productImage: item.image || undefined,
        selectedSize: item.selectedSize,
        color: item.color,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
    };

    try {
      const result = await createOrder(orderInput);

      if (result.success && result.orderNumber) {
        clearCart();
        router.push(`/checkout/confirmation?order=${result.orderNumber}`);
      } else {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        setGlobalError(result.error || "Something went wrong.");
      }
    } catch {
      setGlobalError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClasses =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-dark-200 dark:bg-dark-100 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-primary-400";
  const errorInputClasses =
    "border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/50";

  function FieldError({ field }: { field: string }) {
    if (!errors[field]) return null;
    return (
      <p className="mt-1 text-xs text-red-500">
        {errors[field].join(", ")}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-5">
      {/* Left column — Form */}
      <div className="lg:col-span-3 space-y-6">
        {globalError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-400">
            {globalError}
          </div>
        )}

        {/* Contact */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <HiOutlinePhone className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Contact
            </h2>
          </div>
          <input
            type="tel"
            placeholder="Phone number * (e.g. 01712345678)"
            value={form.customerPhone}
            onChange={(e) => updateField("customerPhone", e.target.value)}
            onBlur={() => handleBlur("customerPhone")}
            className={`${inputClasses} ${errors.customerPhone ? errorInputClasses : ""}`}
          />
          <FieldError field="customerPhone" />
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            Bangladeshi mobile number (01X-XXXXXXXX)
          </p>
          <div className="mt-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <HiOutlineMail className="h-4 w-4 text-primary-500" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Order confirmation will be sent to this email
              </span>
            </div>
            <input
              type="email"
              placeholder="Email address *"
              value={form.customerEmail}
              onChange={(e) => updateField("customerEmail", e.target.value)}
              onBlur={() => handleBlur("customerEmail")}
              className={`${inputClasses} ${errors.customerEmail ? errorInputClasses : ""}`}
            />
            <FieldError field="customerEmail" />
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              Gmail, Yahoo, Outlook, Hotmail, iCloud, etc.
            </p>
          </div>
        </section>

        {/* Shipping Method */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineTruck className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Shipping Method
            </h2>
          </div>
          <div className="space-y-2">
            {shippingRates.map((rate) => (
              <label
                key={rate.method}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${form.shippingMethod === rate.method
                    ? "border-primary-500 bg-primary-50/50 ring-1 ring-primary-500 dark:bg-primary-900/10 dark:border-primary-400"
                    : "border-gray-200 hover:border-gray-300 dark:border-dark-200 dark:hover:border-dark-300"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value={rate.method}
                    checked={form.shippingMethod === rate.method}
                    onChange={(e) => updateField("shippingMethod", e.target.value)}
                    className="h-4 w-4 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {rate.label}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatPrice(rate.price)}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Delivery */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineLocationMarker className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Delivery
            </h2>
          </div>
          <div className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Full name *"
                value={form.customerName}
                onChange={(e) => updateField("customerName", e.target.value)}
                className={`${inputClasses} ${errors.customerName ? errorInputClasses : ""}`}
              />
              <FieldError field="customerName" />
            </div>
            <div>
              <input
                type="text"
                placeholder="Address *"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                className={`${inputClasses} ${errors.address ? errorInputClasses : ""}`}
              />
              <FieldError field="address" />
            </div>
            <input
              type="text"
              placeholder="Apartment, suite, etc. (optional)"
              value={form.apartment}
              onChange={(e) => updateField("apartment", e.target.value)}
              className={inputClasses}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="City *"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className={`${inputClasses} ${errors.city ? errorInputClasses : ""}`}
                />
                <FieldError field="city" />
              </div>
              <input
                type="text"
                placeholder="Postal code (optional)"
                value={form.postalCode}
                onChange={(e) => updateField("postalCode", e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>
        </section>

        

        {/* Payment */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineCash className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Payment
            </h2>
          </div>
          <div className="rounded-xl border border-primary-500 bg-primary-50/50 p-4 dark:bg-primary-900/10 dark:border-primary-400">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                checked
                readOnly
                className="h-4 w-4 text-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Cash on Delivery (COD)
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Pay when your order is delivered
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineUser className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Order Notes
            </h2>
          </div>
          <textarea
            placeholder="Any special instructions? (optional)"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            rows={3}
            className={`${inputClasses} resize-none`}
          />
        </section>

        {/* Submit button (mobile) */}
        <button
          type="submit"
          disabled={isSubmitting || items.length === 0}
          className="w-full rounded-xl bg-primary-500 py-4 text-base font-bold text-white transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/25 disabled:cursor-not-allowed disabled:opacity-50 lg:hidden"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" className="opacity-75" />
              </svg>
              Processing...
            </span>
          ) : (
            `Complete Order — ${formatPrice(total)}`
          )}
        </button>
      </div>

      {/* Right column — Order Summary */}
      <div className="lg:col-span-2">
        <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-200 dark:bg-dark-100">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <HiOutlineShoppingCart className="h-5 w-5 text-primary-500" />
            Order Summary
          </h2>

          {/* Items */}
          <div className="space-y-3 max-h-72 overflow-y-auto mb-4">
            {items.map((item: CartItem) => {
              const itemKey = `${item.productId}__${item.selectedSize || "default"}`;
              return (
                <div key={itemKey} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-dark-200">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <HiOutlineShoppingCart className="h-5 w-5" />
                      </div>
                    )}
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-[10px] font-bold text-white">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.name}
                    </p>
                    {item.selectedSize && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.selectedSize}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>

          <hr className="border-gray-200 dark:border-dark-200" />

          {/* Totals */}
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatPrice(cartTotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Shipping</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatPrice(shippingCost)}
              </span>
            </div>
          </div>

          <hr className="my-4 border-gray-200 dark:border-dark-200" />

          <div className="flex justify-between">
            <span className="text-base font-bold text-gray-900 dark:text-white">
              Total
            </span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {formatPrice(total)}
            </span>
          </div>

          {/* Submit button (desktop) */}
          <button
            type="submit"
            disabled={isSubmitting || items.length === 0}
            className="mt-6 hidden w-full rounded-xl bg-primary-500 py-4 text-base font-bold text-white transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/25 disabled:cursor-not-allowed disabled:opacity-50 lg:block"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" className="opacity-75" />
                </svg>
                Processing...
              </span>
            ) : (
              `Complete Order — ${formatPrice(total)}`
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
