import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alexichelin — combined restaurant scores",
  description:
    "Type a restaurant and get a one-pager combining its reviews across Reddit, Instagram, Google and Michelin into a single score.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
