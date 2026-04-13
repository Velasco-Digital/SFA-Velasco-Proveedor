// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css"; // No te preocupes si marca error aquí ahorita

export const metadata: Metadata = {
  title: "VD SFA - Velasco Digital",
  description: "Sistema de Distribución y Reparto",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, backgroundColor: 'black' }}>
        {children}
      </body>
    </html>
  );
}
