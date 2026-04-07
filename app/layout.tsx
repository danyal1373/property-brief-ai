import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Property Compare Brief",
  description: "LLM-assisted property comparison with reconciled multi-source data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
