import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VD SFA - Velasco Digital",
  description: "Sistema de Distribución y Reparto Profesional",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
