import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });
const metadataBase = (() => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    return new URL(siteUrl);
  } catch {
    return new URL("http://localhost:3000");
  }
})();

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "3Dify BD — Premium 3D Printed Products",
    template: "%s | 3Dify BD",
  },
  icons: {
    icon: [
      {
        url: "/3Dify-fav-icon.png",
        type: "image/png",
      },
    ],
  },
  description:
    "Premium 3D printed products made to order in Bangladesh, including home decor, desk accessories, collectibles, cosplay props, pet accessories, and custom commissions.",
  keywords: [
    "3D printing",
    "3D printed products",
    "Bangladesh",
    "home decor",
    "desk accessories",
    "collectibles",
    "cosplay props",
    "custom gifts",
    "pet accessories",
    "custom 3D models",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var stored=localStorage.getItem('theme');var theme=stored==='dark'?'dark':'light';if(stored!=='dark'&&stored!=='light'){localStorage.setItem('theme',theme);}var root=document.documentElement;if(theme==='dark'){root.classList.add('dark');}else{root.classList.remove('dark');}}catch(e){document.documentElement.classList.remove('dark');}})();`,
          }}
        />
      </head>
      <body
        className={`${outfit.className} antialiased bg-surface-base dark:bg-dark text-gray-900 dark:text-gray-100 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
