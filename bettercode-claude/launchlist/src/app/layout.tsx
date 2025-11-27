import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "LaunchList - Join the Waitlist",
    template: "%s | LaunchList",
  },
  description:
    "Be the first to know when we launch. Join thousands of others on our waitlist.",
  openGraph: {
    title: "LaunchList - Join the Waitlist",
    description:
      "Be the first to know when we launch. Join thousands of others on our waitlist.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LaunchList - Join the Waitlist",
    description:
      "Be the first to know when we launch. Join thousands of others on our waitlist.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
