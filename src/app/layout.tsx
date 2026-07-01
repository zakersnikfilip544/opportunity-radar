import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Opportunity Radar — poslovna obveščevalna platforma z umetno inteligenco",
  description: "Odkrijte resnične poslovne priložnosti pred konkurenco. Umetna inteligenca vsak dan preišče tisoče virov, da najde, kje se premika denar.",
  keywords: "poslovne priložnosti, prodajna obveščevalna dejavnost, tržna obveščevalna dejavnost, umetna inteligenca, financiranje, signali zaposlovanja",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl" className="dark">
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
