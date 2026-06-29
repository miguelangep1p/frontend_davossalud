import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "Davos Salud",
  description: "Sistema de gestión clínica para Davos Salud",
  icons: {
    icon: "/davos-salud-logo-transparent.png",
    shortcut: "/davos-salud-logo-transparent.png",
    apple: "/davos-salud-logo-transparent.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <TooltipProvider>
          {children}
          <Toaster position="top-right" richColors />
        </TooltipProvider>
      </body>
    </html>
  );
}
