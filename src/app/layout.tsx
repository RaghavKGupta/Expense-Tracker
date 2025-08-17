import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import SessionManager from "@/components/csv/SessionManager";
import { AuthProvider } from "@/components/auth/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ExpenseTracker - Personal Finance Management",
  description: "Track and manage your personal expenses with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <SessionManager>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
          </SessionManager>
        </AuthProvider>
      </body>
    </html>
  );
}
