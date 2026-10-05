import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "HAFK Dashboard", template: "%s · HAFK" },
  description: "Steuerzentrale für den Hans & Friends Discord-Bot",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${manrope.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "!bg-surface-2 !border-line-strong !text-text !font-sans",
          }}
        />
      </body>
    </html>
  );
}
