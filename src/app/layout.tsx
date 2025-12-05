import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { Menu } from "lucide-react"; // Hamburger Icon
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Shadcn Drawer component

const inter = Inter({ subsets: ["latin"] });

// 1. FIX: Prevents the app from zooming out on phones
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Internship Chat App",
  description: "Real-time team collaboration tool",
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
          "min-h-screen bg-background font-sans antialiased",
          inter.className
        )}
      >
        {/* --- 1. MOBILE HEADER (Visible ONLY on small screens) --- */}
        {/* 'md:hidden' means: Hide this whole block on medium screens and larger */}
        <header className="md:hidden sticky top-0 z-30 border-b bg-gray-900 text-white p-4 flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800 shrink-0">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            {/* The Sidebar opens inside this drawer on mobile */}
            <SheetContent side="left" className="p-0 border-none w-72 bg-gray-900 text-white">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <h1 className="font-bold text-lg truncate">Team Chat</h1>
        </header>

        {/* --- 2. DESKTOP SIDEBAR (Visible ONLY on medium screens and up) --- */}
        {/* 'hidden md:flex' means: Hide by default, but show as Flex on medium screens */}
        <div className="hidden md:flex h-full w-64 flex-col fixed inset-y-0 z-20">
          <Sidebar />
        </div>

        {/* --- 3. MAIN CONTENT AREA --- */}
        {/* 'md:pl-64' pushes the content to the right on desktop to make room for the sidebar */}
        <main className="md:pl-64 h-screen flex flex-col">
          <div className="flex-1 h-full overflow-y-auto bg-gray-50/10 w-full">
             {children}
          </div>
        </main>
      </body>
    </html>
  );
}