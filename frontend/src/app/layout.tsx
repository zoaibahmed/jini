import type { Metadata } from 'next';
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/hooks/useAuth";
import "./globals.css";

export const metadata: Metadata = {
  title: "JNI Solutions | AI-Powered Driver Support Platform",
  description: "Advanced AI driver copilot, flight arrivals forecasting, TLC/city compliance tracking, and automated tax write-offs for Uber, Lyft, and commercial drivers.",
  keywords: ["TLC Driver Support", "Uber driver helper", "Lyft earnings", "JFK flight arrivals prediction", "TLC drug screening", "ride-share tax calculator"],
  authors: [{ name: "JNI Solutions Development Team" }],
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased selection:bg-gold-primary selection:text-black">
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

