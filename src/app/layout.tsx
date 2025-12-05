import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar"; // Import the Sidebar

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Internship Dashboard",
  description: "Task Manager and Dashboard Project",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased flex", // 'flex' puts sidebar next to content
          inter.className
        )}
      >
        {/* Sidebar Component */}
        <Sidebar />

        {/* Main Page Content */}
        <main className="flex-1 p-8 bg-gray-50/10 h-screen overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}