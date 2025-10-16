import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthWrapper from "@/components/AuthWrapper";
import { Suspense } from "react";
import { DataProvider } from "@/contexts/DataContext"; // 1. Import our new provider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Outfit Rater",
  description: "Get AI feedback on your style",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 2. Wrap the AuthWrapper with the DataProvider */}
        <DataProvider>
          <AuthWrapper>
            <Suspense
              fallback={
                <div className="flex justify-center items-center h-screen bg-pastel-beige">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              }
            >
              {children}
            </Suspense>
          </AuthWrapper>
        </DataProvider>
      </body>
    </html>
  );
}