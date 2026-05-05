import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hema and Raj 25th Wedding Anniversary",
  description: "RSVP for Hema and Raj's 25th wedding anniversary celebration."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
