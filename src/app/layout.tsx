import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "3Dify BD — Premium 3D Printed Products",
    template: "%s | 3Dify BD",
  },
  description:
    "Premium 3D printed products made to order in Bangladesh. Figurines, phone cases, home decor, and custom models.",
  keywords: [
    "3D printing",
    "3D printed products",
    "Bangladesh",
    "figurines",
    "phone cases",
    "home decor",
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
            __html: `(function(){try{var stored=localStorage.getItem('theme');var theme=stored==='light'?'light':'dark';var root=document.documentElement;if(theme==='dark'){root.classList.add('dark');}else{root.classList.remove('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body
        className={`${inter.className} antialiased bg-white dark:bg-dark text-gray-900 dark:text-gray-100 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
