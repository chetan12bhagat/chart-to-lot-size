import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chart to Lot Size | AI & Manual Trading Calculator",
  description:
    "Paste or upload your trading chart screenshot, read entry, stop loss, and take profit with Claude AI, and calculate your exact lot size instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased flex flex-col items-center py-6 px-3 sm:px-6">
        {children}
      </body>
    </html>
  );
}
