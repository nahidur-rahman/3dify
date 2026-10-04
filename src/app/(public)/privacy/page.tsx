import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How 3Dify BD collects, uses, and protects your information when you browse and order.",
};

const sections = [
  {
    title: "Information we collect",
    paragraphs: [
      "When you place an order we collect your name, phone number, email address, delivery address, and the items you ordered. We use this to confirm, prepare, and deliver your order and to contact you about it.",
      "When you browse the site we collect basic usage information such as the pages and products you view, items you add to your cart, and whether you start or complete a checkout.",
    ],
  },
  {
    title: "Cookies and advertising",
    paragraphs: [
      "We use the Meta Pixel and Meta Conversions API. These use cookies and similar technologies to measure how our Facebook and Instagram ads perform and to show you relevant 3Dify BD products after you visit.",
      "When you place an order, we may share your phone number and email with Meta only in hashed (scrambled) form, so they can be matched to an existing account without being readable. We never sell your personal information.",
      "You can limit ad personalisation at any time from your Facebook or Instagram ad preferences, or by blocking cookies in your browser. The site and checkout work normally either way.",
    ],
  },
  {
    title: "How we use your information",
    paragraphs: [
      "To process and deliver orders, provide order tracking and customer support, improve our products and website, and measure and improve our marketing.",
    ],
  },
  {
    title: "Who we share it with",
    paragraphs: [
      "Delivery partners receive the name, phone number, and address needed to deliver your order. Our hosting and database providers store order data on our behalf. Meta receives the browsing and hashed order information described above.",
    ],
  },
  {
    title: "Your choices",
    paragraphs: [
      "You can ask us to correct or delete the personal information we hold about you by contacting us on WhatsApp or Messenger using the links on this site. We keep order records only as long as needed for delivery, support, and accounting.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400">
        3Dify BD respects your privacy. This page explains what information we
        collect when you use our website and how we use it.
      </p>

      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
              {section.title}
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400 sm:text-base">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 text-sm text-gray-500 dark:text-gray-400">
        Questions about this policy?{" "}
        <Link href="/about" className="font-medium text-primary-600 hover:text-primary-500">
          Get in touch with us
        </Link>
        .
      </p>
    </div>
  );
}
