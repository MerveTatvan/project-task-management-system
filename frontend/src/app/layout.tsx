import "./globals.css";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-950 text-slate-900 antialiased">
        {children}

        {/* 🔥 Toast notifications (global) */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "14px",
              background: "#0f172a",
              color: "#fff",
              boxShadow: "0 20px 45px rgba(15, 23, 42, 0.25)",
            },
            success: {
              style: {
                background: "#ecfdf5",
                color: "#047857",
              },
            },
            error: {
              style: {
                background: "#fef2f2",
                color: "#dc2626",
              },
            },
          }}
        />
      </body>
    </html>
  );
}