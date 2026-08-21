import './globals.css';
import Script from 'next/script';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Safed Sheri 2026 — One Night, One Colour, Infinite Memories.',
  description: 'Exclusive single-page immersive Garba experience for Safed Sheri 2026 taking place on 9 October 2026.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="beforeInteractive" />
      </head>
      <body className="bg-[#FDFBF7] text-[#2D2319] antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
