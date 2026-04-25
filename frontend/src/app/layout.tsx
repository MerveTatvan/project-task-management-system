import "./globals.css";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        {children}

        {/* 🔥 Toast notifications (global) */}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}