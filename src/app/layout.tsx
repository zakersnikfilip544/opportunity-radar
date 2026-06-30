import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Opportunity Radar — AI-Powered Business Intelligence",
  description: "Discover real business opportunities before your competitors. AI scans thousands of sources daily to find where money is moving.",
  keywords: "business opportunities, sales intelligence, market intelligence, AI, funding, hiring signals",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#18181b",
              color: "#f4f4f5",
              border: "1px solid #27272a",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
