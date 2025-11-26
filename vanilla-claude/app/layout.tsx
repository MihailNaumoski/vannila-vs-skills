import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LaunchList - Join the Waitlist",
  description:
    "Be the first to know when we launch. Join our waitlist for early access.",
  openGraph: {
    title: "LaunchList - Join the Waitlist",
    description:
      "Be the first to know when we launch. Join our waitlist for early access.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
