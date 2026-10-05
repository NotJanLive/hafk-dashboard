import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "HAFK-Bot Dashboard", template: "%s · HAFK-Bot" },
  description: "Dashboard für den HAFK-Bot",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{ className: "!bg-surface-2 !border-border-strong !text-text !font-sans !rounded-xl" }}
        />
      </body>
    </html>
  );
}
