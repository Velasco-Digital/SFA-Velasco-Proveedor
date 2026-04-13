// app/layout.tsx
import type { Metadata } from "next";


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
