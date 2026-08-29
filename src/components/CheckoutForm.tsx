"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/contexts/CartContext";
import { createOrder, type CreateOrderInput } from "@/lib/orders";
import {
  BANGLADESH_DISTRICTS,
  findBangladeshDistrict,
  getShippingMethodForDistrict,
} from "@/lib/bangladeshDistricts";
import { saveStoredOrder } from "@/lib/localOrderHistory";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import {
  HiChevronDown,
  HiOutlineShoppingCart,
  HiOutlineTruck,
  HiOutlineCash,
  HiOutlinePhone,
  HiOutlineUser,
  HiOutlineLocationMarker,
  HiOutlineMail,
  HiSearch,
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
    return "Please use a valid email(Gmail, Yahoo, Outlook, etc.)";
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
  const districtPickerRef = useRef<HTMLDivElement>(null);

  const [shippingRates, setShippingRates] = useState<ShippingOption[]>([
    { method: "INSIDE_DHAKA", label: "Inside Dhaka", price: 70 },
    { method: "OUTSIDE_DHAKA", label: "Outside Dhaka", price: 130 },
  ]);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    houseRoad: "",
    areaVillage: "",
    townCityThana: "",
    district: "",
    postalCode: "",
    notes: "",
  });

  const [isDistrictOpen, setIsDistrictOpen] = useState(false);
  const [districtQuery, setDistrictQuery] = useState("");
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

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!districtPickerRef.current?.contains(event.target as Node)) {
        setIsDistrictOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!isDistrictOpen) {
      setDistrictQuery("");
    }
  }, [isDistrictOpen]);

  const shippingMethod = form.district
    ? getShippingMethodForDistrict(form.district)
    : null;
  const shippingCost = shippingMethod
    ? shippingRates.find((rate) => rate.method === shippingMethod)?.price ??
      (shippingMethod === "INSIDE_DHAKA" ? 70 : 130)
    : null;
  const total = shippingCost === null ? null : cartTotal + shippingCost;
  const filteredDistricts = BANGLADESH_DISTRICTS.filter((district) =>
    district.toLowerCase().includes(districtQuery.trim().toLowerCase())
  );
  const submitLabel =
    total === null ? "Complete Order" : `Complete Order — ${formatPrice(total)}`;

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function selectDistrict(district: string) {
    updateField("district", district);
    setDistrictQuery("");
    setIsDistrictOpen(false);
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
    if (!form.areaVillage.trim()) clientErrors.areaVillage = ["Area / Village is required"];
    if (!form.townCityThana.trim()) {
      clientErrors.townCityThana = ["Town / City / Thana is required"];
    }
    if (!form.district.trim()) {
      clientErrors.district = ["District is required"];
    } else if (!findBangladeshDistrict(form.district)) {
      clientErrors.district = ["Select a valid district"];
    }

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setGlobalError("Please fix the errors below.");
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setGlobalError("");

    const normalizedDistrict = findBangladeshDistrict(form.district);

    const orderInput: CreateOrderInput = {
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerEmail: form.customerEmail,
      houseRoad: form.houseRoad || undefined,
      areaVillage: form.areaVillage,
      townCityThana: form.townCityThana,
      district: normalizedDistrict ?? form.district,
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
        const district = normalizedDistrict ?? form.district.trim();
        const resolvedShippingMethod = getShippingMethodForDistrict(district);
        const resolvedShippingCost =
          shippingRates.find((rate) => rate.method === resolvedShippingMethod)?.price ??
          (resolvedShippingMethod === "INSIDE_DHAKA" ? 70 : 130);

        saveStoredOrder({
          orderNumber: result.orderNumber,
          customerPhone: form.customerPhone,
          total: cartTotal + resolvedShippingCost,
          createdAt: new Date().toISOString(),
        });

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 lg:grid lg:grid-cols-5">
      {/* Right column — Order Summary (appears first on mobile) */}
      <div className="order-first lg:order-last lg:col-span-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-200 dark:bg-dark-100 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <HiOutlineShoppingCart className="h-5 w-5 text-primary-500" />
            Order Summary
          </h2>

          {/* Items */}
          <div className="space-y-3 max-h-72 overflow-y-auto mb-4 px-1 pt-4 pb-2">
            {items.map((item: CartItem) => {
              const itemKey = `${item.productId}__${item.selectedSize || "default"}`;
              return (
                <div key={itemKey} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-visible rounded-lg bg-gray-100 dark:bg-dark-200">
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
                    <span className="absolute -right-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-xs font-bold text-white shadow-lg z-50">
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
              <span
                className={`font-semibold ${shippingCost === null
                  ? "text-gray-400 dark:text-gray-500"
                  : "text-gray-900 dark:text-white"
                  }`}
              >
                {shippingCost === null ? "Select district" : formatPrice(shippingCost)}
              </span>
            </div>
          </div>

          <hr className="my-4 border-gray-200 dark:border-dark-200" />

          <div className="flex justify-between">
            <span className="text-base font-bold text-gray-900 dark:text-white">
              Total
            </span>
            <span
              className={`${total === null
                ? "text-sm font-semibold text-gray-400 dark:text-gray-500"
                : "text-xl font-bold text-gray-900 dark:text-white"
                }`}
            >
              {total === null ? "Select district" : formatPrice(total)}
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
              submitLabel
            )}
          </button>
        </div>
      </div>

      {/* Left column — Form */}
      <div className="order-last lg:order-first lg:col-span-3 space-y-6">
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
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9+]/g, "");
              updateField("customerPhone", value);
            }}
            onBlur={() => handleBlur("customerPhone")}
            className={`${inputClasses} ${errors.customerPhone ? errorInputClasses : ""}`}
          />
          <FieldError field="customerPhone" />
          {/* <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            Bangladeshi mobile number (01X-XXXXXXXX)
          </p> */}
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
            {/* <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              Gmail, Yahoo, Outlook, Hotmail, iCloud, etc.
            </p> */}
          </div>
        </section>

        {/* Shipping Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <HiOutlineTruck className="h-4 w-4 text-primary-500 flex-shrink-0" />
          <span>
            Delivery charge: Inside Dhaka <span className="font-semibold text-gray-900 dark:text-white">৳70</span>, Outside Dhaka <span className="font-semibold text-gray-900 dark:text-white">৳130</span>
          </span>
        </div>

        {/* Delivery */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineLocationMarker className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Delivery
            </h2>
          </div>
          <div className="space-y-3">
            {/* Full name */}
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
            
            {/* House No & Area Village */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <input
                  type="text"
                  placeholder="House No / Road No"
                  value={form.houseRoad}
                  onChange={(e) => updateField("houseRoad", e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Area / Village *"
                  value={form.areaVillage}
                  onChange={(e) => updateField("areaVillage", e.target.value)}
                  className={`${inputClasses} ${errors.areaVillage ? errorInputClasses : ""}`}
                />
                <FieldError field="areaVillage" />
              </div>
            </div>
            
            {/* Town, District & Postal code */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <input
                  type="text"
                  placeholder="Town / City / Thana *"
                  value={form.townCityThana}
                  onChange={(e) => updateField("townCityThana", e.target.value)}
                  className={`${inputClasses} ${errors.townCityThana ? errorInputClasses : ""}`}
                />
                <FieldError field="townCityThana" />
              </div>
              <div>
                <div ref={districtPickerRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDistrictOpen((prev) => !prev)}
                    className={`${inputClasses} flex items-center justify-between text-left ${errors.district ? errorInputClasses : ""} ${form.district
                      ? ""
                      : "text-gray-400 dark:text-gray-500"
                      }`}
                    aria-expanded={isDistrictOpen}
                    aria-haspopup="listbox"
                  >
                    <span className="truncate">{form.district || "District *"}</span>
                    <HiChevronDown
                      className={`h-4 w-4 flex-shrink-0 transition-transform ${isDistrictOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isDistrictOpen && (
                    <div className="absolute z-30 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-dark-200 dark:bg-dark-100">
                      <div className="border-b border-gray-100 p-3 dark:border-dark-200">
                        <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 dark:border-dark-300">
                          <HiSearch className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <input
                            type="text"
                            value={districtQuery}
                            onChange={(e) => setDistrictQuery(e.target.value)}
                            placeholder="Search district"
                            className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto p-2">
                        {filteredDistricts.length > 0 ? (
                          filteredDistricts.map((district) => (
                            <button
                              key={district}
                              type="button"
                              onClick={() => selectDistrict(district)}
                              className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${form.district === district
                                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                                : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-dark-200"
                                }`}
                            >
                              {district}
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                            No district found.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <FieldError field="district" />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Postal code (optional)"
                  value={form.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                  className={inputClasses}
                />
              </div>
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
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
