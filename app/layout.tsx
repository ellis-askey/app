// app/layout.tsx
// Root layout — wraps all pages with session provider and base styles.

import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sales Progressor",
  description: "Transaction management for residential property sales",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}