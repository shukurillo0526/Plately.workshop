import type { Metadata } from 'next';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/auth/auth-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Plately Workshop',
  description: 'Restaurant management portal for Plately — manage menus, orders, deliveries, and analytics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className="font-sans antialiased bg-[#0D1117] text-white"
      >
        <AuthProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </AuthProvider>
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#161b22',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'white',
            },
          }}
        />
      </body>
    </html>
  );
}
