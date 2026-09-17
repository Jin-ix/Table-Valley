import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Valley Table POS",
  description: "POS & Sales Analytics System for Valley Table",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        {children}
      </body>
    </html>
  );
}
